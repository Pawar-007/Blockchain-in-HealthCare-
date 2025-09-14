import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { healthCareFundingAbi, storageAbi, hospitalRegistryAbi } from "../contractIntegration/contractAbi.js";

const FUNDING_ADDRESS = import.meta.env.VITE_FUNDING_ADDRESS;
const STORAGE_ADDRESS = import.meta.env.VITE_STORAGE_ADDRESS;
const HOSPITAL_ADDRESS = import.meta.env.VITE_HOSPITAL_ADDRESS;

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [account, setAccount] = useState(null);

  // Connect wallet manually
  const connectWallet = async () => {
    if (!window.ethereum) {
      console.error("MetaMask not found!");
      return;
    }
    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await ethProvider.getSigner();
      initContracts(ethProvider, signer, accounts[0]);
      console.log({
        "Connected account": accounts[0],
        "ethProvider": ethProvider,
        "signer": signer
      });
      // ✅ Store wallet address in sessionStorage
      sessionStorage.setItem("connectedWallet", accounts[0]);
    } catch (err) {
      console.error("Wallet connection failed:", err);
    }
  };

  // On page load, check if wallet address is stored
  useEffect(() => {
    const savedWallet = sessionStorage.getItem("connectedWallet");
    if (savedWallet && window.ethereum) {
      const autoConnect = async () => {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await ethProvider.getSigner();
        console.log("signer", signer);
        initContracts(ethProvider, signer, savedWallet);
      };
      autoConnect();
    }
  }, []);
  //logout
   const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContracts({});
    setAccount(null);
    sessionStorage.removeItem("connectedWallet");
    console.log("Wallet disconnected");
  };


  const initContracts = (ethProvider, signer, account) => {
    const funding = new ethers.Contract(FUNDING_ADDRESS, healthCareFundingAbi, signer);
    const storage = new ethers.Contract(STORAGE_ADDRESS, storageAbi, signer);
    const hospital = new ethers.Contract(HOSPITAL_ADDRESS, hospitalRegistryAbi, signer);
    setProvider(ethProvider);
    setSigner(signer);
    setContracts({ funding, storage, hospital });
    setAccount(account);
    console.log("Contracts initialized", { funding, storage, hospital });
  };

  return (
    <ContractContext.Provider value={{ provider, signer, account, ...contracts, connectWallet,disconnectWallet }}>
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => useContext(ContractContext);
