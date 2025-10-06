// import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";

// const UploadRecordsPage = ({ prevStep }) => {
//   const [files, setFiles] = useState([]);
//   const [notification, setNotification] = useState(null);
//   const navigate = useNavigate();

//   const handleFileChange = (e) => {
//     setFiles([...e.target.files]);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault(); // prevent refresh on Enter
//     if (files.length === 0) {
//       setNotification({
//         type: "error",
//         message: "⚠️ Please upload at least one record before submitting.",
//       });
//       return;
//     }

//     setNotification({
//       type: "success",
//       message: "✅ Your request has been created successfully!",
//     });

//     setTimeout(() => {
//       setNotification(null);
//       navigate("/"); // redirect after 5 sec
//     }, 5000);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-6">
//       <h3 className="text-lg font-semibold text-green-600 mb-4">
//         Upload Records
//       </h3>
//       <p className="text-sm text-gray-500 mb-4">
//         Uploading medical records helps in faster approvals.
//       </p>

//       {/* File Upload Section */}
//       <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
//         <p className="text-gray-500">Drag or choose multiple files to upload</p>
//         <input
//           type="file"
//           onChange={handleFileChange}
//           className="mt-4 hidden"
//           id="fileUpload"
//           multiple
//         />
//         <label
//           htmlFor="fileUpload"
//           className="bg-green-600 text-white px-4 py-2 rounded-lg cursor-pointer hover:bg-green-700 mt-2"
//         >
//           Choose Files
//         </label>
//         {files.length > 0 && (
//           <ul className="mt-2 text-sm text-gray-700 w-full text-left">
//             {files.map((file, index) => (
//               <li key={index}>📄 {file.name}</li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Buttons */}
//       <div className="mt-6 flex justify-between">
//         <button
//           type="button"
//           onClick={prevStep}
//           className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50"
//         >
//            Back
//         </button>
//         <button
//           type="submit"
//           className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
//         >
//           Submit →
//         </button>
//       </div>

//       {/* Notification System */}
//       {notification && (
//         <div
//           className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all ${
//             notification.type === "success"
//               ? "bg-black"
//               : "bg-red-600"
//           }`}
//         >
//           {notification.message}
//         </div>
//       )}
//     </form>
//   );
// };

// export default UploadRecordsPage;
import React, { useEffect, useState } from "react";
import { useContracts } from "../context/ContractContext.jsx";
import { useMedicalRecords } from "../context/MedicalRecordContext.jsx";

const UploadRecordsPage = ({ prevStep }) => {
  const { storage, account } = useContracts();
  const { fetchRecords, medicalRecords } = useMedicalRecords();
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [notification, setNotification] = useState(null);

  // Fetch all records when component mounts
  useEffect(() => {
    if (account) fetchRecords();
  }, [account]);

  // Toggle checkbox selection
  const toggleRecord = (id) => {
    setSelectedRecords((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  // Update record visibility on-chain
  const handleAttach = async () => {
    if (selectedRecords.length === 0) {
      setNotification({ type: "error", message: "Select at least one record!" });
      return;
    }

    try {
      for (const recordId of selectedRecords) {
        const tx = await storage.markRecordForFunding(recordId, true);
        await tx.wait();
      }

      setNotification({ type: "success", message: "Records attached successfully!" });
      fetchRecords(); // refresh records
      setSelectedRecords([]);
    } catch (error) {
      console.error(error);
      setNotification({ type: "error", message: "Failed to attach records" });
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h3 className="text-lg font-semibold text-green-600 mb-4">Attach Medical Records</h3>
      <p className="text-sm text-gray-500 mb-4">
        Select the records you want to attach or make visible for this funding request.
      </p>

      {/* Record List */}
      <div className="space-y-3 mb-6">
        {medicalRecords.length === 0 ? (
          <p className="text-sm text-gray-500">No medical records found. Upload records first.</p>
        ) : (
          medicalRecords.map((record) => (
            <div
              key={record.id}
              className="flex items-center border rounded-lg p-3 justify-between"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedRecords.includes(record.id)}
                  onChange={() => toggleRecord(record.id)}
                  className="h-4 w-4"
                />
                <div>
                  <p className="font-medium">{record.title}</p>
                  <p className="text-sm text-gray-500">{record.doctor}</p>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                {record.visible ? "Visible" : "Hidden"}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={prevStep}
          className="border border-green-600 text-green-600 px-6 py-2 rounded-lg hover:bg-green-50"
        >
          ← Back
        </button>
        <button
          onClick={handleAttach}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Attach Selected Records
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
            notification.type === "success" ? "bg-black" : "bg-red-600"
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default UploadRecordsPage;
