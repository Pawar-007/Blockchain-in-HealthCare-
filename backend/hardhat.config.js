require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200 // This is the recommended default
      },
      viaIR: true, // This enables the IR optimizer
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
};