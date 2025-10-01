import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useContracts } from "../context/ContractContext.jsx";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Shield, RefreshCw, Users } from "lucide-react";
import { useToast } from "../components/ui/use-toast.jsx";

const AdminPage = () => {
  const { account, funding, hospital, connectWallet } = useContracts();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hospitalList, setHospitalList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [verifiedRequests, setVerifiedRequests] = useState([]);
  const [newAdmin, setNewAdmin] = useState("");

  // ✅ Check admin/owner status
  const checkAdminStatus = async () => {
    if (!funding || !account) return;
    try {
      const adminMapping = await funding.admins(account);
      console.log("Admin mapping:", adminMapping);
      setIsAdmin(adminMapping);

      const ownerAddress = await funding.owner();
      setIsOwner(ownerAddress.toLowerCase() === account.toLowerCase());

      console.log("Admin:", adminMapping, "Owner:", isOwner);
    } catch (err) {
      console.error("Error checking admin status:", err);
    }
  };

  // ✅ Load data only if admin
  const loadData = async () => {
    if (!funding || !hospital) return;
    setLoading(true);
    try {
      const allHospitalsRaw = await hospital.getAllHospitals();
      const allHospitals = allHospitalsRaw.map(h => ({
        name: h.name,
        location: h.location,
        documentCID: h.documentCID,
        email: h.email,
        contactNumber: h.contactNumber,
        wallet: h.wallet,
        isVerified: h.isVerified,
        registeredAt: Number(h.registeredAt)
      }));
      console.log("verified requests",allHospitals);

      setHospitalList(allHospitals.filter(h => !h.isVerified));

      const allRequestsRaw = await funding.getAllRequests();
      const allRequests = allRequestsRaw.map(req => ({
        name: req.name,
        patient: req.patient,
        hospitalWallet: req.hospitalWallet,
        goalAmount: req.goalAmount,
        totalFunded: req.totalFunded,
        visible: req.visible,
        isFunded: req.isFunded,
        patientCallVerified: req.patientCallVerified,
        hospitalCrosscheckVerified: req.hospitalCrosscheckVerified,
        physicalVisitVerified: req.physicalVisitVerified
      }));

      setPendingRequests(allRequests.filter(req =>
        !req.patientCallVerified || !req.hospitalCrosscheckVerified || !req.physicalVisitVerified
      ));
      setVerifiedRequests(allRequests.filter(req =>
        req.visible && !req.isFunded &&
        req.patientCallVerified && req.hospitalCrosscheckVerified && req.physicalVisitVerified
      ));
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
     
    }
  };
  // Run checks
  useEffect(() => { checkAdminStatus(); }, [account, funding]);
  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin]);

  // ✅ Restrict access
  if (!account) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-6 w-full max-w-md text-center shadow-lg">
          <Shield className="mx-auto text-primary w-12 h-12 mb-4" />
          <CardTitle>Admin Portal</CardTitle>
          <p className="text-gray-600 mb-4">Connect your admin wallet to access the platform.</p>
          <Button onClick={connectWallet} disabled={loading} className="w-full">
            {loading ? "Connecting..." : "Connect Wallet"}
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-6 w-full max-w-md text-center shadow-lg">
          <Shield className="mx-auto text-red-600 w-12 h-12 mb-4" />
          <CardTitle className="text-xl">Access Denied</CardTitle>
          <p className="text-gray-600">Only authorized admins can access this page.</p>
          <p className="mt-4 font-mono text-sm break-all text-gray-500">{account}</p>
        </Card>
      </div>
    );
  }

  // ✅ Admin-only content
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6 px-8 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" /> Admin Dashboard
        </h1>
        <Button onClick={loadData} disabled={loading} variant="secondary" className="bg-white text-gray-800 hover:bg-gray-100">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />} Refresh
        </Button>
      </div>

      <div className="container mx-auto py-8 space-y-8">
        {isOwner && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Users /> Add New Admin</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Input placeholder="Admin wallet address" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} className="flex-1" />
              <Button onClick={async () => {
                try {
                  setLoading(true);
                  const tx = await funding.addAdmin(newAdmin);
                  await tx.wait();
                  toast({ title: "Success", description: `Added ${newAdmin} as admin` });
                  setNewAdmin("");
                  checkAdminStatus();
                } catch (err) {
                  toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
                } finally { setLoading(false); }
              }} disabled={loading || !newAdmin.trim()}>Add Admin</Button>
            </CardContent>
          </Card>
        )}

       {
         hospitalList?.length > 0 && (
  hospitalList.map((record) => (
    <Card
      key={record.wallet}
      className="group relative overflow-hidden border border-border/80 shadow-sm hover:shadow-lg transition-shadow bg-gradient-to-br from-background to-background"
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-xl md:text-2xl font-semibold tracking-tight">
            {record.name}
          </CardTitle>
          <div>{record.isVerified ? "Verified" : "Pending"}</div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Registered {new Date(record.registeredAt * 1000).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
  <div className="grid gap-2">
    <p><strong>Email:</strong> {record.email}</p>
    <p><strong>Contact:</strong> {record.contactNumber}</p>
    <p><strong>Location:</strong> {record.location}</p>
    <p><strong>Wallet:</strong> <code>{record.wallet}</code></p>
    <p>
      <strong>Document CID:</strong>{" "}
      <a
        href={`https://ipfs.io/ipfs/${record.documentCID}`}
        target="_blank"
        rel="noreferrer"
        className="text-blue-600 underline"
      >
        {record.documentCID}
      </a>
    </p>
  </div>
</CardContent>


     <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
  <button
    className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 flex items-center gap-2 justify-center"
    onClick={() => onApprove(record.id)}
  >
    ✅ Approve
  </button>
  <button
    className={`w-full sm:w-auto px-4 py-2 rounded flex items-center gap-2 justify-center ${
      !record.isVerified ? "bg-amber-100 text-amber-800 hover:bg-amber-200 border border-amber-300" : "bg-gray-200 text-gray-700"
    }`}
    onClick={() => onReject(record.id)}
  >
    ❌ Reject
  </button>
</div>

    </Card>
  ))
)

       }
      </div>
    </div>
  );
};

export default AdminPage;
