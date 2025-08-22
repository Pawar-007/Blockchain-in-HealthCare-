// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MedicalRecordStorage
 * @notice Stores immutable patient identifiers and grants access to their records.
 * All sensitive personal and medical data is kept off-chain and referenced by IPFS hashes.
 */
contract MedicalRecordStorage {
    // -----------------------------
    // ERRORS
    // -----------------------------
    error NotAuthorized();
    error NotRegistered();
    error AlreadyRegistered();
    error InvalidRecordId();
    error NoActiveAccess();
    error AccessDenied();

    // -----------------------------
    // STRUCTS
    // -----------------------------

    // The Patient struct is now simplified to only store essential, non-sensitive data on-chain.
    struct Patient {
        bool registered;
        address guardian;
    }

    struct HealthRecord {
        string ipfsHash;        // Encrypted file stored on IPFS
        string metadata;        // JSON metadata (e.g., date, doctor, record type)
        uint256 timestamp;
        bool sharedForFunding;
    }

    struct AccessRequest {
        bool exists;
        bool approved;
    }

    // -----------------------------
    // STATE VARIABLES
    // -----------------------------

    mapping(address => Patient) public patients;
    mapping(address => HealthRecord[]) private patientRecords;
    mapping(address => mapping(address => AccessRequest)) public access;

    // -----------------------------
    // EVENTS
    // -----------------------------

    event PatientRegistered(address indexed patient, address guardian);
    event RecordUploaded(address indexed patient, string ipfsHash, string metadata, uint256 timestamp);
    event AccessGranted(address indexed patient, address indexed user);
    event AccessRevoked(address indexed patient, address indexed user);
    event RecordMarkedForFunding(address indexed patient, uint256 recordId, bool status);

    // -----------------------------
    // MODIFIERS
    // -----------------------------

    modifier onlyPatientOrGuardian(address _patient) {
        if (msg.sender != _patient && msg.sender != patients[_patient].guardian) {
            revert NotAuthorized();
        }
        _;
    }

    modifier onlyRegisteredPatient() {
        if (!patients[msg.sender].registered) {
            revert NotRegistered();
        }
        _;
    }
    modifier onlyGuardian() {
        if (msg.sender != patients[msg.sender].guardian) {
            revert NotAuthorized();
        }
        _;
    }
    function registerPatient(
        address _guardian
    ) external {
        if (patients[msg.sender].registered) {
            revert AlreadyRegistered();
        }

        patients[msg.sender] = Patient({
            registered: true,
            guardian: _guardian
        });

        emit PatientRegistered(msg.sender, _guardian);
    }
    
    // The `updatePatientProfile` function has been removed as all PII is off-chain.

    // -----------------------------
    // RECORD MANAGEMENT
    // -----------------------------

    function uploadRecord(string memory _ipfsHash, string memory _metadata) external onlyRegisteredPatient {
        patientRecords[msg.sender].push(
            HealthRecord({
                ipfsHash: _ipfsHash,
                metadata: _metadata,
                timestamp: block.timestamp,
                sharedForFunding: false
            })
        );

        emit RecordUploaded(msg.sender, _ipfsHash, _metadata, block.timestamp);
    }

    function getMyRecords() external view onlyRegisteredPatient returns (HealthRecord[] memory) {
        return patientRecords[msg.sender];
    }

    function getPatientRecords(address _patient) external view returns (HealthRecord[] memory) {
        if (msg.sender != _patient && !access[_patient][msg.sender].approved) {
            revert AccessDenied();
        }
        return patientRecords[_patient];
    }

    // -----------------------------
    // ACCESS CONTROL
    // -----------------------------

    function grantAccess(address _user) external onlyRegisteredPatient {
        access[msg.sender][_user] = AccessRequest({
            exists: true,
            approved: true
        });
        emit AccessGranted(msg.sender, _user);
    }

    function revokeAccess(address _user) external onlyRegisteredPatient {
        AccessRequest storage req = access[msg.sender][_user];
        if (!req.exists || !req.approved) {
            revert NoActiveAccess();
        }
        req.approved = false;
        emit AccessRevoked(msg.sender, _user);
    }

    // -----------------------------
    // FUNDING SUPPORT
    // -----------------------------

    function markRecordForFunding(uint256 _recordId, bool _status) external onlyRegisteredPatient {
        if (_recordId >= patientRecords[msg.sender].length) {
            revert InvalidRecordId();
        }
        patientRecords[msg.sender][_recordId].sharedForFunding = _status;
        emit RecordMarkedForFunding(msg.sender, _recordId, _status);
    }

    function getFundingRecords(address _patient) external view returns (HealthRecord[] memory) {
        if (msg.sender != _patient && !access[_patient][msg.sender].approved) {
            revert AccessDenied();
        }

        uint256 count = 0;
        for (uint256 i = 0; i < patientRecords[_patient].length; i++) {
            if (patientRecords[_patient][i].sharedForFunding) {
                count++;
            }
        }

        HealthRecord[] memory fundingRecords = new HealthRecord[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < patientRecords[_patient].length; i++) {
            if (patientRecords[_patient][i].sharedForFunding) {
                fundingRecords[idx] = patientRecords[_patient][i];
                idx++;
            }
        }
        return fundingRecords;
    }
}
