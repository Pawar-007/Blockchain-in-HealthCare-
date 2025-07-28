// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract HealthcareFunding {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    function getOwner() public view returns (address) {
        return owner;
    }
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
