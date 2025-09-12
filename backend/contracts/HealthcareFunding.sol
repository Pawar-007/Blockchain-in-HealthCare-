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
        bool visible;               // becomes true after verification
        bool active;
        uint256 totalFunded;
        string[] medicalRecords;    // array of IPFS CIDs
    }

    // -----------------------------
    // STATE
    // -----------------------------
    address public owner;
    mapping(address => bool) public admins;

    // Each patient wallet => their funding request
    mapping(address => Request) public requestsByPatient;
    address[] public patientList;

    // Donor tracking (patient -> donor -> amount)
    mapping(address => mapping(address => uint256)) public donorAmounts;

    // -----------------------------
    // EVENTS
    // -----------------------------
    event RequestCreated(address indexed patient, string name, string diseaseType);
    event RequestVisible(address indexed patient);
    event Donated(address indexed patient, address indexed donor, uint256 amount);
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
        admins[msg.sender] = true; // main admin
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
        string memory diseaseType
    ) external {
        Request storage r = requestsByPatient[msg.sender];
        require(!r.active, "Already has active request");

        requestsByPatient[msg.sender] = Request({
            patient: msg.sender,
            name: name,
            description: description,
            createdAt: block.timestamp,  // store request creation time
            deadline: deadline,
            hospitalWallet: hospitalWallet,
            diseaseType: diseaseType,
            patientCallVerified: false,
            hospitalCrosscheckVerified: false,
            physicalVisitVerified: false,
            visible: false,
            active: true,
            totalFunded: 0,
            medicalRecords: new string[](0)  // initialize empty array
        });

        patientList.push(msg.sender);
        emit RequestCreated(msg.sender, name, diseaseType);
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
        require(block.timestamp <= r.deadline, "Deadline passed");
        require(msg.value > 0, "Must send ETH");

        donorAmounts[patient][msg.sender] += msg.value;
        r.totalFunded += msg.value;

        emit Donated(patient, msg.sender, msg.value);
    }

    // -----------------------------
    // FUND RELEASE
    // -----------------------------
    function releaseFunds(address patient) external onlyAdmin {
        Request storage r = requestsByPatient[patient];
        require(r.active, "Inactive request");
        require(r.visible, "Not verified");
        require(r.totalFunded > 0, "No funds");

        uint256 amount = r.totalFunded;
        r.totalFunded = 0;
        r.active = false;

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
}
