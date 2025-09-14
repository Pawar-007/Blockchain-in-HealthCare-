const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const HealthcareFunding = await hre.ethers.getContractFactory("HealthcareFunding");
  const healthcareFunding = await HealthcareFunding.deploy();
  await healthcareFunding.waitForDeployment(); 
  console.log("HealthcareFunding deployed at:", healthcareFunding.target);

  // MedicalRecordStorage
  const MedicalRecordStorage = await hre.ethers.getContractFactory("MedicalRecordStorage");
  const medicalRecordStorage = await MedicalRecordStorage.deploy();
  await medicalRecordStorage.waitForDeployment();
  console.log("MedicalRecordStorage deployed at:", medicalRecordStorage.target);

  // 3HospitalRegistry
  const HospitalRegistry = await hre.ethers.getContractFactory("HospitalRegistry");
  const hospitalRegistry = await HospitalRegistry.deploy(deployer.address); // initialOwner
  await hospitalRegistry.waitForDeployment();
  console.log("HospitalRegistry deployed at:", hospitalRegistry.target);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
