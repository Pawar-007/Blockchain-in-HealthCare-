// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// /**
//  * @title HealthcareFundingOrchestrator
//  * @notice Crowdfunding + disbursement flow for patient treatment costs.
//  *         - Owner assigns Admins who verify/approve requests.
//  *         - Patients create requests with hospital, amount, deadline, and metadata.
//  *         - Donations (ETH) go into per‑request escrow and are disbursed ONLY to the hospital.
//  *         - Transparent events + paginated getters for frontends.
//  *
//  *  External contracts (already provided by you):
//  *   - MedicalRecordStorage: patients manage encrypted IPFS records. (address set in constructor)
//  *   - HospitalRegistry: owner‑verified hospitals registry. (address set in constructor)
//  *
//  *  Gas/Safety:
//  *   - Uses OpenZeppelin AccessControl, Ownable, Pausable, ReentrancyGuard.
//  *   - No unbounded loops in state‑changing functions; donor lists are append‑only and exposed with pagination.
//  */

// import "@openzeppelin/contracts/access/Ownable.sol";
// import "@openzeppelin/contracts/access/AccessControl.sol";
// import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
// import "@openzeppelin/contracts/security/Pausable.sol";

// /// @dev minimal read‑only interface to your HospitalRegistry
// interface IHospitalRegistry {
//     function getHospitalData(address _hospital)
//         external
//         view
//         returns (string memory, string memory, string memory, bool);
// }

// /// @dev minimal marker for your MedicalRecordStorage (kept for UI reference)
// interface IMedicalRecordStorage {
//     // Frontend will call this contract directly for records; we just keep its address here.
// }

// contract HealthcareFundingOrchestrator is Ownable, AccessControl, Pausable, ReentrancyGuard {
//     bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

//     enum Status {
//         Pending,    // created by patient, awaiting admin review
//         Approved,   // admin approved after verification
//         Active,     // open for donations
//         Funded,     // fully funded and disbursed
//         Cancelled,  // cancelled by patient before disbursement
//         Rejected,   // rejected by admin
//         Expired,    // passed deadline without full funding
//         PartiallyDisbursed // some funds sent (e.g., milestone), still can disburse remainder
//     }

//     struct RequestLite {
//         address patient;
//         address hospital; // recipient escrow target (must be verified in registry)
//         uint256 goal;     // wei
//         uint256 raised;   // wei
//         uint64  createdAt;
//         uint64  deadline; // unix seconds
//         Status  status;
//     }

//     struct RequestFull {
//         // lightweight fields (copy of RequestLite for single-call reads)
//         address patient;
//         address hospital;
//         uint256 goal;
//         uint256 raised;
//         uint64  createdAt;
//         uint64  deadline;
//         Status  status;
//         // extra metadata
//         string  disease;          // short disease name
//         string  description;      // additional info (could be IPFS CID to longer json)
//         uint256[] recordIds;      // record ids from MedicalRecordStorage marked for funding
//     }

//     struct DonationInfo {
//         uint256 amount;   // total donated by donor to this request (wei)
//         uint64  lastAt;   // last donation timestamp
//     }

//     IHospitalRegistry public immutable hospitalRegistry;
//     IMedicalRecordStorage public immutable medicalRecordStorage;

//     // storage
//     uint256 public totalRequests;
//     mapping(uint256 => RequestFull) private _requests;         // requestId -> data
//     mapping(address => uint256[]) private _patientRequests;    // patient -> requestIds

//     // donations per request
//     mapping(uint256 => mapping(address => DonationInfo)) public donationsOf; // requestId -> donor -> info
//     mapping(uint256 => address[]) private _donorList;                              // requestId -> donors (unique)
//     mapping(uint256 => mapping(address => bool)) private _isDonor;                 // requestId -> donor -> bool

