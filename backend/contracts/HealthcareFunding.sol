// SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// /// @title HealthcareFundingOrchestrator (improved)
// /// @notice Improved version of your funding orchestrator with clearer errors, safer refund/disbursement rules,
// ///         corrected permission checks, and some gas/readability improvements.
// contract HealthcareFundingOrchestrator {
//     // -----------------------------
//     // ERRORS (explicit, gas-friendly)
//     // -----------------------------
//     error Unauthorized();
//     error NotHospital();
//     error InvalidRequest();
//     error AlreadyApproved();
//     error NotApproved();
//     error AlreadyCanceled();
//     error AlreadyDisbursed();
//     error NotVisible();
//     error ZeroValue();
//     error ZeroAddress();
//     error OverPool();
//     error NothingToRefund();
//     error DeadlineTooSoon();
//     error DonationsClosed();
//     error RequestNotOpen();
//     error RefundNotAllowedAfterDisbursement();

//     // -----------------------------
//     // ROLES
//     // -----------------------------
//     address public immutable admin;
//     mapping(address => bool) public hospitals; // whitelist of hospital verifier accounts

//     modifier onlyAdmin() {
//         if (msg.sender != admin) revert Unauthorized();
//         _;
//     }
//     modifier onlyHospital() {
//         if (!hospitals[msg.sender]) revert NotHospital();
//         _;
//     }

//     // -----------------------------
//     // REENTRANCY
//     // -----------------------------
//     uint256 private _reentrancyLock = 1;
//     modifier nonReentrant() {
//         if (_reentrancyLock != 1) revert Unauthorized();
//         _reentrancyLock = 2;
//         _;
//         _reentrancyLock = 1;
//     }

//     constructor() {
//         admin = msg.sender;
//     }

//     // -----------------------------
//     // MODEL
//     // -----------------------------
//     enum State {
//         Pending,
//         UnderReview,
//         Approved,
//         Canceled,
//         Disbursed
//     }

//     struct Request {
//         // actors & verification
//         address patient;
//         address payable hospitalWallet;
//         address hospitalVerifier;
//         // money
//         uint256 goal;
//         uint256 raised;
//         uint256 disbursed;
//         uint64 deadline;
//         // state flags
//         State state;
//         bool adminCallDone;
//         bool hospitalVerified;
//         bool physicalVisitDone;
//         // metadata & pointers
//         string title;
//         string description;
//         string patientDataCID;
//         string hospitalDataCID;
//         string documentsBundleCID;
//         address storageContract;
//         uint256[] recordIds;
//     }

//     uint256 public requestCount;
//     mapping(uint256 => Request) private requests;

//     // donor ledger per request
//     mapping(uint256 => mapping(address => uint256)) public contributions;
//     mapping(uint256 => address[]) public donorsList;
//     mapping(uint256 => mapping(address => bool)) private _seenDonor;

//     // general pool
//     uint256 public generalPool;

//     // -----------------------------
//     // EVENTS
//     // -----------------------------
//     event HospitalWhitelisted(address indexed hospital, bool allowed);

//     event RequestCreated(uint256 indexed id, address indexed patient, address indexed hospitalWallet, uint256 goal, uint64 deadline);
//     event RequestVerificationUpdated(uint256 indexed id, bool adminCallDone, bool hospitalVerified, bool physicalVisitDone, address hospitalVerifier);
//     event RequestApproved(uint256 indexed id);
//     event RequestCanceled(uint256 indexed id);
//     event DonationReceived(uint256 indexed id, address indexed donor, uint256 amount, uint256 newRaised);
//     event GeneralPoolDonation(address indexed donor, uint256 amount, uint256 newPoolBalance);
//     event GeneralPoolAllocated(uint256 indexed id, uint256 amount, uint256 newRaised, uint256 newPoolBalance);
//     event Disbursed(uint256 indexed id, address indexed hospitalWallet, uint256 amount);
//     event RequestCompleted(uint256 indexed id, address indexed patient);
//     event RefundIssued(uint256 indexed id, address indexed donor, uint256 amount);

//     // -----------------------------
//     // ADMIN / HOSPITAL OPERATIONS
//     // -----------------------------
//     function setHospital(address hospital, bool allowed) external onlyAdmin {
//         if (hospital == address(0)) revert ZeroAddress();
//         hospitals[hospital] = allowed;
//         emit HospitalWhitelisted(hospital, allowed);
//     }

