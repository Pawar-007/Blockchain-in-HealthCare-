// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HealthcareFunding {
    // -----------------------------
    // STRUCTS
    // -----------------------------
    struct Request {
        address patient;
        string name;
        string description;
        uint256 createdAt;
        uint256 deadline;
        address hospitalWallet;
        string diseaseType;
        bool patientCallVerified;
        bool hospitalCrosscheckVerified;
        bool physicalVisitVerified;
        string contactNumber;  
        bool visible;
        bool active;
        bool isFunded;            
        uint256 totalFunded;
        uint256 goalAmount;
        string[] medicalRecords;
    }

    struct TransactionDetail {
        uint256 txId;
        address donor;
        address patient;
        uint256 amount;
        uint256 timestamp;
    }

    // -----------------------------
    // STATE
    // -----------------------------
    address public owner;
    mapping(address => bool) public admins;

    mapping(address => Request) public requestsByPatient;
    address[] public patientList;

    mapping(address => mapping(address => uint256)) public donorAmounts;

    // 🆕 NEW TRANSACTION STATE
    TransactionDetail[] public allTransactions;
    mapping(address => uint256[]) public transactionsByPatient; // patient → txIds
    mapping(address => uint256[]) public transactionsByDonor;   // donor → txIds

    uint256 private nextTxId = 1;

    // -----------------------------
    // EVENTS
    // -----------------------------
    event RequestCreated(address indexed patient, string name, string diseaseType);
    event RequestVisible(address indexed patient);
    event Donated(address indexed patient, address indexed donor, uint256 amount, uint256 txId);
    event FundsReleased(address indexed patient, uint256 amount, address hospitalWallet);
    event MedicalRecordAdded(address indexed patient, string cid);

    // -----------------------------
    // MODIFIERS
    // -----------------------------
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAdmin() {
        require(admins[msg.sender], "Not admin");
        _;
    }

    // -----------------------------
    // CONSTRUCTOR
    // -----------------------------
    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    // -----------------------------
    // ADMIN MANAGEMENT
    // -----------------------------
    function addAdmin(address _admin) external onlyOwner {
        admins[_admin] = true;
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
    }

    // -----------------------------
    // REQUEST CREATION
    // -----------------------------
    function createRequest(
        string memory name,
        string memory description,
        uint256 deadline,
        address hospitalWallet,
        string memory diseaseType,
        string memory contactNumber,
        uint256 goalAmount
    ) external {
        Request storage r = requestsByPatient[msg.sender];
        require(!r.active, "Already has active request");

        requestsByPatient[msg.sender] = Request({
            patient: msg.sender,
            name: name,
            description: description,
            createdAt: block.timestamp,
            deadline: deadline,
            hospitalWallet: hospitalWallet,
            diseaseType: diseaseType,
            contactNumber: contactNumber,
            patientCallVerified: false,
            hospitalCrosscheckVerified: false,
            physicalVisitVerified: false,
            visible: false,
            active: true,
            isFunded: false,
            totalFunded: 0,
            goalAmount: goalAmount,
            medicalRecords: new string[](0)
        });

        patientList.push(msg.sender);
        emit RequestCreated(msg.sender, name, diseaseType);
    }

    // -----------------------------
    // CROWD DONATION
    // -----------------------------
    uint256 public totalCrowdFunded;
    mapping(address => uint256) public crowdDonorAmounts;

    function donateToCrowd() external payable {
        require(msg.value > 0, "Must send ETH");

        crowdDonorAmounts[msg.sender] += msg.value;
        totalCrowdFunded += msg.value;

        // Record transaction (patient = address(0) means crowd pool)
        allTransactions.push(
            TransactionDetail({
                txId: nextTxId,
                donor: msg.sender,
                patient: address(0),
                amount: msg.value,
                timestamp: block.timestamp
            })
        );

        transactionsByDonor[msg.sender].push(nextTxId);
        nextTxId++;

        emit Donated(address(0), msg.sender, msg.value, nextTxId - 1);
    }

    // -----------------------------
    // MEDICAL RECORD MANAGEMENT
    // -----------------------------
    function addMedicalRecord(string memory cid) external {
        Request storage r = requestsByPatient[msg.sender];
        require(r.active, "Request is not active");
        r.medicalRecords.push(cid);
        emit MedicalRecordAdded(msg.sender, cid);
    }

    // -----------------------------
    // VERIFICATION PROCESS
    // -----------------------------
    function verifyPatientCall(address patient) external onlyAdmin {
        requestsByPatient[patient].patientCallVerified = true;
        _tryMakeVisible(patient);
    }

    function verifyHospitalCrosscheck(address patient) external onlyAdmin {
        requestsByPatient[patient].hospitalCrosscheckVerified = true;
        _tryMakeVisible(patient);
    }

    function verifyPhysicalVisit(address patient) external onlyAdmin {
        requestsByPatient[patient].physicalVisitVerified = true;
        _tryMakeVisible(patient);
    }

    function _tryMakeVisible(address patient) internal {
        Request storage r = requestsByPatient[patient];
        if (
            r.patientCallVerified &&
            r.hospitalCrosscheckVerified &&
            r.physicalVisitVerified &&
            !r.visible
        ) {
            r.visible = true;
            emit RequestVisible(patient);
        }
    }

    // -----------------------------
    // DONATIONS
    // -----------------------------
    function donate(address patient) external payable {
        Request storage r = requestsByPatient[patient];
        require(r.active, "Inactive request");
        require(r.visible, "Not verified yet");
        require(!r.isFunded, "Funds already released");
        require(block.timestamp <= r.deadline, "Deadline passed");
        require(msg.value > 0, "Must send ETH");

        donorAmounts[patient][msg.sender] += msg.value;
        r.totalFunded += msg.value;

        // 🆕 Record transaction
        allTransactions.push(
            TransactionDetail({
                txId: nextTxId,
                donor: msg.sender,
                patient: patient,
                amount: msg.value,
                timestamp: block.timestamp
            })
        );
        transactionsByDonor[msg.sender].push(nextTxId);
        transactionsByPatient[patient].push(nextTxId);
        emit Donated(patient, msg.sender, msg.value, nextTxId);
        nextTxId++;
    }

    // -----------------------------
    // FUND RELEASE
    // -----------------------------
    function releaseFunds(address patient) external onlyAdmin {
        Request storage r = requestsByPatient[patient];
        require(r.active, "Inactive request");
        require(r.visible, "Not verified");
        require(!r.isFunded, "Already funded");
        require(r.totalFunded > 0, "No funds");

        uint256 amount = r.totalFunded;
        r.totalFunded = 0;
        r.active = false;
        r.isFunded = true;

        (bool success, ) = r.hospitalWallet.call{value: amount}("");
        require(success, "Transfer failed");

        emit FundsReleased(patient, amount, r.hospitalWallet);
    }

    // -----------------------------
    // VIEW HELPERS
    // -----------------------------
    function getRequest(address patient) external view returns (Request memory) {
        return requestsByPatient[patient];
    }

    function getDonation(address patient, address donor) external view returns (uint256) {
        return donorAmounts[patient][donor];
    }

    function getAllRequests() external view returns (Request[] memory) {
        uint256 total = patientList.length;
        Request[] memory all = new Request[](total);

        for (uint i = 0; i < total; i++) {
            all[i] = requestsByPatient[patientList[i]];
        }

        return all;
    }

    function getVerifiedNotFundedRequests() external view returns (Request[] memory) {
        uint256 total = patientList.length;
        uint256 count = 0;

        for (uint i = 0; i < total; i++) {
            Request storage r = requestsByPatient[patientList[i]];
            if (r.visible && !r.isFunded) {
                count++;
            }
        }

        Request[] memory filtered = new Request[](count);
        uint256 index = 0;
        for (uint i = 0; i < total; i++) {
            Request storage r = requestsByPatient[patientList[i]];
            if (r.visible && !r.isFunded) {
                filtered[index] = r;
                index++;
            }
        }
        return filtered;
    }

    // -----------------------------
    // 🆕 NEW VIEW FUNCTIONS
    // -----------------------------
    function getAllTransactions() external view returns (TransactionDetail[] memory) {
        return allTransactions;
    }

    function getTransactionsByPatient(address patient) external view returns (TransactionDetail[] memory) {
        uint256[] memory ids = transactionsByPatient[patient];
        TransactionDetail[] memory result = new TransactionDetail[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            result[i] = allTransactions[ids[i] - 1];
        }
        return result;
    }

    function getTransactionsByDonor(address donor) external view returns (TransactionDetail[] memory) {
        uint256[] memory ids = transactionsByDonor[donor];
        TransactionDetail[] memory result = new TransactionDetail[](ids.length);
        for (uint i = 0; i < ids.length; i++) {
            result[i] = allTransactions[ids[i] - 1];
        }
        return result;
    }

    // -----------------------------
// HELPER FUNCTIONS
// -----------------------------
function getPatientsDonatedBy(address donor) external view returns (address[] memory) {
    uint256[] memory ids = transactionsByDonor[donor];
    address[] memory patients = new address[](ids.length);

    for (uint i = 0; i < ids.length; i++) {
        patients[i] = allTransactions[ids[i] - 1].patient;
    }
    return patients;
}

}
