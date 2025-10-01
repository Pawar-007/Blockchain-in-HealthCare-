    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.20;

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

        struct Patient {
            bool registered;
            address guardian;
            uint256 recordCount;                 // total records uploaded
            uint256[] fundingRecordIds;          // IDs of records marked for funding
            mapping(uint256 => bool) isFundingRecord; // fast lookup
        }

            struct HealthRecord {
            string title;           
            string ipfsHash;        // Encrypted file stored on IPFS
            string metadata;        // JSON metadata
            uint256 timestamp;
            bool sharedForFunding;
            string doctorName;      // ✅ Doctor's name instead of address
        }


        // -----------------------------
        // STATE VARIABLES
        // -----------------------------

        mapping(address => Patient) private patients;
        mapping(address => mapping(uint256 => HealthRecord)) private patientRecords; // patient → recordId → record
        mapping(address => mapping(address => bool)) public access; // patient → user → access granted

        // -----------------------------
        // EVENTS
        // -----------------------------

        event PatientRegistered(address indexed patient);
        event GuardianUpdated(address indexed patient, address indexed newGuardian);
        event RecordUploaded(
            address indexed patient,
            uint256 indexed recordId,
            string ipfsHash,
            uint256 timestamp,
            address indexed doctor
        );
        event AccessGranted(address indexed patient, address indexed user);
        event AccessRevoked(address indexed patient, address indexed user);
        event RecordMarkedForFunding(address indexed patient, uint256 indexed recordId, bool status);

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

        // -----------------------------
        // PATIENT MANAGEMENT
        // -----------------------------

        function registerPatient(address _patient) external {
                if (patients[_patient].registered) {
                    revert AlreadyRegistered();
                }

                Patient storage p = patients[_patient];
                p.registered = true;

                emit PatientRegistered(_patient);
            }


        function setGuardian(address _guardian) external onlyRegisteredPatient {
            patients[msg.sender].guardian = _guardian;
            emit GuardianUpdated(msg.sender, _guardian);
        }
        
        // -----------------------------
        // RECORD MANAGEMENT
        // -----------------------------

        function uploadRecord(
            string memory _title,
            string memory _ipfsHash,
            string memory _metadata,
            string memory _doctorName   //  take doctor name as input
        ) external onlyRegisteredPatient {
            Patient storage p = patients[msg.sender];
            uint256 recordId = p.recordCount;

            patientRecords[msg.sender][recordId] = HealthRecord({
                title: _title,
                ipfsHash: _ipfsHash,
                metadata: _metadata,
                timestamp: block.timestamp,
                sharedForFunding: false,
                doctorName: _doctorName   //  save name instead of msg.sender
            });

            p.recordCount++;

            emit RecordUploaded(msg.sender, recordId, _ipfsHash, block.timestamp, msg.sender);
        }


        function getMyRecords() external view onlyRegisteredPatient returns (HealthRecord[] memory) {
            return _fetchRecords(msg.sender);
        }
        
        function isRegistered(address _patient) external view returns (bool) {
         if (patients[_patient].registered) {
         return true;
      }
       return false;
     }


        function getPatientRecords(address _patient) external view returns (HealthRecord[] memory) {
            if (    
                msg.sender != _patient &&
                msg.sender != patients[_patient].guardian &&
                !access[_patient][msg.sender]
            ) {
                revert AccessDenied();
            }
            return _fetchRecords(_patient);
        }

        function _fetchRecords(address _patient) internal view returns (HealthRecord[] memory) {
            Patient storage p = patients[_patient];
            HealthRecord[] memory records = new HealthRecord[](p.recordCount);

            for (uint256 i = 0; i < p.recordCount; i++) {
                records[i] = patientRecords[_patient][i];
            }
            return records;
        }

        // -----------------------------
        // ACCESS CONTROL
        // -----------------------------

        function grantAccess(address _user) external onlyRegisteredPatient {
            access[msg.sender][_user] = true;
            emit AccessGranted(msg.sender, _user);
        }

        function revokeAccess(address _user) external onlyRegisteredPatient {
            if (!access[msg.sender][_user]) revert NoActiveAccess();
            access[msg.sender][_user] = false;
            emit AccessRevoked(msg.sender, _user);
        }

        // -----------------------------
        // FUNDING SUPPORT
        // -----------------------------

        function markRecordForFunding(uint256 _recordId, bool _status) external onlyRegisteredPatient {
            Patient storage p = patients[msg.sender];
            if (_recordId >= p.recordCount) revert InvalidRecordId();

            HealthRecord storage record = patientRecords[msg.sender][_recordId];
            record.sharedForFunding = _status;

            if (_status && !p.isFundingRecord[_recordId]) {
                p.fundingRecordIds.push(_recordId);
                p.isFundingRecord[_recordId] = true;
            } else if (!_status && p.isFundingRecord[_recordId]) {
                p.isFundingRecord[_recordId] = false;

                // ✅ remove from fundingRecordIds to keep storage clean
                for (uint256 i = 0; i < p.fundingRecordIds.length; i++) {
                    if (p.fundingRecordIds[i] == _recordId) {
                        p.fundingRecordIds[i] = p.fundingRecordIds[p.fundingRecordIds.length - 1];
                        p.fundingRecordIds.pop();
                        break;
                    }
                }
            }

            emit RecordMarkedForFunding(msg.sender, _recordId, _status);
        }

        function getFundingRecords(address _patient) external view returns (HealthRecord[] memory) {
            if (
                msg.sender != _patient &&
                msg.sender != patients[_patient].guardian &&
                !access[_patient][msg.sender]
            ) {
                revert AccessDenied();
            }

            Patient storage p = patients[_patient];
            uint256 count = p.fundingRecordIds.length;

            HealthRecord[] memory fundingRecords = new HealthRecord[](count);
            for (uint256 i = 0; i < count; i++) {
                fundingRecords[i] = patientRecords[_patient][p.fundingRecordIds[i]];
            }
            return fundingRecords;
        }
    }
