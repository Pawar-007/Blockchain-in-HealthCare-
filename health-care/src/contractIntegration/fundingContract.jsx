// src/contract.js
import { ethers } from "ethers";
import contractABI from "./contracts/Contract.json"; // ABI JSON
const contractAddress = "0xYourContractAddress";     // deployed address

// Get contract instance
export const getContract = async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(contractAddress, contractABI.abi, signer);
    return contract;
  } else {
    throw new Error("MetaMask not installed");
  }
};
