import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useContracts } from "../context/ContractContext";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/card.jsx";
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

    // Check if the connected account is an admin
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

    // Load all data from contracts
    const loadData = async () => {
        if (!funding || !hospital) return;
        setLoading(true);
        try {
            // Fetch and filter hospitals
            const allHospitals = await hospital.getAllHospitals();
            const unverifiedHospitals = allHospitals.filter(h => !h.isVerified);
            setHospitalList(unverifiedHospitals);

            // Fetch and filter requests
            const allRequests = await funding.getAllRequests();
            const pending = [];
            const verified = [];

            allRequests.forEach((req) => {
                if (!req.patientCallVerified || !req.hospitalCrosscheckVerified || !req.physicalVisitVerified) {
                    pending.push(req);
                } else if (req.visible && !req.isFunded) {
                    verified.push(req);
                }
            });
            setPendingRequests(pending);
            setVerifiedRequests(verified);

        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to fetch data. Please try again.",
                variant: "destructive",
            });
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Trigger checks on account/contract change
    useEffect(() => {
        checkAdminStatus();
    }, [account, funding, hospital]);

    // Trigger data load when admin status is confirmed
    useEffect(() => {
        if (isAdmin) loadData();
    }, [isAdmin]);

    // Add new admin (only callable by owner)
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
            checkAdminStatus(); // Re-check admin status to update UI
        } catch (err) {
            toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Verify hospital
    const handleVerifyHospital = async (addr) => {
        try {
            setLoading(true);
            const tx = await hospital.verifyHospital(addr, true);
            await tx.wait();
            toast({ title: "Success", description: "Hospital verified" });
            loadData();
        } catch (err) {
            toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Verify a single step of a request
    const handleVerifyRequestStep = async (req, step) => {
        try {
            setLoading(true);
            let tx;
            switch (step) {
                case "patientCall":
                    tx = await funding.verifyPatientCall(req.patient);
                    break;
                case "hospitalCrosscheck":
                    tx = await funding.verifyHospitalCrosscheck(req.patient);
                    break;
                case "physicalVisit":
                    tx = await funding.verifyPhysicalVisit(req.patient);
                    break;
                default:
                    break;
            }
            if (tx) {
                await tx.wait();
                toast({ title: "Success", description: `${step} verified` });
                loadData();
            }
        } catch (err) {
            toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Release funds to hospital
    const handleReleaseFunds = async (req) => {
        try {
            setLoading(true);
            const tx = await funding.releaseFunds(req.patient);
            await tx.wait();
            toast({ title: "Success", description: "Funds released to hospital" });
            loadData();
        } catch (err) {
            toast({ title: "Error", description: err.reason || err.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    // Conditional rendering for access control
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
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-6 px-8 flex justify-between items-center shadow-md">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-6 h-6" /> Admin Dashboard
                </h1>
                <Button onClick={loadData} disabled={loading} variant="secondary" className="bg-white text-gray-800 hover:bg-gray-100">
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />} Refresh
                </Button>
            </div>

            <div className="container mx-auto py-8 space-y-8">
                {/* Add New Admin Card (Only for Owner) */}
                {isOwner && (
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-xl"><Users />Add New Admin</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col md:flex-row gap-4">
                            <Input
                                placeholder="Admin wallet address"
                                value={newAdmin}
                                onChange={(e) => setNewAdmin(e.target.value)}
                                className="flex-1"
                            />
                            <Button onClick={handleAddAdmin} disabled={loading || !newAdmin.trim()}>Add Admin</Button>
                        </CardContent>
                    </Card>
                )}

                <Tabs defaultValue="hospitals">
                    <TabsList className="grid w-full grid-cols-3 bg-gray-200">
                        <TabsTrigger value="hospitals" className="flex items-center gap-2"><Building2 />Hospitals</TabsTrigger>
                        <TabsTrigger value="pending" className="flex items-center gap-2"><Clock />Pending Requests</TabsTrigger>
                        <TabsTrigger value="verified" className="flex items-center gap-2"><FileText />Verified Requests</TabsTrigger>
                    </TabsList>

                    {/* Hospitals Tab */}
                    <TabsContent value="hospitals" className="mt-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hospitalList.length > 0 ? (
                                hospitalList.map((h, i) => (
                                    <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 space-y-2">
                                            <p className="text-lg font-semibold">{h.name}</p>
                                            <p><b className="text-gray-600">Location:</b> {h.location}</p>
                                            <p><b className="text-gray-600">Email:</b> {h.email}</p>
                                            <p className="break-all"><b className="text-gray-600">Wallet:</b> {h.wallet}</p>
                                            {isOwner && (
                                                <Button onClick={() => handleVerifyHospital(h.wallet)} disabled={loading} className="mt-4 w-full">
                                                    Verify Hospital
                                                </Button>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="col-span-3 text-center text-gray-500">No unverified hospitals found.</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Pending Requests Tab */}
                    <TabsContent value="pending" className="mt-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {pendingRequests.length > 0 ? (
                                pendingRequests.map((req, i) => (
                                    <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 space-y-2">
                                            <p className="text-lg font-semibold">Request for: <span className="break-all">{req.name}</span></p>
                                            <p><b className="text-gray-600">Patient:</b> <span className="break-all">{req.patient}</span></p>
                                            <p><b className="text-gray-600">Hospital:</b> <span className="break-all">{req.hospitalWallet}</span></p>
                                            <p><b className="text-gray-600">Amount:</b> {ethers.formatEther(req.goalAmount)} ETH</p>
                                            <p><b className="text-gray-600">Donations:</b> {ethers.formatEther(req.totalFunded)} ETH</p>
                                            <div className="flex flex-col space-y-2 mt-4">
                                                {!req.patientCallVerified && (
                                                    <Button onClick={() => handleVerifyRequestStep(req, "patientCall")} disabled={loading} className="w-full">
                                                        Verify Patient Call
                                                    </Button>
                                                )}
                                                {!req.hospitalCrosscheckVerified && (
                                                    <Button onClick={() => handleVerifyRequestStep(req, "hospitalCrosscheck")} disabled={loading} className="w-full">
                                                        Verify Hospital Crosscheck
                                                    </Button>
                                                )}
                                                {!req.physicalVisitVerified && (
                                                    <Button onClick={() => handleVerifyRequestStep(req, "physicalVisit")} disabled={loading} className="w-full">
                                                        Verify Physical Visit
                                                    </Button>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="col-span-3 text-center text-gray-500">No pending requests.</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Verified Requests Tab */}
                    <TabsContent value="verified" className="mt-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {verifiedRequests.length > 0 ? (
                                verifiedRequests.map((req, i) => (
                                    <Card key={i} className="shadow-sm hover:shadow-md transition-shadow">
                                        <CardContent className="p-4 space-y-2">
                                            <p className="text-lg font-semibold">Request for: <span className="break-all">{req.name}</span></p>
                                            <p><b className="text-gray-600">Patient:</b> <span className="break-all">{req.patient}</span></p>
                                            <p><b className="text-gray-600">Hospital:</b> <span className="break-all">{req.hospitalWallet}</span></p>
                                            <p><b className="text-gray-600">Amount:</b> {ethers.formatEther(req.goalAmount)} ETH</p>
                                            <p><b className="text-gray-600">Donations:</b> {ethers.formatEther(req.totalFunded)} ETH</p>
                                            <Button onClick={() => handleReleaseFunds(req)} disabled={loading} className="mt-4 w-full">
                                                Release Funds
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))
                            ) : (
                                <p className="col-span-3 text-center text-gray-500">No verified requests pending funds release.</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminPage;