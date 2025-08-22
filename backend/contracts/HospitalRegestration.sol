// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HospitalRegistry is Ownable {
    struct Hospital {
        string name;
        string location;
        string documentCID;
        bool isVerified;
    }

    mapping(address => Hospital) public hospitals;

    event HospitalRegistered(address hospital, string name, string location, string documentCID);
    event HospitalVerified(address hospital, bool status);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function registerHospital(string memory _name, string memory _location, string memory _documentCID) external {
        hospitals[msg.sender] = Hospital(_name, _location, _documentCID, false);
        emit HospitalRegistered(msg.sender, _name, _location, _documentCID);
    }

    function verifyHospital(address _hospital, bool _status) external onlyOwner {
        hospitals[_hospital].isVerified = _status;
        emit HospitalVerified(_hospital, _status);
    }

    function getHospitalData(address _hospital) external view returns (string memory, string memory, string memory, bool) {
        Hospital memory h = hospitals[_hospital];
        return (h.name, h.location, h.documentCID, h.isVerified);
    }
}