//     // -----------------------------
//     // CREATE REQUEST
//     // -----------------------------
//     function createRequest(
//         address payable _hospitalWallet,
//         uint256 _goal,
//         uint64 _deadline,
//         string calldata _title,
//         string calldata _description,
//         string calldata _patientDataCID,
//         string calldata _hospitalDataCID,
//         string calldata _documentsBundleCID,
//         address _storageContract,
//         uint256[] calldata _recordIds
//     ) external returns (uint256 id) {
//         if (_hospitalWallet == address(0)) revert ZeroAddress();
//         if (_goal == 0) revert ZeroValue();
//         if (_deadline <= block.timestamp + 1 days) revert DeadlineTooSoon();

//         id = ++requestCount;
//         Request storage r = requests[id];

//         r.patient = msg.sender;
//         r.hospitalWallet = _hospitalWallet;
//         r.goal = _goal;
//         r.raised = 0;
//         r.disbursed = 0;
//         r.deadline = _deadline;
//         r.state = State.Pending;

//         r.title = _title;
//         r.description = _description;
//         r.patientDataCID = _patientDataCID;
//         r.hospitalDataCID = _hospitalDataCID;
//         r.documentsBundleCID = _documentsBundleCID;
//         r.storageContract = _storageContract;

//         if (_recordIds.length > 0) {
//             r.recordIds = _recordIds;
//         }

//         emit RequestCreated(id, msg.sender, _hospitalWallet, _goal, _deadline);
//     }

//     // -----------------------------
//     // VERIFICATION PIPELINE
//     // -----------------------------
//     function setAdminCallDone(uint256 _id, bool _done) external onlyAdmin {
//         Request storage r = _getRequest(_id);
//         if (r.state == State.Canceled || r.state == State.Disbursed) revert RequestNotOpen();
//         r.adminCallDone = _done;
//         _maybeMoveUnderReview(r);
//         emit RequestVerificationUpdated(_id, r.adminCallDone, r.hospitalVerified, r.physicalVisitDone, r.hospitalVerifier);
//     }

//     function setHospitalVerified(uint256 _id, bool _done) external onlyHospital {
//         Request storage r = _getRequest(_id);
//         if (r.state == State.Canceled || r.state == State.Disbursed) revert RequestNotOpen();
//         r.hospitalVerified = _done;
//         r.hospitalVerifier = msg.sender;
//         _maybeMoveUnderReview(r);
//         emit RequestVerificationUpdated(_id, r.adminCallDone, r.hospitalVerified, r.physicalVisitDone, r.hospitalVerifier);
//     }

//     function setPhysicalVisit(uint256 _id, bool _done) external onlyAdmin {
//         Request storage r = _getRequest(_id);
//         if (r.state == State.Canceled || r.state == State.Disbursed) revert RequestNotOpen();
//         r.physicalVisitDone = _done;
//         _maybeMoveUnderReview(r);
//         emit RequestVerificationUpdated(_id, r.adminCallDone, r.hospitalVerified, r.physicalVisitDone, r.hospitalVerifier);
//     }

//     function approve(uint256 _id) external onlyAdmin {
//         Request storage r = _getRequest(_id);
//         if (r.state == State.Canceled || r.state == State.Disbursed) revert RequestNotOpen();
//         if (!(r.adminCallDone && r.hospitalVerified && r.physicalVisitDone)) revert NotApproved();
//         if (r.state == State.Approved) revert AlreadyApproved();
//         r.state = State.Approved;
//         emit RequestApproved(_id);
//     }

//     /// Admin or patient can cancel
//     function cancel(uint256 _id) external {
//         Request storage r = _getRequest(_id);
//         // admin or the patient can cancel
//         if (msg.sender != admin && msg.sender != r.patient) revert Unauthorized();
//         if (r.state == State.Canceled) revert AlreadyCanceled();
//         if (r.state == State.Disbursed) revert AlreadyDisbursed();
//         r.state = State.Canceled;
//         emit RequestCanceled(_id);
//     }

//     function _maybeMoveUnderReview(Request storage r) internal {
//         if (r.state == State.Pending) {
//             if (r.adminCallDone || r.hospitalVerified || r.physicalVisitDone) {
//                 r.state = State.UnderReview;
//             }
//         }
//     }

