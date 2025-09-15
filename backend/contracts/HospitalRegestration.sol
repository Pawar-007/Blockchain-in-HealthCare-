// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract HospitalRegistry is Ownable {
    struct Hospital {
        string name;
        string location;
        string documentCID;  // IPFS hash of docs
        string email;
        string contactNumber;
        address wallet;      // hospital wallet
        bool isVerified;
        uint256 registeredAt;
    }

    mapping(address => Hospital) public hospitals;
    address[] public hospitalList; // to iterate/fetch all hospitals

    event HospitalRegistered(
        address indexed hospital,
        string name,
        string location,
        string email,
        string contactNumber,
        string documentCID
    );

    event HospitalVerified(address indexed hospital, bool status);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ✅ Register Hospital
    function registerHospital(
        string memory _name,
        string memory _location,
        string memory _documentCID,
        string memory _email,
        string memory _contactNumber
    ) external {
        require(bytes(hospitals[msg.sender].name).length == 0, "Hospital already registered");

        hospitals[msg.sender] = Hospital({
            name: _name,
            location: _location,
            documentCID: _documentCID,
            email: _email,
            contactNumber: _contactNumber,
            wallet: msg.sender,
            isVerified: false,
            registeredAt: block.timestamp
        });

        hospitalList.push(msg.sender);

        emit HospitalRegistered(msg.sender, _name, _location, _email, _contactNumber, _documentCID);
    }

    // ✅ Verify Hospital (only admin/owner)
    function verifyHospital(address _hospital, bool _status) external onlyOwner {
        require(bytes(hospitals[_hospital].name).length > 0, "Hospital not found");
        hospitals[_hospital].isVerified = _status;
        emit HospitalVerified(_hospital, _status);
    }

    // ✅ Get hospital details
    function getHospitalData(address _hospital)
        external
        view
        returns (
            string memory,
            string memory,
            string memory,
            string memory,
            string memory,
            address,
            bool,
            uint256
        )
    {
        Hospital memory h = hospitals[_hospital];
        return (
            h.name,
            h.location,
            h.documentCID,
            h.email,
            h.contactNumber,
            h.wallet,
            h.isVerified,
            h.registeredAt
        );
    }

    // Get all registered hospitals
    function getAllHospitals() external view returns (Hospital[] memory) {
        Hospital[] memory all = new Hospital[](hospitalList.length);
        for (uint i = 0; i < hospitalList.length; i++) {
            all[i] = hospitals[hospitalList[i]];
        }
        return all;
    }

    // Get hospital count
    function getHospitalCount() external view returns (uint256) {
        return hospitalList.length;
    }
}