//     // ----------- Events -----------
//     event AdminUpdated(address indexed account, bool added);
//     event RequestCreated(
//         uint256 indexed requestId,
//         address indexed patient,
//         address indexed hospital,
//         uint256 goal,
//         uint64 deadline
//     );
//     event RequestStatus(uint256 indexed requestId, Status indexed status);
//     event RequestMetadataUpdated(uint256 indexed requestId);
//     event DonationReceived(uint256 indexed requestId, address indexed donor, uint256 amount, uint256 newRaised);
//     event Disbursed(uint256 indexed requestId, address indexed hospital, uint256 amount);
//     event Refunded(uint256 indexed requestId, address indexed donor, uint256 amount);
//     event DeadlineExtended(uint256 indexed requestId, uint64 newDeadline);

//     constructor(address _owner, address _hospitalRegistry, address _medicalRecordStorage) Ownable(_owner) {
//         require(_hospitalRegistry != address(0) && _medicalRecordStorage != address(0), "zero addr");
//         hospitalRegistry = IHospitalRegistry(_hospitalRegistry);
//         medicalRecordStorage = IMedicalRecordStorage(_medicalRecordStorage);
//         _grantRole(DEFAULT_ADMIN_ROLE, _owner);
//         _grantRole(ADMIN_ROLE, _owner);
//     }

//     // -------- Admin Management --------
//     function addAdmin(address account) external onlyOwner {
//         _grantRole(ADMIN_ROLE, account);
//         emit AdminUpdated(account, true);
//     }

//     function removeAdmin(address account) external onlyOwner {
//         _revokeRole(ADMIN_ROLE, account);
//         emit AdminUpdated(account, false);
//     }

//     // -------- Core: Create Request --------
//     function createRequest(
//         address hospital,
//         uint256 goalWei,
//         uint64  deadline,
//         string calldata disease,
//         string calldata description,
//         uint256[] calldata recordIds
//     ) external whenNotPaused returns (uint256 requestId) {
//         require(hospital != address(0), "hospital=0");
//         require(goalWei > 0, "goal=0");
//         require(deadline > block.timestamp, "bad deadline");

//         // require hospital verified in registry
//         (, , , bool isVerified) = hospitalRegistry.getHospitalData(hospital);
//         require(isVerified, "hospital not verified");

//         requestId = ++totalRequests; // start from 1 for easier UX
//         RequestFull storage R = _requests[requestId];
//         R.patient    = msg.sender;
//         R.hospital   = hospital;
//         R.goal       = goalWei;
//         R.raised     = 0;
//         R.createdAt  = uint64(block.timestamp);
//         R.deadline   = deadline;
//         R.status     = Status.Pending;
//         R.disease    = disease;
//         R.description= description;
//         // copy record ids
//         if (recordIds.length > 0) {
//             R.recordIds = recordIds;
//         }

//         _patientRequests[msg.sender].push(requestId);
//         emit RequestCreated(requestId, msg.sender, hospital, goalWei, deadline);
//         emit RequestStatus(requestId, Status.Pending);
//     }

//     // -------- Admin Review / Lifecycle --------
//     function approveRequest(uint256 requestId) external onlyRole(ADMIN_ROLE) whenNotPaused {
//         RequestFull storage R = _mustExist(requestId);
//         require(R.status == Status.Pending || R.status == Status.Rejected, "not approvable");
//         // ensure hospital is still verified
//         (, , , bool isVerified) = hospitalRegistry.getHospitalData(R.hospital);
//         require(isVerified, "hospital not verified");
//         R.status = Status.Approved;
//         emit RequestStatus(requestId, Status.Approved);
//     }

//     function rejectRequest(uint256 requestId) external onlyRole(ADMIN_ROLE) whenNotPaused {
//         RequestFull storage R = _mustExist(requestId);
//         require(R.status == Status.Pending || R.status == Status.Approved || R.status == Status.Active, "not rejectable");
//         R.status = Status.Rejected;
//         emit RequestStatus(requestId, Status.Rejected);
//     }

//     function openDonations(uint256 requestId) external onlyRole(ADMIN_ROLE) whenNotPaused {
//         RequestFull storage R = _mustExist(requestId);
//         require(R.status == Status.Approved, "not approved");
//         require(block.timestamp < R.deadline, "deadline passed");
//         R.status = Status.Active;
//         emit RequestStatus(requestId, Status.Active);
//     }

