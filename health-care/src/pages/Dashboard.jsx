import React from "react";
import { useState,useEffect } from "react";
import Button from "../components/ui/Button.jsx";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";
import Progress from "../components/ui/Progress.jsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs.jsx";
import CreateRequest from "../components/component/CreateRequest.jsx";
import { UploadRecordDialog } from "../components/component/uploadRecord.jsx"; // ✅ import dialog
import {useContracts} from "../context/ContractContext.jsx"
import { Link } from "react-router-dom";
import { useToast } from "../components/ui/use-toast.jsx";
import { useMedicalRecords } from "../context/MedicalRecordContext.jsx";
import {
  Plus, Heart, FileText, DollarSign, Users, Clock,
  Shield, CheckCircle, TrendingUp, Download, Upload, Eye
} from "lucide-react";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const {account, connectWallet,disconnectWallet,storage} = useContracts();
  const { medicalRecords, loading, fetchRecords } = useMedicalRecords();
  const [loadingRecords, setLoadingRecords] = useState(false);
  const { toast } = useToast();

  const handleConnectWallet = async () => {
    console.log("Connecting wallet...",account);
    await connectWallet();
  }
  console.log("Records:",medicalRecords);
  

  const myCampaigns = [
    { id: 1, title: "Heart Surgery Recovery Fund", goal: 15000, raised: 12500, donors: 89, status: "Active", daysLeft: 12, verificationStatus: "Verified" },
    { id: 2, title: "Physical Therapy Sessions", goal: 8000, raised: 8000, donors: 45, status: "Completed", daysLeft: 0, verificationStatus: "Completed" }
  ];

  // Add record after successful upload
      const handleRecordUpload = () => {
      fetchRecords(); // refresh records from blockchain after upload
    };
    
    

  // Donations
  const donationsMade = [];

  const stats = [
    { title: "Total Raised", value: "$20,500", change: "+$2,500 this month", icon: DollarSign, color: "text-green-600" },
    { title: "Active Campaigns", value: "1", change: "1 pending approval", icon: Heart, color: "text-blue-600" },
    { title: "Medical Records", value: medicalRecords?.length.toString(), change: "2 shared for funding", icon: FileText, color: "text-purple-600" },
    { title: "Total Donors", value: "134", change: "+12 this week", icon: Users, color: "text-yellow-600" }
  ];

  return (
    account!=null?(<div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {}</h1>
            <p className="opacity-90">Manage your healthcare funding campaigns and medical records</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />{}</Badge>
            {account && (
              <Badge variant="secondary"><CheckCircle className="h-3 w-3 mr-1" />{`${account?.slice(0,6)}...${account.slice(-4)}`}</Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 gap-2 mb-4">
            {["overview","campaigns","records","donations"].map(tab => (
              <TabsTrigger
                key={tab}
                value={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-center ${activeTab === tab ? "bg-white shadow font-semibold" : "bg-gray-100 hover:bg-gray-200"}`}
              >
                {tab === "overview" ? "Overview" : tab === "campaigns" ? "My Campaigns" : tab === "records" ? "Medical Records" : "My Donations"}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" activeTab={activeTab}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {stats.map((stat, idx) => (
                <Card key={idx}>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">{stat.title}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <p className={`text-xs ${stat.color}`}>{stat.change}</p>
                      </div>
                      <stat.icon className={`h-8 w-8 ${stat.color}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="mb-6">
              <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Plus className="h-6 w-6" /> Create New Campaign
                </Button>

                {/*  Upload Record Dialog Trigger */}
                <UploadRecordDialog onUploadSuccess={handleRecordUpload} />

                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Heart className="h-6 w-6" /> Browse Campaigns
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Records */}
          <TabsContent value="records" activeTab={activeTab}>
  <div className="flex justify-between items-center mb-4">
    <h2 className="text-2xl font-bold">Medical Records</h2>
    <UploadRecordDialog onUploadSuccess={handleRecordUpload} />
  </div>

  {(!medicalRecords || medicalRecords.length === 0) ? (
    <Card className="p-6 text-center">
      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <h3 className="text-lg font-semibold">No medical records uploaded yet</h3>
      <p className="text-sm text-gray-500 mb-4">Upload your first medical record to get started.</p>
      <UploadRecordDialog onUploadSuccess={handleRecordUpload} />
    </Card>
  ) : (
    <div className="grid gap-4">
      {medicalRecords.map(record => (
        <Card key={record.id}>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-gray-100">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">{record.title}</h3>
                <p className="text-sm text-gray-500">{record.metadata}</p>
                <p className="text-sm text-gray-500">Doctor: {record.doctor}</p>
                <p className="text-xs text-gray-500 mt-1">{record.date} • {record.size}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {record.sharedForFunding
                ? <Badge variant="success" className="flex items-center gap-1"><Heart className="h-3 w-3" /> Shared for Funding</Badge>
                : <Badge variant="outline">Private</Badge>}

              {/* ✅ View Button Functionality */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://gateway.lighthouse.storage/ipfs/${record.ipfsHash}`, "_blank")}
              >
                <Eye className="h-4 w-4 mr-2" /> View
              </Button>

              {/* ✅ Download */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = `https://gateway.lighthouse.storage/ipfs/${record.ipfsHash}`;
                  link.download = record.title;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
              >
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )}
</TabsContent>



                    {/* Donations */}
                    <TabsContent value="donations" activeTab={activeTab}>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4 gap-2">
              <h2 className="text-2xl font-bold">My Donations</h2>
              {(!donationsMade || donationsMade.length === 0) ? (
                <Link to="/hospitals">
                <Button className="self-start md:self-auto">Start Donating</Button>
                </Link>
               
              ) : (
                <div className="flex items-center justify-between w-full md:w-auto">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <DollarSign className="h-4 w-4" /> Total donated: $
                    {donationsMade.reduce((sum, d) => sum + d.amount, 0)}
                  </div>
                  <Button className="ml-auto md:ml-4">Donate More</Button> {/* ⬅️ shifted to right */}
                </div>
              )}
            </div>

            {(!donationsMade || donationsMade.length === 0) ? (
              <Card className="p-6 text-center">
                <Heart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <h3 className="text-lg font-semibold">No donations yet</h3>
                <p className="text-sm text-gray-500">Start donating to make an impact in someone’s life.</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {donationsMade?.map(donation => (
                  <Card key={donation.id}>
                    <CardContent className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-green-100"><Heart className="h-6 w-6 text-green-600" /></div>
                        <div>
                          <h3 className="font-semibold">{donation.campaignTitle}</h3>
                          <p className="text-sm text-gray-500">Donated ${donation.amount} on {donation.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> {donation.status}
                        </Badge>
                        <Button variant="outline" size="sm">View Campaign</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>):(
       <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex items-center justify-center">
  <Card className="w-full max-w-md">
    <CardHeader className="text-center">
      <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
      <CardTitle className="text-2xl">Access Denied</CardTitle>
      <p className="text-muted-foreground">Connect your wallet to access the platform</p>
    </CardHeader>
    <CardContent>
      <Button className="w-full"
      onClick={handleConnectWallet}
      >Connect Wallet</Button>
    </CardContent>
  </Card>
</div>

    )
  );
};

export default Dashboard;
