import React, { useState } from "react";
import UploadRecordsPage from "./UploadRecordsPage";
import { useContracts } from "../context/ContractContext.jsx";

const CreateRequestPage = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    deadline: "",
    hospitalWallet: "",
    diseaseType: "",
    contactNumber: "",
    goalAmount: "",
  });
  const { funding, account } = useContracts();
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "contactNumber" && value.length > 10) return;
    if (name === "goalAmount" && parseInt(value) < 0) return;

    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validateStep1 = () => {
    let newErrors = {};
    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.deadline) newErrors.deadline = "Deadline is required";
    if (!formData.hospitalWallet) newErrors.hospitalWallet = "Hospital wallet address is required";
    if (!formData.diseaseType) newErrors.diseaseType = "Disease Type is required";
    if (!formData.contactNumber) newErrors.contactNumber = "Contact Number is required";
    if (!formData.goalAmount) newErrors.goalAmount = "Goal Amount is required";
    if (formData.goalAmount && parseInt(formData.goalAmount) < 5000)
      newErrors.goalAmount = "Goal Amount must be at least 5000";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      if (!funding || !account) {
        alert("Wallet not connected or contract not loaded.");
        return;
      }

      const deadlineTimestamp = Math.floor(new Date(formData.deadline).getTime() / 1000);

      const tx = await funding.createRequest(
        formData.name,
        formData.description,
        deadlineTimestamp,
        formData.hospitalWallet,
        formData.diseaseType,
        formData.contactNumber,
        parseInt(formData.goalAmount)
      );

      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);
      alert("Funding request created successfully!");

      setFormData({
        name: "",
        description: "",
        deadline: "",
        hospitalWallet: "",
        diseaseType: "",
        contactNumber: "",
        goalAmount: "",
      });
    } catch (error) {
      console.error("Error creating funding request:", error);
      alert("Failed to create funding request. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-5xl grid md:grid-cols-2 gap-8">
        {/* Left Illustration */}
        <div className="flex flex-col justify-center items-center">
          <img
            src="https://cdn-icons-png.flaticon.com/512/4320/4320337.png"
            alt="Fundraiser Illustration"
            className="w-40 h-40 mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-800">
            Dear {formData.name || "Friend"},
          </h2>
          <p className="text-gray-600 mt-2">
            {step === 1 ? "Let's get your fundraiser started." : "Please upload hospital documents"}
          </p>
        </div>

        {/* Right Form */}
        <div>
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center">
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-white ${step === 1 ? "bg-green-600" : "bg-gray-300"}`}>1</div>
              <div className="w-16 h-[2px] bg-gray-300"></div>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full text-white ${step === 2 ? "bg-green-600" : "bg-gray-300"}`}>2</div>
            </div>
          </div>

          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-4">
                Patient Details
              </h3>
              <form className="space-y-4">
  <div>
    <label className="block text-gray-700 font-medium mb-1">Patient Name*</label>
    <input
      type="text"
      name="name"
      value={formData.name}
      onChange={handleChange}
      placeholder="Enter full name"
      className="w-full border rounded-lg px-4 py-2"
    />
    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
  </div>

  <div>
    <label className="block text-gray-700 font-medium mb-1">Case Description*</label>
    <textarea
      name="description"
      value={formData.description}
      onChange={handleChange}
      placeholder="Briefly describe the case"
      className="w-full border rounded-lg px-4 py-2"
    />
    {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
  </div>

  <div>
    <label className="block text-gray-700 font-medium mb-1">Fundraising Deadline*</label>
    <input
      type="datetime-local"
      name="deadline"
      value={formData.deadline}
      onChange={handleChange}
      className="w-full border rounded-lg px-4 py-2"
    />
    {errors.deadline && <p className="text-red-500 text-sm">{errors.deadline}</p>}
  </div>

  <div>
    <label className="block text-gray-700 font-medium mb-1">Hospital Wallet Address*</label>
    <input
      type="text"
      name="hospitalWallet"
      value={formData.hospitalWallet}
      onChange={handleChange}
      placeholder="0x... Ethereum wallet address"
      className="w-full border rounded-lg px-4 py-2"
    />
    {errors.hospitalWallet && <p className="text-red-500 text-sm">{errors.hospitalWallet}</p>}
  </div>

  <div>
    <label className="block text-gray-700 font-medium mb-1">Disease Type*</label>
    <input
      type="text"
      name="diseaseType"
      value={formData.diseaseType}
      onChange={handleChange}
      placeholder="e.g., Cancer, Heart Disease"
      className="w-full border rounded-lg px-4 py-2"
    />
    {errors.diseaseType && <p className="text-red-500 text-sm">{errors.diseaseType}</p>}
  </div>

  <div>
    <label className="block text-gray-700 font-medium mb-1">Contact Number*</label>
    <input
      type="number"
      name="contactNumber"
      value={formData.contactNumber}
      onChange={handleChange}
      placeholder="10-digit phone number"
      className="w-full border rounded-lg px-4 py-2"
    />
    {errors.contactNumber && <p className="text-red-500 text-sm">{errors.contactNumber}</p>}
  </div>

  <div>
    <label className="block text-gray-700 font-medium mb-1">Goal Amount (Min 5000 INR)*</label>
    <input
      type="number"
      name="goalAmount"
      value={formData.goalAmount}
      onChange={handleChange}
      placeholder="Enter fundraising goal"
      className="w-full border rounded-lg px-4 py-2"
    />
    {errors.goalAmount && <p className="text-red-500 text-sm">{errors.goalAmount}</p>}
  </div>
</form>


              <div className="mt-6 flex justify-end">
                <button onClick={handleSubmit} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                  createRequest
                </button>
                <button onClick={nextStep} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700">
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <UploadRecordsPage formData={formData} prevStep={prevStep} handleSubmit={handleSubmit} />
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateRequestPage;
