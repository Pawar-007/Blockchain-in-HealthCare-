import React, { useEffect, useState } from "react";
import { useContracts } from "../context/ContractContext.jsx";

export default function FundedRequests() {
  const [requests, setRequests] = useState([]);
  const { funding } = useContracts();

  const decodeRequests = (proxyArray) => {
    return proxyArray.map((r) => ({
      patient: r[0],
      name: r[1],
      description: r[2],
      createdAt: Number(r[3]),
      deadline: Number(r[4]),
      hospitalWallet: r[5],
      diseaseType: r[6],
      patientCallVerified: r[7],
      hospitalCrosscheckVerified: r[8],
      physicalVisitVerified: r[9],
      contactNumber: r[10],
      visible: r[11],
      active: r[12],
      isFunded: r[13],
      totalFunded: Number(r[14]),
      goalAmount: Number(r[15]),
      medicalRecords: r[16]?.toArray?.() || [],
    }));
  };

  const fetchFundedRequests = async () => {
    if (!funding) return;

    try {
      const raw = await funding.getAllRequests();
      const decoded = decodeRequests(raw.toArray());
      const funded = decoded.filter((r) => r.isFunded);
      setRequests(funded);
    } catch (err) {
      console.error("Error fetching funded requests:", err);
    }
  };

  useEffect(() => {
    fetchFundedRequests();
  }, [funding]);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <h1 className="text-4xl font-bold text-center mb-10 text-blue-600">
        Funded Healthcare Requests
      </h1>

      {requests.length === 0 ? (
        <p className="text-center text-gray-600 mt-10">
          No funded requests available.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {requests.map((req, i) => (
            <div
              key={i}
              className="flex flex-col md:flex-row w-full bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition gap-6"
            >
              {/* Left: Patient Info */}
              <div className="flex-1 flex flex-col justify-between">
                <h2 className="text-xl font-semibold text-gray-800">{req.name}</h2>
                <p className="text-gray-600 text-sm mt-2">{req.description}</p>
                <div className="mt-3 flex gap-2 flex-wrap">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                    {req.diseaseType}
                  </span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                    Funded
                  </span>
                </div>
              </div>

              {/* Right: Addresses & Contact */}
              <div className="flex flex-col justify-between text-sm text-gray-700 md:w-80 mt-4 md:mt-0">
                <p className="break-all">
                  <span className="font-semibold">Patient Address: </span>
                  {req.patient}
                </p>
                <p className="break-all mt-1">
                  <span className="font-semibold">Hospital Address: </span>
                  {req.hospitalWallet}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Contact: </span>
                  {req.contactNumber}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Goal Amount: </span>
                  {req.goalAmount} ETH
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
