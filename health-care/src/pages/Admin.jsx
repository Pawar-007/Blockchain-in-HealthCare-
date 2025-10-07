import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useContracts } from "../context/ContractContext.jsx";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import { Input } from "../components/ui/Input.jsx";
import {
  Shield,
  RefreshCw,
  Users,
  Phone,
  Building2,
  Eye,
  CheckCircle2,
  Clock,
  FileText
} from "lucide-react";
import { useToast } from "../components/ui/use-toast.jsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/Tabs.jsx";
import Badge from "../components/ui/Badge.jsx";
import { Label } from "../components/ui/Label.jsx";
import { Switch } from "../components/ui/Switch.jsx";

const AdminPage = () => {
  const { account, funding, hospital, storage, connectWallet } = useContracts();
  const { toast } = useToast();

  // --------------------
  // State
  // --------------------
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);

  const [hospitalList, setHospitalList] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [verifiedRequests, setVerifiedRequests] = useState([]);
  const [newAdmin, setNewAdmin] = useState("");
  const [recordsMap, setRecordsMap] = useState({});

  const [verifications, setVerifications] = useState({
    call: false,
    hospital: false,
    physical: false,
  });

  const allVerified = verifications.call && verifications.hospital && verifications.physical;

  // --------------------
  // Functions
  // --------------------
  const checkAdminStatus = async () => {
    if (!funding || !account) return;
    try {
      const adminMapping = await funding.admins(account);
      setIsAdmin(adminMapping);

      const ownerAddress = await funding.owner();
      setIsOwner(ownerAddress.toLowerCase() === account.toLowerCase());

      console.log("Admin:", adminMapping, "Owner:", isOwner);
    } catch (err) {
      console.error("Error checking admin status:", err);
    }
  };

  const onApprove = async (hospitalWallet, status) => {
    try {
      if (!funding || !account) {
        toast({
          title: "Error",
          description: "Wallet not connected or contract not loaded",
          variant: "destructive",
        });
        return;
      }
      setLoading(true);
      const tx = await hospital.verifyHospital(hospitalWallet, status);
      await tx.wait();
      toast({ title: "Success", description: `Hospital ${hospitalWallet} approved` });
      loadData();
    } catch (err) {
      toast({
        title: "Error",
        description: err.reason || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
        registeredAt: Number(h.registeredAt),
      }));
      setHospitalList(allHospitals.filter(h => !h.isVerified));

      // Requests
      const allRequestsRaw = await funding.getAllRequests();
      const allRequests = allRequestsRaw.map(req => {
        const [
          patient,
          name,
          description,
          createdAt,
          deadline,
          hospitalWallet,
          diseaseType,
          patientCallVerified,
          hospitalCrosscheckVerified,
          physicalVisitVerified,
          contactNumber,
          visible,
          active,
          isFunded,
          totalFunded,
          goalAmount,
          medicalRecords,
        ] = req;

        return {
          patient,
          name,
          description,
          createdAt: Number(createdAt),
          deadline: Number(deadline),
          hospitalWallet,
          diseaseType,
          patientCallVerified,
          hospitalCrosscheckVerified,
          physicalVisitVerified,
          contactNumber,
          visible,
          active,
          isFunded,
          totalFunded: totalFunded.toString(),
          goalAmount: goalAmount.toString(),
          medicalRecords,
        };
      });

      setPendingRequests(
        allRequests.filter(
          req =>
            !req.patientCallVerified ||
            !req.hospitalCrosscheckVerified ||
            !req.physicalVisitVerified
        )
      );
      setVerifiedRequests(
        allRequests.filter(
          req =>
            req.visible &&
            !req.isFunded &&
            req.patientCallVerified &&
            req.hospitalCrosscheckVerified &&
            req.physicalVisitVerified
        )
      );
      console.log("verifiedRequests", verifiedRequests);
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientRecords = async patientWallet => {
    try {
      const res = await storage.getFundingRecords(patientWallet);
      return Array.from(res).map(r => ({
        title: r[0],
        ipfsHash: r[1],
        description: r[2],
        timestamp: r[3]?.toString(),
        isValid: r[4],
        doctor: r[5],
      }));
    } catch (error) {
      console.error("Error fetching patient records:", error);
      return [];
    }
  };

  const handleFetchRecords = async patientWallet => {
    try {
      const fetchedRecords = await fetchPatientRecords(patientWallet);
      setRecordsMap(prev => ({
        ...prev,
        [patientWallet]: fetchedRecords || [],
      }));
    } catch (err) {
      console.error("Error fetching records:", err);
    }
  };
  // ✅ Verify Patient Call
const verifyPatientCall = async (patientWallet) => {
  if (!funding || !account) {
    toast({
      title: "Error",
      description: "Wallet not connected or contract not loaded",
      variant: "destructive",
    });
    return;
  }
  
  try {
    setLoading(true);
    const tx = await funding.verifyPatientCall(patientWallet);
    await tx.wait();
    toast({ title: "Success", description: `Patient call verified for ${patientWallet}` });
    loadData();
  } catch (err) {
    toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};

// ✅ Verify Hospital Crosscheck
const verifyHospitalCrosscheck = async (patientWallet) => {
  if (!funding || !account) {
    toast({
      title: "Error",
      description: "Wallet not connected or contract not loaded",
      variant: "destructive",
    });
    return;
  }

  try {
    setLoading(true);
    const tx = await funding.verifyHospitalCrosscheck(patientWallet);
    await tx.wait();
    toast({ title: "Success", description: `Hospital crosscheck verified for ${patientWallet}` });
    loadData();
  } catch (err) {
    toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};

// ✅ Verify Physical Visit
const verifyPhysicalVisit = async (patientWallet) => {
  if (!funding || !account) {
    toast({
      title: "Error",
      description: "Wallet not connected or contract not loaded",
      variant: "destructive",
    });
    return;
  }

  try {
    setLoading(true);
    const tx = await funding.verifyPhysicalVisit(patientWallet);
    await tx.wait();
    toast({ title: "Success", description: `Physical visit verified for ${patientWallet}` });
    loadData();
  } catch (err) {
    toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
  
   const releaseFundsToPatient = async (patientAddress) => {
  if (!funding || !account) {
    console.error("Wallet not connected or contract not loaded");
    return;
  }

  try {
    console.log(`Releasing funds for patient: ${patientAddress}`);

    // Call the contract function (admin only)
    const tx = await funding.releaseFunds(patientAddress);
    await tx.wait();

    alert("Funds released successfully!");
    console.log("Transaction hash:", tx);
  } catch (error) {
    console.error("Error releasing funds:", error);
    alert("Failed to release funds. Check console for details.");
  }
};

  // --------------------
  // Effects
  // --------------------
  useEffect(() => { checkAdminStatus(); }, [account, funding]);
  useEffect(() => { if (isAdmin) loadData(); }, [isAdmin]);
  useEffect(() => { console.log("Pending Requests updated:", pendingRequests); }, [pendingRequests]);

  // --------------------
  // Render
  // --------------------
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6 px-8 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6" /> Admin Dashboard
        </h1>
        <Button
          onClick={loadData}
          disabled={loading}
          variant="secondary"
          className="bg-white text-gray-800 hover:bg-gray-100"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />} Refresh
        </Button>
      </div>

      <div className="container mx-auto py-8 space-y-8">
        {/* Owner Section */}
        {isOwner && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl"><Users /> Add New Admin</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Admin wallet address"
                value={newAdmin}
                onChange={e => setNewAdmin(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={async () => {
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
                }}
                disabled={loading || !newAdmin.trim()}
              >
                Add Admin
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          {/* Tabs List */}
          <TabsList>
            <TabsTrigger value="pending">Pending Requests</TabsTrigger>
            <TabsTrigger value="verified">Verified Requests</TabsTrigger>
            <TabsTrigger value="hospitals">Hospital Verification</TabsTrigger>
          </TabsList>
                   {/* Pending Requests */}
<TabsContent value="pending" className="space-y-6">
  <div className="grid gap-6">
    {pendingRequests?.length > 0 ? (
      pendingRequests.map((req, index) => {
        const allVerified = req.patientCallVerified && req.hospitalCrosscheckVerified && req.physicalVisitVerified;

        return (
          <Card key={index} className="shadow-soft hover:shadow-hover transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="mb-2">{req.name} - Patient {req.patient}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                    <Badge variant="secondary">{req.goalAmount} ETH Goal</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Request Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Request Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Patient:</span>
                      <span className="font-medium">{req.patient}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Disease:</span>
                      <span className="font-medium">{req.diseaseType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contact:</span>
                      <span className="font-medium">{req.contactNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deadline:</span>
                      <span className="font-medium">{new Date(req.deadline * 1000).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">HospitalWallet:</span>
                      <span className="font-medium">{req.hospitalWallet}</span>
                    </div>
                  </div>
                </div>

                {/* Verification Progress */}
                 <div className="space-y-3">
  <h4 className="font-semibold text-sm">Verification Progress</h4>
  <div className="space-y-2">
    {/* Patient Call */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Phone className="h-4 w-4 text-primary" />
        Patient Call
      </div>
      <Button
        size="sm"
        disabled={req.patientCallVerified || loading}
        className="bg-primary hover:bg-primary/90"
        onClick={() => verifyPatientCall(req.patient)}
      >
        {req.patientCallVerified ? "Verified" : "Verify"}
      </Button>
    </div>

    {/* Hospital Crosscheck */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Building2 className="h-4 w-4 text-secondary" />
        Hospital Check
      </div>
      <Button
        size="sm"
        disabled={req.hospitalCrosscheckVerified || loading}
        className="bg-primary hover:bg-primary/90"
        onClick={() => verifyHospitalCrosscheck(req.patient)}
      >
        {req.hospitalCrosscheckVerified ? "Verified" : "Verify"}
      </Button>
    </div>

    {/* Physical Visit */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="h-4 w-4 text-accent" />
        Physical Visit
      </div>
      <Button
        size="sm"
        disabled={req.physicalVisitVerified || loading}
        className="bg-primary hover:bg-primary/90"
        onClick={() => verifyPhysicalVisit(req.patient)}
      >
        {req.physicalVisitVerified ? "Verified" : "Verify"}
      </Button>
    </div>
  </div>
</div>

              </div>

              {/* Patient Records */}
              <div className="border-t pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`wallet-search-${index}`} className="text-sm font-medium">
                    View Patient Records
                  </Label>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleFetchRecords(req.patient)}>
                      <FileText className="h-4 w-4 mr-2" />
                      Fetch
                    </Button>
                  </div>
                </div>

                {recordsMap[req.patient]?.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {recordsMap[req.patient].map((r, idx) => (
                      <a key={idx} href={`https://gateway.lighthouse.storage/ipfs/${r.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block">
                        {r.ipfsHash}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">View Details</Button>
                {allVerified && (
                  <Button className="flex-1 bg-success hover:bg-success/90"
        
                  >Release Funds</Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })
    ) : (
      <p className="text-center text-muted-foreground">No pending requests.</p>
    )}
  </div>
</TabsContent>

{/* Verified Requests */}
<TabsContent value="verified" className="space-y-6">
  <div className="grid gap-6">
    {verifiedRequests?.length > 0 ? (
      verifiedRequests.map((req, i) => (
        <Card key={i} className="shadow-soft hover:shadow-hover transition-shadow">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="mb-2">{req.name} - Patient {req.patient}</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="default" className="gap-1 bg-success">
                    <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
                  <Badge variant="secondary">{req.goalAmount} ETH Goal</Badge>
                  <Badge variant="outline">{req.totalFunded} ETH Raised</Badge>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Request Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Patient:</span>
                    <span className="font-medium">{req.patient}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disease:</span>
                    <span className="font-medium">{req.diseaseType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deadline:</span>
                    <span className="font-medium">{new Date(req.deadline * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Funding Progress</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{((Number(req.totalFunded)/Number(req.goalAmount))*100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-secondary/20 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${(Number(req.totalFunded)/Number(req.goalAmount))*100}%` }} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{req.totalFunded} ETH raised</span>
                    <span className="font-medium">{(Number(req.goalAmount) - Number(req.totalFunded)).toFixed(2)} ETH remaining</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">View Details</Button>
              <div className="flex gap-2">
                <Button className="bg-primary hover:bg-primary/90"
                 onClick={() =>  releaseFundsToPatient(req.patient)}
                >Donate</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))
    ) : (
      <p className="text-center text-muted-foreground">No verified requests.</p>
    )}
  </div>
</TabsContent>

{/* Hospital Verification */}
<TabsContent value="hospitals">
  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
    {hospitalList.length > 0 ? (
      hospitalList.map((hospital, i) => (
        <Card key={i} className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">{hospital.name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Location: {hospital.location}</p>
                  <p>Email: {hospital.email}</p>
                  <p>Phone: {hospital.contactNumber}</p>
                  <p className="font-mono text-xs">Wallet: {hospital.wallet}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://gateway.lighthouse.storage/ipfs/${hospital.documentCID}`, "_blank")}
                >
                  <Eye className="h-4 w-4 mr-2" /> View
                </Button>
                <Button size="sm" className="bg-success hover:bg-success/90" onClick={() => onApprove(hospital.wallet, true)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Verify
                </Button>
                <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => onApprove(hospital.wallet, false)}>
                  <CheckCircle2 className="h-4 w-4 mr-2" /> Reject
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))
    ) : (
      <p className="text-center text-muted-foreground col-span-full">No hospitals found.</p>
    )}
  </div>
</TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
