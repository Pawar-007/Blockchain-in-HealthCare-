const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying HospitalRegistry with account:", deployer.address);

  const HospitalRegistry = await hre.ethers.getContractFactory("HospitalRegistry");
  const hospitalRegistry = await HospitalRegistry.deploy(deployer.address); // pass initialOwner
  await hospitalRegistry.waitForDeployment();

  console.log("HospitalRegistry deployed at:", hospitalRegistry.target);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
