import { useState } from "react";

const CreateRequest = ({ onSubmit }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hospitalWallet, setHospitalWallet] = useState("");
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [diseaseType, setDiseaseType] = useState("");

  // Handle adding multiple IPFS links
  const [currentIPFS, setCurrentIPFS] = useState("");

  const addMedicalRecord = () => {
    if (currentIPFS.trim() !== "") {
      setMedicalRecords([...medicalRecords, currentIPFS.trim()]);
      setCurrentIPFS("");
    }
  };

  const removeMedicalRecord = (index) => {
    setMedicalRecords(medicalRecords.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Call parent onSubmit (or smart contract function)
    onSubmit({
      name,
      description,
      deadline: new Date(deadline).getTime() / 1000, // timestamp in seconds
      hospitalWallet,
      medicalRecords,
      diseaseType
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-8">
      <h2 className="text-2xl font-bold mb-6 text-center">Create New Campaign</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campaign Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Campaign Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            rows={4}
            required
          />
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium mb-1">Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Hospital Wallet */}
        <div>
          <label className="block text-sm font-medium mb-1">Hospital Wallet Address</label>
          <input
            type="text"
            value={hospitalWallet}
            onChange={(e) => setHospitalWallet(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Disease Type */}
        <div>
          <label className="block text-sm font-medium mb-1">Disease Type</label>
          <input
            type="text"
            value={diseaseType}
            onChange={(e) => setDiseaseType(e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        {/* Medical Records */}
        <div>
          <label className="block text-sm font-medium mb-1">Medical Records (IPFS Links)</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={currentIPFS}
              onChange={(e) => setCurrentIPFS(e.target.value)}
              placeholder="IPFS CID link"
              className="flex-1 border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-400"
            />
            <button
              type="button"
              onClick={addMedicalRecord}
              className="bg-blue-500 text-white px-4 rounded-md hover:bg-blue-600 transition"
            >
              Add
            </button>
          </div>
          <ul className="space-y-1">
            {medicalRecords.map((record, index) => (
              <li key={index} className="flex justify-between items-center bg-gray-100 px-3 py-1 rounded-md">
                <span>{record}</span>
                <button
                  type="button"
                  onClick={() => removeMedicalRecord(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Submit Button */}
        <div className="text-center">
          <button
            type="submit"
            className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-2 rounded-lg hover:from-green-500 hover:to-blue-600 transition"
          >
            Create Campaign
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRequest;
