import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useContracts } from "../context/ContractContext.jsx";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs.jsx";
import { Shield, RefreshCw, Building2, Users, FileText, Clock } from "lucide-react";
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

  // Check admin/owner status
  const checkAdminStatus = async () => {
    if (!funding || !hospital || !account) return;
    try {
      const adminMapping = await funding.admins(account);
      setIsAdmin(adminMapping);

      const ownerAddress = await funding.owner();
      setIsOwner(ownerAddress.toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error(err);
    }
  };

  // Load all data
  const loadData = async () => {
    if (!funding || !hospital) return;
    setLoading(true);
    try {
      // Hospitals
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

      console.log("All Hospitals:", allHospitals);
      setHospitalList(allHospitals.filter(h => !h.isVerified));

      // Requests
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkAdminStatus(); }, [account, funding, hospital]);
  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin]);

  // Admin actions
  const handleAddAdmin = async () => {
    if (!ethers.isAddress(newAdmin)) {
      toast({ title: "Invalid Address", description: "Enter a valid wallet address", variant: "destructive" });
      return;
    }
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
  };

  const handleVerifyHospital = async (addr) => {
    try {
      setLoading(true);
      const tx = await hospital.verifyHospital(addr, true);
      await tx.wait();
      toast({ title: "Success", description: "Hospital verified" });
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleVerifyRequestStep = async (req, step) => {
    try {
      setLoading(true);
      let tx;
      if (step === "patientCall") tx = await funding.verifyPatientCall(req.patient);
      if (step === "hospitalCrosscheck") tx = await funding.verifyHospitalCrosscheck(req.patient);
      if (step === "physicalVisit") tx = await funding.verifyPhysicalVisit(req.patient);
      if (tx) { await tx.wait(); toast({ title: "Success", description: `${step} verified` }); loadData(); }
    } catch (err) {
      toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleReleaseFunds = async (req) => {
    try {
      setLoading(true);
      const tx = await funding.releaseFunds(req.patient);
      await tx.wait();
      toast({ title: "Success", description: "Funds released" });
      loadData();
    } catch (err) {
      toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  // Conditional rendering
  if (!account) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-6 w-full max-w-md text-center shadow-lg">
        <Shield className="mx-auto text-primary w-12 h-12 mb-4" />
        <CardTitle>Admin Portal</CardTitle>
        <p className="text-gray-600 mb-4">Connect your admin wallet to access the platform.</p>
        <Button onClick={connectWallet} disabled={loading} className="w-full">{loading ? "Connecting..." : "Connect Wallet"}</Button>
      </Card>
    </div>
  );

  if (!isAdmin) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-6 w-full max-w-md text-center shadow-lg">
        <Shield className="mx-auto text-red-600 w-12 h-12 mb-4" />
        <CardTitle className="text-xl">Access Denied</CardTitle>
        <p className="text-gray-600">Only authorized admins can access this page.</p>
        <p className="mt-4 font-mono text-sm break-all text-gray-500">{account}</p>
      </Card>
    </div>
  );

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
              <CardTitle className="flex items-center gap-2 text-xl"><Users />Add New Admin</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Input placeholder="Admin wallet address" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} className="flex-1" />
              <Button onClick={handleAddAdmin} disabled={loading || !newAdmin.trim()}>Add Admin</Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="hospitals" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-200">
            <TabsTrigger value="hospitals" className="flex items-center gap-2">Hospitals</TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">Pending Requests</TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center gap-2">Verified Requests</TabsTrigger>
          </TabsList>

          {/* Hospitals Tab */}
          <TabsContent value="hospitals">
  <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {hospitalList.length > 0 ? (
      hospitalList.map((hospital, i) => {
        console.log("Hospital:", hospital); // ✅ move log outside JSX return
        return (
          <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 space-y-2">
              <p className="text-lg font-semibold">{hospital.name}</p>
              <p><b className="text-gray-600">Location:</b> {hospital.location}</p>
              <p><b className="text-gray-600">Email:</b> {hospital.email}</p>
              <p className="break-all"><b className="text-gray-600">Wallet:</b> {hospital.wallet}</p>
              <p><b className="text-gray-600">Registered At:</b> {new Date(hospital.registeredAt * 1000).toLocaleString()}</p>

              {isOwner && !hospital.isVerified && (
                <Button
                  onClick={() => handleVerifyHospital(hospital.wallet)}
                  disabled={loading}
                  className="mt-4 w-full"
                >
                  Verify Hospital
                </Button>
              )}
            </CardContent>
          </Card>
        );
      })
    ) : (
      <p className="col-span-3 text-center text-gray-500">
        No unverified hospitals found.
      </p>
    )}
  </div>
</TabsContent>


          {/* Pending Requests Tab */}
          <TabsContent value="pending" className="">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingRequests.length > 0 ? pendingRequests.map((req, i) => (
                <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
                  {console.log()}
                  <CardContent className="p-4 space-y-2">
                    <p className="text-lg font-semibold">Request for: {req.name}</p>
                    <p><b>Patient:</b> {req.patient}</p>
                    <p><b>Hospital:</b> {req.hospitalWallet}</p>
                    <p><b>Amount:</b> {ethers.formatEther(req.goalAmount)} ETH</p>
                    <p><b>Donations:</b> {ethers.formatEther(req.totalFunded)} ETH</p>
                    <div className="flex flex-col space-y-2 mt-4">
                      {!req.patientCallVerified && <Button onClick={() => handleVerifyRequestStep(req, "patientCall")} disabled={loading} className="w-full">Verify Patient Call</Button>}
                      {!req.hospitalCrosscheckVerified && <Button onClick={() => handleVerifyRequestStep(req, "hospitalCrosscheck")} disabled={loading} className="w-full">Verify Hospital Crosscheck</Button>}
                      {!req.physicalVisitVerified && <Button onClick={() => handleVerifyRequestStep(req, "physicalVisit")} disabled={loading} className="w-full">Verify Physical Visit</Button>}
                    </div>
                  </CardContent>
                </Card>
              )) : <p className="col-span-3 text-center text-gray-500">No pending requests.</p>}
            </div>
          </TabsContent>

          {/* Verified Requests Tab */}
          <TabsContent value="verified" className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {verifiedRequests.length > 0 ? verifiedRequests.map((req, i) => (
                <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-2">
                    <p className="text-lg font-semibold">Request for: {req.name}</p>
                    <p><b>Patient:</b> {req.patient}</p>
                    <p><b>Hospital:</b> {req.hospitalWallet}</p>
                    <p><b>Amount:</b> {ethers.formatEther(req.goalAmount)} ETH</p>
                    <p><b>Donations:</b> {ethers.formatEther(req.totalFunded)} ETH</p>
                    <Button onClick={() => handleReleaseFunds(req)} disabled={loading} className="mt-4 w-full">Release Funds</Button>
                  </CardContent>
                </Card>
              )) : <p className="col-span-3 text-center text-gray-500">No verified requests pending funds release.</p>}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