//     function extendDeadline(uint256 requestId, uint64 newDeadline) external onlyRole(ADMIN_ROLE) whenNotPaused {
//         RequestFull storage R = _mustExist(requestId);
//         require(newDeadline > R.deadline && newDeadline > block.timestamp, "bad deadline");
//         R.deadline = newDeadline;
//         emit DeadlineExtended(requestId, newDeadline);
//     }

//     function cancelByPatient(uint256 requestId) external whenNotPaused {
//         RequestFull storage R = _mustExist(requestId);
//         require(R.patient == msg.sender, "not patient");
//         require(R.status == Status.Pending || R.status == Status.Approved || R.status == Status.Active, "not cancellable");
//         R.status = Status.Cancelled;
//         emit RequestStatus(requestId, Status.Cancelled);
//     }

//     // -------- Donations (ETH) --------
//     function donate(uint256 requestId) external payable nonReentrant whenNotPaused {
//         RequestFull storage R = _mustExist(requestId);
//         require(R.status == Status.Active, "not active");
//         require(block.timestamp <= R.deadline, "expired");
//         require(msg.value > 0, "no value");

//         uint256 newRaised = R.raised + msg.value;
//         R.raised = newRaised;

//         DonationInfo storage D = donationsOf[requestId][msg.sender];
//         D.amount += msg.value;
//         D.lastAt = uint64(block.timestamp);

//         if (!_isDonor[requestId][msg.sender]) {
//             _isDonor[requestId][msg.sender] = true;
//             _donorList[requestId].push(msg.sender);
//         }

//         emit DonationReceived(requestId, msg.sender, msg.value, newRaised);
//     }

//     // -------- Disbursement to Hospital --------
//     function disburse(uint256 requestId, uint256 amountWei) external onlyRole(ADMIN_ROLE) nonReentrant whenNotPaused {
//         RequestFull storage R = _mustExist(requestId);
//         require(R.status == Status.Active || R.status == Status.Approved || R.status == Status.PartiallyDisbursed, "not disbursable");
//         require(amountWei > 0, "zero");
//         require(address(this).balance >= amountWei, "insufficient escrow");
//         require(R.raised >= amountWei, "not enough raised");

//         // ensure hospital still verified
//         (, , , bool isVerified) = hospitalRegistry.getHospitalData(R.hospital);
//         require(isVerified, "hospital not verified");

//         (bool ok, ) = payable(R.hospital).call{value: amountWei}("");
//         require(ok, "transfer failed");
//         emit Disbursed(requestId, R.hospital, amountWei);

//         if (R.raised >= R.goal && amountWei >= (R.goal)) {
//             R.status = Status.Funded;
//         } else {
//             R.status = Status.PartiallyDisbursed;
//         }
//         emit RequestStatus(requestId, R.status);
//     }

//     // -------- Refunds --------
//     /// @notice Anyone can mark a request expired if past deadline and not funded.
//     function markExpired(uint256 requestId) external whenNotPaused {
//         RequestFull storage R = _mustExist(requestId);
//         require(block.timestamp > R.deadline, "not past deadline");
//         require(R.status == Status.Active || R.status == Status.Approved || R.status == Status.Pending, "bad status");
//         R.status = Status.Expired;
//         emit RequestStatus(requestId, Status.Expired);
//     }

//     /// @notice Donor can claim refund only if request is Cancelled/Rejected/Expired and funds are still in escrow.
//     function claimRefund(uint256 requestId) external nonReentrant whenNotPaused {
//         RequestFull storage R = _mustExist(requestId);
//         require(
//             R.status == Status.Cancelled || R.status == Status.Rejected || R.status == Status.Expired,
//             "refund not allowed"
//         );
//         DonationInfo storage D = donationsOf[requestId][msg.sender];
//         uint256 amt = D.amount;
//         require(amt > 0, "no donation");
//         D.amount = 0; // effects before interaction
//         (bool ok, ) = payable(msg.sender).call{value: amt}("");
//         require(ok, "refund failed");
//         emit Refunded(requestId, msg.sender, amt);
//     }

