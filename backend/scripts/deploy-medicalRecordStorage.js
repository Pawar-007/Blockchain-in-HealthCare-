const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying MedicalRecordStorage with account:", deployer.address);

  const MedicalRecordStorage = await hre.ethers.getContractFactory("MedicalRecordStorage");
  const medicalRecordStorage = await MedicalRecordStorage.deploy();
  await medicalRecordStorage.waitForDeployment();

  console.log("MedicalRecordStorage deployed at:", medicalRecordStorage.target);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
