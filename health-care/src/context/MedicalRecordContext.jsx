import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useToast } from "../components/ui/use-toast.jsx";
import { useContracts } from "./ContractContext.jsx";

const MedicalRecordContext = createContext();

export const MedicalRecordProvider = ({ children }) => {
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoadingRecords] = useState(false);
  const { toast } = useToast();
  const { account, storage } = useContracts();

  //  Fetch Records from Blockchain
  // const fetchRecords = useCallback(async () => {
    
  //   if (!account || !storage) return;
  //   setLoadingRecords(true);
  //   try {
  //     const records = await storage?.getMyRecords();
  //     console.log("Fetched records:", records);
  //     const parsed = records?.map((r, idx) => ({
  //       id: idx,
  //       title: r.title,
  //       ipfsHash: r.ipfsHash,
  //       metadata: r.metadata,
  //       doctor: r.doctorName,
  //       date: new Date(Number(r.timestamp) * 1000).toLocaleDateString(),
  //       sharedForFunding: r.sharedForFunding,
  //     }));
  //     setMedicalRecords(parsed);
  //   } catch (err) {
  //     console.error("Error fetching records:", err);
  //     toast({
  //       title: "Failed to load records",
  //       description: err.message || "Something went wrong",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoadingRecords(false);
  //   }
  // }, [account, storage, toast]);
  const fetchRecords = useCallback(async () => {
  if (!account || !storage) return;
  setLoadingRecords(true);

  try {
    const isReg = await storage.isRegistered(account);
    console.log("is register ",isReg); // ✅ check registration first
    if (!isReg) {
      console.log("Patient not registered yet");
      setMedicalRecords([]);
      return;
    }

    // Use provider-only instance to read data safely
    const records = await storage.getMyRecords(); // or storage.connect(provider).getMyRecords()
    console.log("Fetched records:", records);

    const parsed = records.map((r, idx) => ({
      id: idx,
      title: r.title,
      ipfsHash: r.ipfsHash,
      metadata: r.metadata,
      doctor: r.doctorName,
      date: new Date(Number(r.timestamp) * 1000).toLocaleDateString(),
      sharedForFunding: r.sharedForFunding,
    }));

    setMedicalRecords(parsed);
  } catch (err) {
    console.error("Error fetching records:", err);
    toast({
      title: "Failed to load records",
      description: err.message || "Something went wrong",
      variant: "destructive",
    });
    setMedicalRecords([]);
  } finally {
    setLoadingRecords(false);
  }
}, [account, storage, toast]);


  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  //  Add record after upload
  const addRecord = (newRecord) => {
    setMedicalRecords((prev) => [...prev, newRecord]);
  };

  return (
    <MedicalRecordContext.Provider
      value={{ medicalRecords, loading,setMedicalRecords, fetchRecords, addRecord }}
    >
      {children}
    </MedicalRecordContext.Provider>
  );
};

export const useMedicalRecords = () => useContext(MedicalRecordContext);