//     // -------- Owner Controls --------
//     function pause() external onlyOwner { _pause(); }
//     function unpause() external onlyOwner { _unpause(); }

//     // -------- View / Getters (Frontend‑friendly) --------
//     function getRequest(uint256 requestId) external view returns (RequestFull memory R) {
//         R = _requests[requestId];
//         require(R.patient != address(0), "no request");
//     }

//     function getRequestLite(uint256 requestId) external view returns (RequestLite memory L) {
//         RequestFull storage R = _requests[requestId];
//         require(R.patient != address(0), "no request");
//         L = RequestLite({
//             patient: R.patient,
//             hospital: R.hospital,
//             goal: R.goal,
//             raised: R.raised,
//             createdAt: R.createdAt,
//             deadline: R.deadline,
//             status: R.status
//         });
//     }

//     function getRequestsByPatient(address patient) external view returns (uint256[] memory) {
//         return _patientRequests[patient];
//     }

//     function getDonorCount(uint256 requestId) external view returns (uint256) {
//         return _donorList[requestId].length;
//     }

//     function getDonors(
//         uint256 requestId,
//         uint256 start,
//         uint256 count
//     ) external view returns (address[] memory donors, uint256[] memory amounts, uint64[] memory lastAt) {
//         address[] storage list = _donorList[requestId];
//         uint256 len = list.length;
//         if (start >= len) {
//             return (new address[](0), new uint256[](0), new uint64[](0));
//         }
//         uint256 end = start + count;
//         if (end > len) end = len;
//         uint256 n = end - start;
//         donors = new address[](n);
//         amounts = new uint256[](n);
//         lastAt  = new uint64[](n);
//         for (uint256 i = 0; i < n; ) {
//             address d = list[start + i];
//             donors[i]  = d;
//             DonationInfo storage info = donationsOf[requestId][d];
//             amounts[i] = info.amount;
//             lastAt[i]  = info.lastAt;
//             unchecked { ++i; }
//         }
//     }

//     function getAllOpenRequests(uint256 startId, uint256 maxCount)
//         external
//         view
//         returns (RequestLite[] memory out)
//     {
//         // Simple forward scan over ids; frontends should cache & paginate.
//         uint256 lastId = totalRequests;
//         if (startId == 0) startId = 1;
//         uint256 cap = maxCount == 0 ? 50 : maxCount;
//         out = new RequestLite[](cap);
//         uint256 j;
//         for (uint256 id = startId; id <= lastId && j < cap; ) {
//             RequestFull storage R = _requests[id];
//             if (
//                 (R.status == Status.Active || R.status == Status.Approved || R.status == Status.Pending) &&
//                 R.patient != address(0)
//             ) {
//                 out[j] = RequestLite({
//                     patient: R.patient,
//                     hospital: R.hospital,
//                     goal: R.goal,
//                     raised: R.raised,
//                     createdAt: R.createdAt,
//                     deadline: R.deadline,
//                     status: R.status
//                 });
//                 unchecked { ++j; }
//             }
//             unchecked { ++id; }
//         }
//         assembly { mstore(out, j) } // shrink to actual size
//     }

//     function getConfig() external view returns (address hospitalReg, address medRecordStore) {
//         hospitalReg = address(hospitalRegistry);
//         medRecordStore = address(medicalRecordStorage);
//     }

//     // -------- Internal --------
//     function _mustExist(uint256 requestId) internal view returns (RequestFull storage R) {
//         R = _requests[requestId];
//         require(R.patient != address(0), "bad id");
//     }

//     // receive fallback for direct ETH (not attributed) — discouraged; attribute via donate()
//     receive() external payable {}
// }
// // fallback function to accept plain ETH transfers
// fallback() external payable {
//     // This fallback is intentionally empty; we discourage direct transfers.
//     // Use the donate() function to attribute donations to requests.
// }