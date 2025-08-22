// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HealthcareFundingOrchestrator
 * @notice Orchestrates healthcare funding with a verification pipeline.
 *         - Patients create requests with form data + pointers to documents.
 *         - Admin & whitelisted hospitals verify; donors never see documents.
 *         - Once approved, donations open. Funds are escrowed here.
 *         - Admin disburses directly to hospital wallet.
 *         - Tracks donor history. Supports a general donation pool for admin allocation.
 *
 * SECURITY NOTES:
 * - Do NOT put PHI on-chain. Use IPFS (encrypted) or your MedicalRecordStorage and store only pointers/cids.
 * - Document access (admin/hospital only) is maintained in your storage contract. This contract emits events
 *   so your dApp can instruct patients to grant/revoke access there.
 */
contract HealthcareFundingOrchestrator {
    // -----------------------------
    // Errors
    // -----------------------------
    error NotAdmin();
    error NotHospital();
    error NotPatient();
    error InvalidRequest();
    error AlreadyApproved();
    error NotApproved();
    error AlreadyCanceled();
    error AlreadyDisbursed();
    error NotVisible();
    error ZeroValue();
    error ZeroAddress();
    error OverGoal();
    error NothingToRefund();
    error DeadlineTooSoon();
    error DonationsClosed();
    error RequestNotOpen();

    // -----------------------------
    // Roles
    // -----------------------------
    address public immutable admin;
    mapping(address => bool) public hospitals; // allow-list of hospital verifier accounts

    modifier onlyAdmin() {
        if (msg.sender != admin) revert NotAdmin();
        _;
    }

    modifier onlyHospital() {
        if (!hospitals[msg.sender]) revert NotHospital();
        _;
    }

    uint256 private _lock = 1;
    modifier nonReentrant() {
        require(_lock == 1, "REENTRANCY");
        _lock = 2;
        _;
        _lock = 1;
    }

    constructor() {
        admin = msg.sender;
    }

    // -----------------------------
    // Request model
    // -----------------------------
    enum State {
        Pending, // created by patient, awaiting verification steps
        UnderReview, // admin/hospital are working on checks
        Approved, // fully verified -> visible to donors
        Canceled, // canceled (by admin or patient) -> donors can refund
        Disbursed // funds sent to hospital
    }

    struct Request {
        // Actors
        address patient; // creator
        address payable hospitalWallet; // where funds are paid upon disbursement
        address hospitalVerifier; // hospital account that verified
        // Money
        uint256 goal; // target in wei
        uint256 raised; // sum of donations + allocations
        uint256 disbursed; // how much was sent to hospital
        uint64 deadline; // donations close; after this refunds allowed if not disbursed
        // Visibility & state
        State state; // lifecycle
        bool adminCallDone; // admin phone verification flag
        bool hospitalVerified; // verified by hospital staff
        bool physicalVisitDone; // physical visit confirmation
        // Metadata (UI only; keep short) + pointers
        string title; // short title
        string description; // summary for donors (no private data)
        string patientDataCID; // IPFS JSON with patient form (encrypted)
        string hospitalDataCID; // IPFS JSON with hospital form/letter (encrypted)
        string documentsBundleCID; // IPFS folder/CAR with documents (encrypted)
        address storageContract; // optional: address of your MedicalRecordStorage
        uint256[] recordIds; // optional: indices in MedicalRecordStorage
    }

    uint256 public requestCount;
    mapping(uint256 => Request) private requests;

    // Per-request donor ledger
    mapping(uint256 => mapping(address => uint256)) public contributions;
    mapping(uint256 => address[]) public donorsList; // small overhead, OK for moderate scale
    mapping(uint256 => mapping(address => bool)) private _seenDonor; // to avoid duplicate in donorsList

    // General donation pool (admin allocates later)
    uint256 public generalPool;

    // -----------------------------
    // Events
    // -----------------------------
    event HospitalWhitelisted(address hospital, bool allowed);

    event RequestCreated(
        uint256 indexed id,
        address indexed patient,
        address indexed hospitalWallet,
        uint256 goal,
        uint64 deadline
    );
    event RequestVerificationUpdated(
        uint256 indexed id,
        bool adminCallDone,
        bool hospitalVerified,
        bool physicalVisitDone,
        address hospitalVerifier
    );
    event RequestApproved(uint256 indexed id);
    event RequestCanceled(uint256 indexed id);
    event DonationReceived(
        uint256 indexed id,
        address indexed donor,
        uint256 amount,
        uint256 newRaised
    );
    event GeneralPoolDonation(
        address indexed donor,
        uint256 amount,
        uint256 newPoolBalance
    );
    event GeneralPoolAllocated(
        uint256 indexed id,
        uint256 amount,
        uint256 newRaised,
        uint256 newPoolBalance
    );
    event Disbursed(
        uint256 indexed id,
        address indexed hospitalWallet,
        uint256 amount
    );
    event RequestCompleted(uint256 indexed id, address indexed patient); // dApp should prompt patient to revoke doc access

    // -----------------------------
    // Admin ops
    // -----------------------------
    function setHospital(address hospital, bool allowed) external onlyAdmin {
        if (hospital == address(0)) revert ZeroAddress();
        hospitals[hospital] = allowed;
        emit HospitalWhitelisted(hospital, allowed);
    }

    // -----------------------------
    // Create requests
    // -----------------------------
    function createRequest(
        address payable _hospitalWallet,
        uint256 _goal,
        uint64 _deadline,
        // public, non-sensitive UI text
        string calldata _title,
        string calldata _description,
        // encrypted IPFS pointers (admin/hospital only off-chain)
        string calldata _patientDataCID,
        string calldata _hospitalDataCID,
        string calldata _documentsBundleCID,
        // optional linkage to MedicalRecordStorage
        address _storageContract,
        uint256[] calldata _recordIds
    ) external returns (uint256 id) {
        if (_hospitalWallet == address(0)) revert ZeroAddress();
        if (_goal == 0) revert ZeroValue();
        // Require at least 24h to avoid instant-close raising/refund games (tune as needed)
        if (_deadline <= block.timestamp + 1 days) revert DeadlineTooSoon();

        id = ++requestCount;

        Request storage r = requests[id];
        r.patient = msg.sender;
        r.hospitalWallet = _hospitalWallet;
        r.goal = _goal;
        r.raised = 0;
        r.disbursed = 0;
        r.deadline = _deadline;
        r.state = State.Pending;

        r.title = _title;
        r.description = _description;

        r.patientDataCID = _patientDataCID;
        r.hospitalDataCID = _hospitalDataCID;
        r.documentsBundleCID = _documentsBundleCID;

        r.storageContract = _storageContract;
        if (_recordIds.length > 0) {
            r.recordIds = _recordIds;
        }

        emit RequestCreated(id, msg.sender, _hospitalWallet, _goal, _deadline);
    }

    // -----------------------------
    // Verification pipeline
    // -----------------------------
    /// Admin marks that they called and spoke with the patient
    function setAdminCallDone(uint256 _id, bool _done) external onlyAdmin {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled || r.state == State.Disbursed)
            revert RequestNotOpen();
        r.adminCallDone = _done;
        _maybeMoveUnderReview(r);
        emit RequestVerificationUpdated(
            _id,
            r.adminCallDone,
            r.hospitalVerified,
            r.physicalVisitDone,
            r.hospitalVerifier
        );
    }

    /// Hospital staff verifies the patient and case (whitelisted hospital only)
    function setHospitalVerified(
        uint256 _id,
        bool _done
    ) external onlyHospital {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled || r.state == State.Disbursed)
            revert RequestNotOpen();
        r.hospitalVerified = _done;
        r.hospitalVerifier = msg.sender;
        _maybeMoveUnderReview(r);
        emit RequestVerificationUpdated(
            _id,
            r.adminCallDone,
            r.hospitalVerified,
            r.physicalVisitDone,
            r.hospitalVerifier
        );
    }

    /// Physical visit flag (admin marks)
    function setPhysicalVisit(uint256 _id, bool _done) external onlyAdmin {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled || r.state == State.Disbursed)
            revert RequestNotOpen();
        r.physicalVisitDone = _done;
        _maybeMoveUnderReview(r);
        emit RequestVerificationUpdated(
            _id,
            r.adminCallDone,
            r.hospitalVerified,
            r.physicalVisitDone,
            r.hospitalVerifier
        );
    }

    /// When all checks pass, admin approves → visible to donors
    function approve(uint256 _id) external onlyAdmin {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled || r.state == State.Disbursed)
            revert RequestNotOpen();
        if (!(r.adminCallDone && r.hospitalVerified && r.physicalVisitDone))
            revert NotApproved();
        if (r.state == State.Approved) revert AlreadyApproved();
        r.state = State.Approved;
        emit RequestApproved(_id);
    }

    /// Admin or patient can cancel (donors can refund)
    function cancel(uint256 _id) external {
        Request storage r = _getRequest(_id);
        if (msg.sender != admin && msg.sender != r.patient) revert NotAdmin();
        if (r.state == State.Canceled) revert AlreadyCanceled();
        if (r.state == State.Disbursed) revert AlreadyDisbursed();
        r.state = State.Canceled;
        emit RequestCanceled(_id);
    }

    function _maybeMoveUnderReview(Request storage r) internal {
        if (r.state == State.Pending) {
            if (r.adminCallDone || r.hospitalVerified || r.physicalVisitDone) {
                r.state = State.UnderReview;
            }
        }
    }

    // -----------------------------
    // Donations
    // -----------------------------
    function donateToRequest(uint256 _id) external payable nonReentrant {
        Request storage r = _getRequest(_id);
        if (r.state != State.Approved) revert NotVisible(); // only after full verification
        if (block.timestamp > r.deadline) revert DonationsClosed();
        if (msg.value == 0) revert ZeroValue();

        // Accept over-goal donations (common in charity). If you want hard cap, uncomment:
        // if (r.raised + msg.value > r.goal) revert OverGoal();

        r.raised += msg.value;

        if (!_seenDonor[_id][msg.sender]) {
            _seenDonor[_id][msg.sender] = true;
            donorsList[_id].push(msg.sender);
        }
        contributions[_id][msg.sender] += msg.value;

        emit DonationReceived(_id, msg.sender, msg.value, r.raised);
    }

    /// Donate to general pool (admin decides later where to allocate)
    function donateToPool() external payable nonReentrant {
        if (msg.value == 0) revert ZeroValue();
        generalPool += msg.value;
        emit GeneralPoolDonation(msg.sender, msg.value, generalPool);
    }

    /// Admin moves pooled funds into a specific request (still escrowed until disbursement)
    function allocateFromPool(uint256 _id, uint256 _amount) external onlyAdmin {
        Request storage r = _getRequest(_id);
        if (r.state != State.Approved) revert NotVisible();
        if (_amount == 0 || _amount > generalPool) revert ZeroValue();
        r.raised += _amount;
        generalPool -= _amount;
        emit GeneralPoolAllocated(_id, _amount, r.raised, generalPool);
    }

    // -----------------------------
    // Disbursement & Refunds
    // -----------------------------
    /// Admin sends funds directly to hospital wallet. Can be partial or full, but cannot exceed raised - disbursed.
    function disburseToHospital(
        uint256 _id,
        uint256 _amount
    ) external onlyAdmin nonReentrant {
        Request storage r = _getRequest(_id);
        if (r.state == State.Canceled) revert AlreadyCanceled();
        if (r.state == State.Disbursed) revert AlreadyDisbursed();
        if (r.state != State.Approved) revert NotVisible();

        uint256 available = r.raised - r.disbursed;
        if (_amount == 0 || _amount > available) revert ZeroValue();

        r.disbursed += _amount;

        (bool ok, ) = r.hospitalWallet.call{value: _amount}("");
        require(ok, "DISBURSE_FAIL");

        emit Disbursed(_id, r.hospitalWallet, _amount);

        // If fully disbursed (>= goal), mark completed and notify UI to revoke doc access.
        if (r.disbursed >= r.goal) {
            r.state = State.Disbursed;
            emit RequestCompleted(_id, r.patient);
        }
    }

    /// Donor can refund ONLY if request was canceled or expired (deadline passed) and not disbursed.
    function refund(uint256 _id) external nonReentrant {
        Request storage r = _getRequest(_id);
        if (r.state == State.Disbursed) revert AlreadyDisbursed();
        bool eligible = (r.state == State.Canceled) ||
            (block.timestamp > r.deadline);
        if (!eligible) revert RequestNotOpen();

        uint256 amt = contributions[_id][msg.sender];
        if (amt == 0) revert NothingToRefund();

        contributions[_id][msg.sender] = 0;

        // Reduce raised to keep accounting consistent only if not yet disbursed any portion.
        // If partial disbursement was allowed before deadline, we would need pro-rata logic.
        // Here we only allow disburse while Approved and before deadline; refunds after deadline/cancel,
        // so raised can shrink safely as nothing is disbursed in that branch.
        r.raised -= amt;

        (bool ok, ) = payable(msg.sender).call{value: amt}("");
        require(ok, "REFUND_FAIL");
    }

    // -----------------------------
    // Views
    // -----------------------------
    function getRequest(
        uint256 _id
    )
        external
        view
        returns (
            // actors
            address patient,
            address hospitalWallet,
            address hospitalVerifier,
            // money
            uint256 goal,
            uint256 raised,
            uint256 disbursed,
            uint64 deadline,
            // verification/state
            State state,
            bool adminCallDone,
            bool hospitalVerified,
            bool physicalVisitDone,
            // metadata & pointers
            string memory title,
            string memory description,
            string memory patientDataCID,
            string memory hospitalDataCID,
            string memory documentsBundleCID,
            address storageContract,
            uint256[] memory recordIds
        )
    {
        Request storage r = _getRequest(_id);
        return (
            r.patient,
            r.hospitalWallet,
            r.hospitalVerifier,
            r.goal,
            r.raised,
            r.disbursed,
            r.deadline,
            r.state,
            r.adminCallDone,
            r.hospitalVerified,
            r.physicalVisitDone,
            r.title,
            r.description,
            r.patientDataCID,
            r.hospitalDataCID,
            r.documentsBundleCID,
            r.storageContract,
            r.recordIds
        );
    }

    function getDonors(
        uint256 _id
    )
        external
        view
        returns (address[] memory donors, uint256[] memory amounts)
    {
        Request storage r = _getRequest(_id);
        donors = donorsList[_id];
        amounts = new uint256[](donors.length);
        for (uint256 i = 0; i < donors.length; i++) {
            amounts[i] = contributions[_id][donors[i]];
        }
    }

    // Pagination helper to list requests (e.g., visible ones for the website)
    function getRequestsBasic(
    uint256 startId,
    uint256 count
)
    external
    view
    returns (
        uint256[] memory ids,
        State[] memory states,
        uint256[] memory goals,
        uint256[] memory raisedAmounts
    )
{
    if (count == 0 || startId == 0 || startId > requestCount) {
    return (
        new uint256 ,
        new State ,
        new uint256 ,
        new uint256 
    );
}

    uint256 end = startId + count - 1;
    if (end > requestCount) end = requestCount;

    uint256 len = end - startId + 1;
    ids = new uint256[](len);
    states = new State[](len);
    goals = new uint256[](len);
    raisedAmounts = new uint256[](len);

    for (uint256 i = 0; i < len; i++) {
        uint256 id = startId + i;
        Request storage r = requests[id];
        ids[i] = id;
        states[i] = r.state;
        goals[i] = r.goal;
        raisedAmounts[i] = r.raised;
    }
}

    // -----------------------------
    // Internal
    // -----------------------------
    function _getRequest(
        uint256 _id
    ) internal view returns (Request storage r) {
        r = requests[_id];
        if (r.patient == address(0)) revert InvalidRequest();
    }

    // Accept tips to the contract (not pooled)
    receive() external payable {}

    fallback() external payable {}
}
