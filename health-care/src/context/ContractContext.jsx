import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { healthCareFundingAbi, storageAbi, hospitalRegistryAbi } from "../contractIntegration/contractAbi.js";

// Contract addresses from .env
const FUNDING_ADDRESS = import.meta.env.VITE_FUNDING_ADDRESS;
const STORAGE_ADDRESS = import.meta.env.VITE_STORAGE_ADDRESS;
const HOSPITAL_ADDRESS = import.meta.env.VITE_HOSPITAL_ADDRESS;

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contracts, setContracts] = useState({});
  const [account, setAccount] = useState(null);
  const [hasCheckedRegistration, setHasCheckedRegistration] = useState(false);

  // Connect wallet manually
  const connectWallet = async () => {
    if (!window.ethereum) {
      console.error("❌ MetaMask not found!");
      return;
    }
    try {
      const ethProvider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      const signer = await ethProvider.getSigner();

      initContracts(ethProvider, signer, accounts[0]);
      sessionStorage.setItem("connectedWallet", accounts[0]);

      console.log("✅ Wallet connected:", accounts[0]);
    } catch (err) {
      console.error("❌ Wallet connection failed:", err);
    }
  };

  // Auto-connect if wallet was previously connected
  useEffect(() => {
    const savedWallet = sessionStorage.getItem("connectedWallet");
    if (savedWallet && window.ethereum) {
      const autoConnect = async () => {
        const ethProvider = new ethers.BrowserProvider(window.ethereum);
        const signer = await ethProvider.getSigner();
        initContracts(ethProvider, signer, savedWallet);
      };
      autoConnect();
    }
  }, []);

  // Disconnect wallet
  const disconnectWallet = () => {
    setProvider(null);
    setSigner(null);
    setContracts({});
    setAccount(null);
    setHasCheckedRegistration(false);
    sessionStorage.removeItem("connectedWallet");
    console.log("🔌 Wallet disconnected");
  };

  // Initialize contracts
  const initContracts = (ethProvider, signer, account) => {
    try {
      const funding = new ethers.Contract(
        FUNDING_ADDRESS,
        healthCareFundingAbi,
        signer
      );
      const storage = new ethers.Contract(
        STORAGE_ADDRESS,
        storageAbi,
        signer
      );
      const hospital = new ethers.Contract(
        HOSPITAL_ADDRESS,
        hospitalRegistryAbi,
        signer
      );

      setProvider(ethProvider);
      setSigner(signer);
      setContracts({ funding, storage, hospital });
      setAccount(account);

      console.log("✅ Contracts initialized");
    } catch (err) {
      console.error("❌ Failed to init contracts:", err);
    }
  };

  // Auto-register patient if not registered
  useEffect(() => {
    if (!contracts?.storage || !account || hasCheckedRegistration) return;

    const autoRegister = async () => {
      try {
        console.log("🔎 Checking registration for:", account);

        // Call read-only function
        const registered = await contracts.storage.isRegistered(account);

        if (!registered) {
          console.log("🟡 Not registered. Registering now...");
          const tx = await contracts.storage.registerPatient(account);
          await tx.wait();
          console.log("✅ Patient registered successfully");
        } else {
          console.log("✅ Patient already registered");
        }
      } catch (err) {
        console.error("⚠️ Registration check failed:", err);
      } finally {
        setHasCheckedRegistration(true);
      }
    };

    autoRegister();
  }, [contracts?.storage, account, hasCheckedRegistration]);

  return (
    <ContractContext.Provider
      value={{
        provider,
        signer,
        account,
        ...contracts,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContracts = () => useContext(ContractContext);
