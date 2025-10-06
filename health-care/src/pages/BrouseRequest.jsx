import React, { useState, useEffect } from "react";
import { useContracts } from "../context/ContractContext.jsx";
import { Input } from "../components/ui/Input.jsx";
export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const {funding} = useContracts();
  const decodeRequests = (proxyArray) => {
  return proxyArray.map((r) => {
    return {
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
      medicalRecords: r[16]?.toArray?.() || [], // convert nested Proxy to array
    };
  });
};

   const fetchVerifiedNotFundedRequests = async () => {
    if (!funding) {
    console.error("Funding contract not available");
    return;
    }
    try {
    const raw = await funding.getVerifiedNotFundedRequests();
    const decoded = decodeRequests(raw.toArray()); // convert top-level Proxy to array
    setRequests(decoded);
  } catch (err) {
    console.error("Error fetching verified requests:", err);
  }
};



  useEffect(() => {
    // setRequests([
    //   {
    //     title: "Kidney Transplant for Rajesh",
    //     description:
    //       "Rajesh requires an urgent kidney transplant. Verified by Apollo Hospital with nephrologist’s reports.",
    //     category: "Transplant",
    //     verified: true,
    //     severity: "Critical",
    //     raised: 12000,
    //     goal: 25000,
    //     donors: 210,
    //     daysLeft: 7,
    //     patientAge: "46yr",
    //   },
    //   {
    //     title: "Chemotherapy for Ananya",
    //     description:
    //       "Ananya, a young mother, is undergoing chemotherapy. Financial aid is needed to continue her treatment.",
    //     category: "Cancer",
    //     verified: true,
    //     severity: "High",
    //     raised: 15200,
    //     goal: 30000,
    //     donors: 134,
    //     daysLeft: 15,
    //     patientAge: "29yr",
    //   },
    //   {
    //     title: "Accident Recovery Surgery for Mohan",
    //     description:
    //       "Mohan met with a severe road accident and needs multiple orthopedic surgeries to recover.",
    //     category: "Emergency",
    //     verified: true,
    //     severity: "Medium",
    //     raised: 9400,
    //     goal: 20000,
    //     donors: 98,
    //     daysLeft: 10,
    //     patientAge: "38yr",
    //   },
    //   {
    //     title: "Neonatal Care for Twins",
    //     description:
    //       "Premature twins admitted in NICU require prolonged neonatal care. Family is unable to bear the expenses.",
    //     category: "Pediatric",
    //     verified: true,
    //     severity: "High",
    //     raised: 17800,
    //     goal: 40000,
    //     donors: 256,
    //     daysLeft: 20,
    //     patientAge: "2mo",
    //   },
    //   {
    //     title: "Heart Valve Replacement for Sita",
    //     description:
    //       "Sita requires urgent heart valve replacement surgery. Verified by Fortis Hospital.",
    //     category: "Cardiac",
    //     verified: true,
    //     severity: "Critical",
    //     raised: 22000,
    //     goal: 50000,
    //     donors: 312,
    //     daysLeft: 9,
    //     patientAge: "54yr",
    //   },
    // ]);
    fetchVerifiedNotFundedRequests();
  }, [funding]);

  // Filter logic
  const filteredRequests =
    selectedCategory === "All Categories"
      ? requests
      : requests.filter((req) => req.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      {/* Header + Fund to Everyone Button */}
      <div className="flex justify-between items-center mb-10">
        <div className="text-center flex-1">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-500 bg-clip-text text-transparent">
            Browse Funding Requests
          </h1>
          <p className="text-gray-600 mt-2">
            Discover verified healthcare funding campaigns and make a direct
            impact on someone's life
          </p>
        </div>

        <button className="ml-6 px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition">
          Fund to Everyone
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <input
          type="text"
          placeholder="Search campaigns..."
          className="w-full md:w-1/2 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-3">
          <select
            className="border rounded-lg px-3 py-2"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option>All Categories</option>
            <option>Emergency</option>
            <option>Cancer</option>
            <option>Pediatric</option>
            <option>Transplant</option>
            <option>Cardiac</option>
          </select>
          <select className="border rounded-lg px-3 py-2">
            <option>Newest</option>
            <option>Ending Soon</option>
            <option>Most Funded</option>
          </select>
        </div>
      </div>

      {/* Requests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {requests.map((req, i) => (
  <div
    key={i}
    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition"
  >
    {/* Tags */}
    <div className="flex gap-2 mb-3 flex-wrap">
      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
        {req.diseaseType} {/* category equivalent */}
      </span>
      {req.visible && (
        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          Verified
        </span>
      )}
      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
        {req.isFunded ? "Funded" : "Not Funded"}
      </span>
    </div>

    {/* Title + Description */}
    <h2 className="text-lg font-semibold">{req.name}</h2>
    <p className="text-gray-600 text-sm mt-2">{req.description}</p>

    {/* Progress */}
    <div className="mt-4">
      <p className="font-semibold text-gray-800">
        ${req.totalFunded.toLocaleString()}{" "}
        <span className="font-normal text-gray-500">
          raised of ${req.goalAmount.toLocaleString()}
        </span>
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div
          className="bg-blue-500 h-2 rounded-full"
          style={{
            width: `${(req.totalFunded / req.goalAmount) * 100}%`,
          }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        {((req.totalFunded / req.goalAmount) * 100).toFixed(1)}% funded
      </p>
    </div>

    {/* Footer Info */}
    <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
      <div className="flex flex-col items-center">
        <span className="font-semibold">{req.medicalRecords.length}</span>
        <span>records</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="font-semibold">
          {Math.ceil((req.deadline - Math.floor(Date.now() / 1000)) / 86400)}
        </span>
        <span>days left</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="font-semibold">{req.contactNumber}</span>
        <span>contact</span>
      </div>
    </div>

    {/* Donate Button */}
    <div className="mt-5 flex items-center gap-3">
  <Input
    placeholder="Enter amount in USD"
    className="flex-1 p-2 border border-gray-300 rounded-lg"
  />
  <button
    onClick={() => alert(`Donating to: ${req.name}`)}
    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition flex items-center justify-center gap-2"
  >
    <span>♡</span>
    <span>Donate Now</span>
  </button>
</div>

  </div>
))}

      </div>
    </div>
  );
}