//     // -----------------------------
//     // DONATIONS
//     // -----------------------------
//     /// Donate to a specific approved request
//     function donateToRequest(uint256 _id) external payable nonReentrant {
//         Request storage r = _getRequest(_id);
//         if (r.state != State.Approved) revert NotVisible();
//         if (block.timestamp > r.deadline) revert DonationsClosed();
//         if (msg.value == 0) revert ZeroValue();

//         r.raised += msg.value;

//         if (!_seenDonor[_id][msg.sender]) {
//             _seenDonor[_id][msg.sender] = true;
//             donorsList[_id].push(msg.sender);
//         }
//         contributions[_id][msg.sender] += msg.value;

//         emit DonationReceived(_id, msg.sender, msg.value, r.raised);
//     }

//     /// Donate to general pool
//     function donateToPool() external payable nonReentrant {
//         if (msg.value == 0) revert ZeroValue();
//         generalPool += msg.value;
//         emit GeneralPoolDonation(msg.sender, msg.value, generalPool);
//     }

//     /// Admin allocates pool funds to a request (escrowed in contract)
//     function allocateFromPool(uint256 _id, uint256 _amount) external onlyAdmin {
//         Request storage r = _getRequest(_id);
//         if (r.state != State.Approved) revert NotVisible();
//         if (_amount == 0 || _amount > generalPool) revert OverPool();
//         r.raised += _amount;
//         generalPool -= _amount;
//         emit GeneralPoolAllocated(_id, _amount, r.raised, generalPool);
//     }

//     // -----------------------------
//     // DISBURSEMENT & REFUNDS
//     // -----------------------------
//     /// Admin disburses to hospital. Cannot disburse more than available.
//     function disburseToHospital(uint256 _id, uint256 _amount) external onlyAdmin nonReentrant {
//         Request storage r = _getRequest(_id);
//         if (r.state == State.Canceled) revert AlreadyCanceled();
//         if (r.state == State.Disbursed) revert AlreadyDisbursed();
//         if (r.state != State.Approved) revert NotVisible();

//         uint256 available = r.raised - r.disbursed;
//         if (_amount == 0 || _amount > available) revert ZeroValue();

//         r.disbursed += _amount;

//         // transfer
//         (bool ok, ) = r.hospitalWallet.call{value: _amount}("");
//         require(ok, "DISBURSE_FAIL");

//         emit Disbursed(_id, r.hospitalWallet, _amount);

//         // if fully met goal or fully disbursed to match business rules mark Disbursed
//         if (r.disbursed >= r.goal) {
//             r.state = State.Disbursed;
//             emit RequestCompleted(_id, r.patient);
//         }
//     }

//     /// Donor refund: only allowed if request canceled OR deadline passed AND no disbursement happened.
//     /// NOTE: If any disbursement already happened, refunds are NOT allowed here to avoid pro-rata complexity.
//     function refund(uint256 _id) external nonReentrant {
//         Request storage r = _getRequest(_id);
//         if (r.state == State.Disbursed) revert AlreadyDisbursed();

//         bool eligible = (r.state == State.Canceled) || (block.timestamp > r.deadline);
//         if (!eligible) revert RequestNotOpen();

//         // If any disbursement already happened, pro-rata refund is required (not supported here)
//         if (r.disbursed > 0) revert RefundNotAllowedAfterDisbursement();

//         uint256 amt = contributions[_id][msg.sender];
//         if (amt == 0) revert NothingToRefund();

//         // zero contribution then refund
//         contributions[_id][msg.sender] = 0;
//         // keep r.raised consistent
//         r.raised -= amt;

//         (bool ok, ) = payable(msg.sender).call{value: amt}("");
//         require(ok, "REFUND_FAIL");

//         emit RefundIssued(_id, msg.sender, amt);
//     }

