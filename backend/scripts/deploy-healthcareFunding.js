const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying HealthcareFunding with account:", deployer.address);

  const HealthcareFunding = await hre.ethers.getContractFactory("HealthcareFunding");
  const healthcareFunding = await HealthcareFunding.deploy();
  await healthcareFunding.waitForDeployment();

  console.log("HealthcareFunding deployed at:", healthcareFunding.target);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
