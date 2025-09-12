import React, { useState } from "react";
import { CheckCircle, Clock, PlusCircle } from "lucide-react";

export default function Hospital() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [hospitals, setHospitals] = useState([
    { name: "Apollo Hospital", location: "Mumbai", status: "Verified" },
    { name: "Fortis Hospital", location: "Delhi", status: "Verified" },
    { name: "Manipal Hospital", location: "Bangalore", status: "Pending" },
    { name: "AIIMS", location: "Delhi", status: "Verified" },
    { name: "Kokilaben Hospital", location: "Mumbai", status: "Verified" },
    { name: "Max Hospital", location: "Noida", status: "Pending" },
    { name: "Lilavati Hospital", location: "Mumbai", status: "Verified" },
  ]);

  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  const [formData, setFormData] = useState({
    name: "",
    location: "",
  });

  const handleRegister = (e) => {
    e.preventDefault();
    setHospitals([
      ...hospitals,
      { ...formData, status: "Pending" },
    ]);
    setFormData({ name: "", location: "" });
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header / Hero Section */}
      <header className="relative bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 shadow-md">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-3xl font-bold drop-shadow-sm">
            Trusted Hospitals Network
          </h1>
          <p className="mt-2 text-base opacity-90 max-w-2xl mx-auto">
            Delivering reliable healthcare with verified and trusted hospitals
            across India. Browse hospitals below or register your hospital to
            join us.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Search + Add Button */}
        <div className="flex justify-between items-center mb-8">
          <input
            type="text"
            placeholder="🔍 Search hospital..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg shadow hover:bg-blue-700 transition"
          >
            <PlusCircle size={18} /> Add Hospital
          </button>
        </div>

        {/* Hospital Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHospitals.map((h, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition"
            >
              <h2 className="text-xl font-bold text-gray-800">{h.name}</h2>
              <p className="text-gray-600">{h.location}</p>
              <p className="mt-2 flex items-center gap-2">
                Status:{" "}
                {h.status === "Verified" ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle size={16} /> Verified
                  </span>
                ) : (
                  <span className="text-yellow-600 flex items-center gap-1">
                    <Clock size={16} /> Pending
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {/* Registration Modal */}
{showForm && (
  <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex justify-center items-center">
    <div className="bg-white p-8 rounded-2xl shadow-2xl border border-gray-100 w-96">
      <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">
        Register Hospital
      </h2>
      <form onSubmit={handleRegister} className="space-y-4">
        <input
          type="text"
          placeholder="Hospital Name"
          value={formData.name}
          onChange={(e) =>
            setFormData({ ...formData, name: e.target.value })
          }
          required
          className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <input
          type="text"
          placeholder="Location"
          value={formData.location}
          onChange={(e) =>
            setFormData({ ...formData, location: e.target.value })
          }
          required
          className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
        />
        <div className="flex justify-between mt-4">
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            Register
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      </main>
    </div>
  );
}