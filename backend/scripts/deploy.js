async function main() {
  // Use the first account (Account #0)
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);

  // Get the contract factory
  const HF = await ethers.getContractFactory("HealthcareFundingOrchestrator");

  // Deploy contract
  const hf = await HF.deploy();
  await hf.deployed();

  console.log("HealthcareFundingOrchestrator deployed at:", hf.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
