import React, { useState, useEffect } from "react";
import { useContracts } from "../context/ContractContext.jsx";
import { useToast } from "../components/ui/use-toast.jsx";
import  uploadToLighthouse  from "../ipfsIntegration/uploadOnIpfs.js";
import { MapPin, Mail, Phone, CheckCircle, Clock, FileText,PlusCircle, Calendar } from "lucide-react";

export default function Hospital() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [registering, setRegistering] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    email: "",
    contact: "",
  });
  const [file, setFile] = useState(null);

  const { toast } = useToast();
  const { account, hospital } = useContracts();

  // Fetch hospitals
  // Fetch hospitals
const fetchHospitals = async () => {
  if (!hospital) return;
  try {
    setLoadingHospitals(true);
    const events = await hospital.queryFilter("HospitalRegistered");
    console.log("HospitalRegistered events:", events);
    const addresses = [...new Set(events.map((e) => e.args.hospital))];

    const fetched = [];
    for (let addr of addresses) {
      const data = await hospital.getHospitalData(addr);
      console.log("Raw hospital data:", addr);
      //Correct destructuring
      const [
        name,
        location,
        cid,
        email,
        contact,
        wallet,
        isVerified,
        registeredAt,
      ] = data;

      if (name && name !== "") {
        fetched.push({
          address: wallet,
          name,
          location,
          cid,
          email,
          contact,
          status: isVerified ? "Verified" : "Pending",
          registeredAt: Number(registeredAt),
        });
      }
    }
    console.log("Fetched hospitals:", fetched);
    setHospitals(fetched);
  } catch (err) {
    console.error("Error fetching hospitals:", err);
    toast({
      title: "Failed to fetch hospitals",
      description: err.message || "Something went wrong",
      variant: "destructive",
    });
  } finally {
    setLoadingHospitals(false);
  }
};


  const handleRegister = async (e) => {
  e.preventDefault();
  if (!hospital) return;

  if (!file) {
    toast({
      title: "Missing file",
      description: "Please upload verification document.",
      variant: "destructive",
    });
    return;
  }

  try {
    setRegistering(true);
    const cid = await uploadToLighthouse(file);

    const tx = await hospital.registerHospital(
      formData.name,
      formData.location,
      cid,
      formData.email,
      formData.contact
    );
    await tx.wait();

    toast({
      title: "Hospital registered",
      description: `${formData.name} successfully added as Pending`,
    });

    setFormData({ name: "", location: "", email: "", contact: "" });
    setFile(null);
    setShowForm(false);

    fetchHospitals();
  } catch (err) {
    console.error("Registration failed:", err);

    // extract clean error message
    let errorMsg = "Something went wrong";
    if (err.reason) {
      errorMsg = err.reason; // smart contract revert reason
    } else if (err.error && err.error.message) {
      errorMsg = err.error.message;
    } else if (err.message) {
      // sometimes ethers wraps it in execution reverted: ...
      const match = err.message.match(/execution reverted:? (.*)/);
      errorMsg = match ? match[1].replace(/['"]+/g, "") : err.message;
    }

    toast({
      title: "Registration failed",
      description: errorMsg,
      variant: "destructive",
    });
  } finally {
    setRegistering(false);
  }
};

  // Fetch hospitals when hospital contract or account is ready
  useEffect(() => {
    if (hospital && account) {
      fetchHospitals();
    }
  }, [hospital, account]);

  // Event listener for new hospital registration
  useEffect(() => {
    if (!hospital) return;
    const callback = () => {
      console.log("New hospital registered → refreshing list");
      fetchHospitals();
    };
    hospital.on("HospitalRegistered", callback);

    return () => {
      hospital.off("HospitalRegistered", callback);
    };
  }, [hospital]);

  const filteredHospitals = hospitals.filter((h) =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="relative bg-gradient-to-r from-blue-600 to-blue-500 text-white py-6 shadow-md">
        <div className="container mx-auto text-center px-4">
          <h1 className="text-3xl font-bold drop-shadow-sm">
            Trusted Hospitals Network
          </h1>
          <p className="mt-2 text-base opacity-90 max-w-2xl mx-auto">
            Delivering reliable healthcare with verified and trusted hospitals
            across India.
          </p>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10">
        {/* Search + Add Button */}
        <div className="flex justify-between items-center mb-8">
          <input
            type="text"
            placeholder="Search hospital..."
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
        {loadingHospitals ? (
          <p className="text-center text-gray-600">Loading hospitals...</p>
        ) : filteredHospitals.length === 0 ? (
          <p className="text-center text-gray-600">
            No hospitals are registered here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.slice(0, 9).map((h, index) => (
              <div
  key={index}
  className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1"
>
  {/* Header */}
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-semibold text-gray-900">{h.name}</h2>
    <span
      className={`px-3 py-1 text-xs font-medium rounded-full flex items-center gap-1 ${
        h.status === "Verified"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700"
      }`}
    >
      {h.status === "Verified" ? (
        <CheckCircle size={14} />
      ) : (
        <Clock size={14} />
      )}
      {h.status}
    </span>
  </div>

  {/* Details */}
  <div className="space-y-2 text-gray-700">
    <p className="flex items-center gap-2">
      <MapPin size={16} className="text-blue-500" />
      {h.location}
    </p>
    <p className="flex items-center gap-2">
      <Mail size={16} className="text-red-500" />
      {h.email}
    </p>
    <p className="flex items-center gap-2">
      <Phone size={16} className="text-green-500" />
      {h.contact}
    </p>
    {h.registeredAt && (
      <p className="flex items-center gap-2 text-sm text-gray-500">
        <Calendar size={16} className="text-purple-500" />
        Registered on:{" "}
        {new Date(h.registeredAt * 1000).toLocaleDateString("en-IN")}
      </p>
    )}
  </div>

  {/* Document */}
  {h.cid && (
    <a
      href={`https://gateway.lighthouse.storage/ipfs/${h.cid}`}
      target="_blank"
      rel="noreferrer"
      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
    >
      <FileText size={16} />
      View Document
    </a>
  )}
</div>
            ))}
          </div>
        )}

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
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="tel"
                  placeholder="Contact Number"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  required
                  className="w-full border px-3 py-2 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
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
                    disabled={registering}
                  >
                    {registering ? "Registering..." : "Register"}
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
