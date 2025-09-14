// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UserProfile {
    struct User {
        string name;
        string location;
        string contactNumber;
        string gender;
        string additionalInfo; // any extra info
        bool exists;           // to check if user is registered
    }

    mapping(address => User) private users;

    // Event when user registers
    event UserRegistered(address indexed user, string name, string contactNumber);
    // Event when user updates profile
    event UserProfileUpdated(address indexed user, string name, string contactNumber);

    // ✅ Register user (only if not exists)
    function registerUser(
        string memory _name,
        string memory _location,
        string memory _contactNumber,
        string memory _gender,
        string memory _additionalInfo
    ) external {
        require(!users[msg.sender].exists, "User already exists");

        users[msg.sender] = User({
            name: _name,
            location: _location,
            contactNumber: _contactNumber,
            gender: _gender,
            additionalInfo: _additionalInfo,
            exists: true
        });

        emit UserRegistered(msg.sender, _name, _contactNumber);
    }

    // ✅ Update profile (only if user exists)
    function updateProfile(
        string memory _name,
        string memory _location,
        string memory _contactNumber,
        string memory _gender,
        string memory _additionalInfo
    ) external {
        require(users[msg.sender].exists, "User does not exist");

        User storage user = users[msg.sender];
        user.name = _name;
        user.location = _location;
        user.contactNumber = _contactNumber;
        user.gender = _gender;
        user.additionalInfo = _additionalInfo;

        emit UserProfileUpdated(msg.sender, _name, _contactNumber);
    }

    // ✅ Get profile for caller only
    function getMyProfile() external view returns (
        string memory name,
        string memory location,
        string memory contactNumber,
        string memory gender,
        string memory additionalInfo
    ) {
        require(users[msg.sender].exists, "Profile not found");
        User storage user = users[msg.sender];
        return (
            user.name,
            user.location,
            user.contactNumber,
            user.gender,
            user.additionalInfo
        );
    }

    // ✅ Check if profile exists for caller
    function isProfileSet() external view returns (bool) {
        return users[msg.sender].exists;
    }
}