//     // -----------------------------
//     // VIEWS
//     // -----------------------------
//     function getRequest(uint256 _id)
//         external
//         view
//         returns (
//             address patient,
//             address hospitalWallet,
//             address hospitalVerifier,
//             uint256 goal,
//             uint256 raised,
//             uint256 disbursed,
//             uint64 deadline,
//             State state,
//             bool adminCallDone,
//             bool hospitalVerified,
//             bool physicalVisitDone,
//             string memory title,
//             string memory description,
//             string memory patientDataCID,
//             string memory hospitalDataCID,
//             string memory documentsBundleCID,
//             address storageContract,
//             uint256[] memory recordIds
//         )
//     {
//         Request storage r = _getRequest(_id);
//         return (
//             r.patient,
//             r.hospitalWallet,
//             r.hospitalVerifier,
//             r.goal,
//             r.raised,
//             r.disbursed,
//             r.deadline,
//             r.state,
//             r.adminCallDone,
//             r.hospitalVerified,
//             r.physicalVisitDone,
//             r.title,
//             r.description,
//             r.patientDataCID,
//             r.hospitalDataCID,
//             r.documentsBundleCID,
//             r.storageContract,
//             r.recordIds
//         );
//     }

//     function getDonors(uint256 _id) external view returns (address[] memory donors, uint256[] memory amounts) {
//         donors = donorsList[_id];
//         amounts = new uint256[](donors.length);
//         for (uint256 i = 0; i < donors.length; ++i) {
//             amounts[i] = contributions[_id][donors[i]];
//         }
//     }

//     // lightweight pagination for basic catalog
//     function getRequestsBasic(uint256 startId, uint256 count)
//         external
//         view
//         returns (uint256[] memory ids, State[] memory states, uint256[] memory goals, uint256[] memory raisedAmounts)
//     {
//         if (count == 0 || startId == 0 || startId > requestCount) {
//             return (new uint256, new State, new uint256, new uint256);
//         }

//         uint256 end = startId + count - 1;
//         if (end > requestCount) end = requestCount;
//         uint256 len = end - startId + 1;

//         ids = new uint256[](len);
//         states = new State[](len);
//         goals = new uint256[](len);
//         raisedAmounts = new uint256[](len);

//         for (uint256 i = 0; i < len; ++i) {
//             uint256 id = startId + i;
//             Request storage r = requests[id];
//             ids[i] = id;
//             states[i] = r.state;
//             goals[i] = r.goal;
//             raisedAmounts[i] = r.raised;
//         }
//     }

//     // -----------------------------
//     // INTERNALS
//     // -----------------------------
//     function _getRequest(uint256 _id) internal view returns (Request storage r) {
//         r = requests[_id];
//         if (r.patient == address(0)) revert InvalidRequest();
//     }

//     // accept tips
//     receive() external payable {}
//     fallback() external payable {}
// }

pragma solidity ^0.8.20;

