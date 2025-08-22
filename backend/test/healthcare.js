const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthcareFunding Contract", function () {
  it("Should return the correct owner", async function () {
    const [owner] = await ethers.getSigners();
    console.log("Owner address is:", owner.address);
     const HealthcareFunding = await ethers.getContractFactory("HealthcareFunding");
    const contract = await HealthcareFunding.deploy();
    await contract.waitForDeployment();
    console.log("Contract deployed at address:", contract.interface);
   const deployedOwner = await contract.getOwner();
   const EhterPresent=await contract.getBalance();
    console.log("Deployed owner address is:", deployedOwner);
    console.log("Ether present in contract:",EhterPresent);
    expect(deployedOwner).to.equal(owner.address);
  });
});