/// @title HealthcareFundingOrchestrator (improved - multi-admin)
/// @notice Multiple admins can verify/approve/disburse. Owner manages admin list.
contract HealthcareFundingOrchestrator {
    // -----------------------------
    // ERRORS
    // -----------------------------
    error Unauthorized();
    error NotHospital();
    error InvalidRequest();
    error AlreadyApproved();
    error NotApproved();
    error AlreadyCanceled();
    error AlreadyDisbursed();
    error NotVisible();
    error ZeroValue();
    error ZeroAddress();
    error OverPool();
    error NothingToRefund();
    error DeadlineTooSoon();
    error DonationsClosed();
    error RequestNotOpen();
    error RefundNotAllowedAfterDisbursement();

    // -----------------------------
    // ROLES
    // -----------------------------
    address public owner;
    mapping(address => bool) public admins;
    mapping(address => bool) public hospitals;

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyAdmin() {
        if (!admins[msg.sender]) revert Unauthorized();
        _;
    }

    modifier onlyHospital() {
        if (!hospitals[msg.sender]) revert NotHospital();
        _;
    }

    // -----------------------------
    // REENTRANCY
    // -----------------------------
    uint256 private _reentrancyLock = 1;
    modifier nonReentrant() {
        if (_reentrancyLock != 1) revert Unauthorized();
        _reentrancyLock = 2;
        _;
        _reentrancyLock = 1;
    }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
    }

    // -----------------------------
    // MODEL
    // -----------------------------
    enum State {
        Pending,
        UnderReview,
        Approved,
        Canceled,
        Disbursed
    }

    struct Request {
        address patient;
        address payable hospitalWallet;
        address hospitalVerifier;
        uint256 goal;
        uint256 raised;
        uint256 disbursed;
        uint64 deadline;
        State state;
        bool adminCallDone;
        bool hospitalVerified;
        bool physicalVisitDone;
        string title;
        string description;
        string patientDataCID;
        string hospitalDataCID;
        string documentsBundleCID;
        address storageContract;
        uint256[] recordIds;
        address verifiedBy;
        address fundedBy;
    }

    uint256 public requestCount;
    mapping(uint256 => Request) private requests;

    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => address[]) public donorsList;
    mapping(uint256 => mapping(address => bool)) private _seenDonor;

    uint256 public generalPool;

    // -----------------------------
    // EVENTS
    // -----------------------------
    event AdminUpdated(address indexed admin, bool allowed);
    event HospitalWhitelisted(address indexed hospital, bool allowed);
    event RequestCreated(uint256 indexed id, address indexed patient, address indexed hospitalWallet, uint256 goal, uint64 deadline);
    event RequestVerificationUpdated(uint256 indexed id, bool adminCallDone, bool hospitalVerified, bool physicalVisitDone, address hospitalVerifier);
    event RequestApproved(uint256 indexed id, address indexed admin);
    event RequestCanceled(uint256 indexed id);
    event DonationReceived(uint256 indexed id, address indexed donor, uint256 amount, uint256 newRaised);
    event GeneralPoolDonation(address indexed donor, uint256 amount, uint256 newPoolBalance);
    event GeneralPoolAllocated(uint256 indexed id, uint256 amount, uint256 newRaised, uint256 newPoolBalance);
    event Disbursed(uint256 indexed id, address indexed hospitalWallet, uint256 amount, address indexed admin);
    event RequestCompleted(uint256 indexed id, address indexed patient);
    event RefundIssued(uint256 indexed id, address indexed donor, uint256 amount);

    // -----------------------------
    // OWNER / ADMIN MANAGEMENT
    // -----------------------------
    function addAdmin(address _admin) external onlyOwner {
        if (_admin == address(0)) revert ZeroAddress();
        admins[_admin] = true;
        emit AdminUpdated(_admin, true);
    }

    function removeAdmin(address _admin) external onlyOwner {
        admins[_admin] = false;
        emit AdminUpdated(_admin, false);
    }

    function setHospital(address hospital, bool allowed) external onlyAdmin {
        if (hospital == address(0)) revert ZeroAddress();
        hospitals[hospital] = allowed;
        emit HospitalWhitelisted(hospital, allowed);
    }

    // -----------------------------
    // CREATE REQUEST (split init)
    // -----------------------------
    function createRequest(
    address payable _hospitalWallet,
    uint256 _goal,
    uint64 _deadline,
    string calldata _title,
    string calldata _description,
    string calldata _patientDataCID,
    string calldata _hospitalDataCID,
    string calldata _documentsBundleCID,
    address _storageContract,
    uint256[] calldata _recordIds
) external returns (uint256 id) {
    // Validate inputs first (no struct access yet)
    if (_hospitalWallet == address(0)) revert ZeroAddress();
    if (_goal == 0) revert ZeroValue();
    if (_deadline <= block.timestamp + 1 days) revert DeadlineTooSoon();

    id = ++requestCount;
    Request storage r = requests[id];

    // Initialize core fields
    r.patient = msg.sender;
    r.hospitalWallet = _hospitalWallet;
    r.goal = _goal;
    r.deadline = _deadline;
    r.state = State.Pending;

    // Initialize metadata (avoid passing all params again)
    r.title = _title;
    r.description = _description;
    r.patientDataCID = _patientDataCID;
    r.hospitalDataCID = _hospitalDataCID;
    r.documentsBundleCID = _documentsBundleCID;
    r.storageContract = _storageContract;
    if (_recordIds.length > 0) r.recordIds = _recordIds;

    emit RequestCreated(id, msg.sender, _hospitalWallet, _goal, _deadline);
}

    function _validateRequestInputs(address _hospitalWallet, uint256 _goal, uint64 _deadline) internal view {
        if (_hospitalWallet == address(0)) revert ZeroAddress();
        if (_goal == 0) revert ZeroValue();
        if (_deadline <= block.timestamp + 1 days) revert DeadlineTooSoon();
    }

    function _initRequestCore(uint256 id, address payable _hospitalWallet, uint256 _goal, uint64 _deadline) internal {
        Request storage r = requests[id];
        r.patient = msg.sender;
        r.hospitalWallet = _hospitalWallet;
        r.goal = _goal;
        r.raised = 0;
        r.disbursed = 0;
        r.deadline = _deadline;
        r.state = State.Pending;
    }

    function _initRequestMetadata(
        uint256 id,
        string calldata _title,
        string calldata _description,
        string calldata _patientDataCID,
        string calldata _hospitalDataCID,
        string calldata _documentsBundleCID,
        address _storageContract,
        uint256[] calldata _recordIds
    ) internal {
        Request storage r = requests[id];
        r.title = _title;
        r.description = _description;
        r.patientDataCID = _patientDataCID;
        r.hospitalDataCID = _hospitalDataCID;
        r.documentsBundleCID = _documentsBundleCID;
        r.storageContract = _storageContract;
        if (_recordIds.length > 0) r.recordIds = _recordIds;
        emit RequestCreated(id, msg.sender, r.hospitalWallet, r.goal, r.deadline);
    }

    // -----------------------------
    // VERIFICATION PIPELINE (unchanged)
    // -----------------------------
    function setAdminCallDone(uint256 _id, bool _done) external onlyAdmin {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled || r.state == State.Disbursed) revert RequestNotOpen();
        r.adminCallDone = _done;
        _maybeMoveUnderReview(r);
        emit RequestVerificationUpdated(_id, r.adminCallDone, r.hospitalVerified, r.physicalVisitDone, r.hospitalVerifier);
    }

    function setHospitalVerified(uint256 _id, bool _done) external onlyHospital {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled || r.state == State.Disbursed) revert RequestNotOpen();
        r.hospitalVerified = _done;
        r.hospitalVerifier = msg.sender;
        _maybeMoveUnderReview(r);
        emit RequestVerificationUpdated(_id, r.adminCallDone, r.hospitalVerified, r.physicalVisitDone, r.hospitalVerifier);
    }

    function setPhysicalVisit(uint256 _id, bool _done) external onlyAdmin {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled || r.state == State.Disbursed) revert RequestNotOpen();
        r.physicalVisitDone = _done;
        _maybeMoveUnderReview(r);
        emit RequestVerificationUpdated(_id, r.adminCallDone, r.hospitalVerified, r.physicalVisitDone, r.hospitalVerifier);
    }

    function approve(uint256 _id) external onlyAdmin {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled || r.state == State.Disbursed) revert RequestNotOpen();
        if (!(r.adminCallDone && r.hospitalVerified && r.physicalVisitDone)) revert NotApproved();
        if (r.state == State.Approved) revert AlreadyApproved();
        r.state = State.Approved;
        r.verifiedBy = msg.sender;
        emit RequestApproved(_id, msg.sender);
    }

    function cancel(uint256 _id) external {
        Request storage r = _getRequest(_id);
        if (!admins[msg.sender] && msg.sender != r.patient) revert Unauthorized();
        if (r.state == State.Canceled) revert AlreadyCanceled();
        if (r.state == State.Disbursed) revert AlreadyDisbursed();
        r.state = State.Canceled;
        emit RequestCanceled(_id);
    }

    function _maybeMoveUnderReview(Request storage r) internal {
        if (r.state == State.Pending && (r.adminCallDone || r.hospitalVerified || r.physicalVisitDone)) {
            r.state = State.UnderReview;
        }
    }

    // -----------------------------
    // DONATIONS & DISBURSEMENT (unchanged)
    // -----------------------------
    function donateToRequest(uint256 _id) external payable nonReentrant {
        Request storage r = _getRequest(_id);
        if (r.state != State.Approved) revert NotVisible();
        if (block.timestamp > r.deadline) revert DonationsClosed();
        if (msg.value == 0) revert ZeroValue();
        r.raised += msg.value;
        if (!_seenDonor[_id][msg.sender]) {
            _seenDonor[_id][msg.sender] = true;
            donorsList[_id].push(msg.sender);
        }
        contributions[_id][msg.sender] += msg.value;
        emit DonationReceived(_id, msg.sender, msg.value, r.raised);
    }

    function donateToPool() external payable nonReentrant {
        if (msg.value == 0) revert ZeroValue();
        generalPool += msg.value;
        emit GeneralPoolDonation(msg.sender, msg.value, generalPool);
    }

    function allocateFromPool(uint256 _id, uint256 _amount) external onlyAdmin {
        Request storage r = _getRequest(_id);
        if (r.state != State.Approved) revert NotVisible();
        if (_amount == 0 || _amount > generalPool) revert OverPool();
        r.raised += _amount;
        generalPool -= _amount;
        emit GeneralPoolAllocated(_id, _amount, r.raised, generalPool);
    }

    function disburseToHospital(uint256 _id, uint256 _amount) external onlyAdmin nonReentrant {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled) revert AlreadyCanceled();
        if (r.state == State.Disbursed) revert AlreadyDisbursed();
        if (r.state != State.Approved) revert NotVisible();
        uint256 available = r.raised - r.disbursed;
        if (_amount == 0 || _amount > available) revert ZeroValue();
        r.disbursed += _amount;
        r.fundedBy = msg.sender;
        (bool ok, ) = r.hospitalWallet.call{value: _amount}("");
        require(ok, "DISBURSE_FAIL");
        emit Disbursed(_id, r.hospitalWallet, _amount, msg.sender);
        if (r.disbursed >= r.goal) {
            r.state = State.Disbursed;
            emit RequestCompleted(_id, r.patient);
        }
    }

    function refund(uint256 _id) external nonReentrant {
        Request storage r = _getRequest(_id);
        if (r.state == State.Disbursed) revert AlreadyDisbursed();
        bool eligible = r.state == State.Canceled || block.timestamp > r.deadline;
        if (!eligible) revert RequestNotOpen();
        if (r.disbursed > 0) revert RefundNotAllowedAfterDisbursement();
        uint256 amt = contributions[_id][msg.sender];
        if (amt == 0) revert NothingToRefund();
        contributions[_id][msg.sender] = 0;
        r.raised -= amt;
        (bool ok, ) = payable(msg.sender).call{value: amt}("");
        require(ok, "REFUND_FAIL");
        emit RefundIssued(_id, msg.sender, amt);
    }

    // -----------------------------
    // VIEWS
    // -----------------------------
    function getRequestBasic(uint256 _id)
        external view
        returns (address patient, address hospitalWallet, uint256 goal, uint256 raised, State state, uint64 deadline)
    {
        Request storage r = _getRequest(_id);
        return (r.patient, r.hospitalWallet, r.goal, r.raised, r.state, r.deadline);
    }

    function getRequestVerificationDetails(uint256 _id)
        external view
        returns (bool adminCallDone, bool hospitalVerified, bool physicalVisitDone, address hospitalVerifier)
    {
        Request storage r = _getRequest(_id);
        return (r.adminCallDone, r.hospitalVerified, r.physicalVisitDone, r.hospitalVerifier);
    }

    function getRequestMetadata(uint256 _id)
        external view
        returns (string memory title, string memory description, string memory patientDataCID, string memory hospitalDataCID)
    {
        Request storage r = _getRequest(_id);
        return (r.title, r.description, r.patientDataCID, r.hospitalDataCID);
    }

    function getDonors(uint256 _id) external view returns (address[] memory donors, uint256[] memory amounts) {
        donors = donorsList[_id];
        amounts = new uint256[](donors.length);
        for (uint256 i = 0; i < donors.length; ++i) {
            amounts[i] = contributions[_id][donors[i]];
        }
    }

    function getRequestsBasic(uint256 startId, uint256 count)
        external view
        returns (uint256[] memory ids, State[] memory states, uint256[] memory goals, uint256[] memory raisedAmounts)
    {
        if (count == 0 || startId == 0 || startId > requestCount) return (new uint256[](0), new State[](0), new uint256[](0), new uint256[](0));
        uint256 end = startId + count - 1;
        if (end > requestCount) end = requestCount;
        uint256 len = end - startId + 1;
        ids = new uint256[](len);
        states = new State[](len);
        goals = new uint256[](len);
        raisedAmounts = new uint256[](len);
        for (uint256 i = 0; i < len; ++i) {
            uint256 id = startId + i;
            Request storage r = requests[id];
            ids[i] = id;
            states[i] = r.state;
            goals[i] = r.goal;
            raisedAmounts[i] = r.raised;
        }
    }

    function _getRequest(uint256 _id) internal view returns (Request storage r) {
        r = requests[_id];
        if (r.patient == address(0)) revert InvalidRequest();
    }

    // accept tips
    receive() external payable {}
    fallback() external payable {}
}
