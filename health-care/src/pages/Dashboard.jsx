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
  const {account,funding, connectWallet,disconnectWallet,storage} = useContracts();
  const { medicalRecords, loading, fetchRecords } = useMedicalRecords();
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const { toast } = useToast();
  const [fundingRecords, setFundingRecords] = useState([]);
  const [donationsMades, setDonationsMade] = useState([]);
const [donationsReceived, setDonationsReceived] = useState([]);

  const handleConnectWallet = async () => {
    console.log("Connecting wallet...",account);
    await connectWallet();
  }

  // Add record after successful upload
  const handleRecordUpload = async () => {
    await fetchRecords();
  toast({ title: "Records updated!" });
};

    const loadMyCampaigns = async () => {
  if (!funding || !account) return;

  try {
    const allRequests = await funding.getAllRequests(); // fetch all campaigns
    // Filter campaigns belonging to the user
    const myRequests = allRequests
      .map((r) => ({
        patient: r.patient,
        name: r.name,
        description: r.description,
        createdAt: Number(r.createdAt),
        deadline: Number(r.deadline),
        hospitalWallet: r.hospitalWallet,
        diseaseType: r.diseaseType,
        patientCallVerified: r.patientCallVerified,
        hospitalCrosscheckVerified: r.hospitalCrosscheckVerified,
        physicalVisitVerified: r.physicalVisitVerified,
        contactNumber: r.contactNumber,
        visible: r.visible,
        active: r.active,
        isFunded: r.isFunded,
        totalFunded: r.totalFunded.toString(),
        goalAmount: r.goalAmount.toString(),
        medicalRecords: r.medicalRecords.map((cid) => cid.toString()),
      }))
      .filter((req) => req.patient.toLowerCase() === account.toLowerCase());

    // Sort: Active first, then funded, then rejected
    myRequests.sort((a, b) => {
      if (a.active && !b.active) return -1;
      if (!a.active && b.active) return 1;
      if (a.isFunded && !b.isFunded) return -1;
      if (!a.isFunded && b.isFunded) return 1;
      return 0;
    });
    const rawRecords = await storage.getFundingRecords(account);

// If rawRecords is a Proxy(_Result), convert each record to plain object
const records = rawRecords.map((r) => {
  return {
    title: r[0],       // 'mri scan'
    ipfsHash: r[1],    // 'bafkreiaf4exucutggeimn42ekxclr3juhfnmlpmoa527x554xklclan36y'
    description: r[2], // 'this is my record'
    timestamp: Number(r[3]), // convert BigInt to Number
    sharedForFunding: r[4],  // true/false
    doctor: r[5]
  };
});

  setFundingRecords(records);

    setMyCampaigns(myRequests);
    console.log("Loaded my campaigns:", myRequests);
  } catch (error) {
    console.log("Error fetching campaigns:", error);
  }
};

    const accessToRecords = async (address)=>{
      if(!storage || !account) return;
      try {
        const tx = await storage.grantAccess(address);
        tx.wait();
        toast({title:"Access granted!"})
      } catch (error) {
        console.log("Error granting access:", error);
      }
    }

    const loadMyDonations = async () => {
  if (!funding || !account) return;

  try {
    const txs = await funding.getTransactionsByDonor(account);

    const formatted = txs.map(tx => ({
      id: tx[0].toString(),           // Transaction ID
      donor: tx[1],                   // Donor address
      receiver: tx[2],                // Receiver/patient address
      amount: Number(tx[3]),          // Amount donated
      date: new Date(Number(tx[4]) * 1000).toLocaleDateString() // Convert timestamp
    }));

    console.log("Loaded my donations:", formatted);
    setDonationsMade(formatted);
  } catch (err) {
    console.error("Error fetching donations made:", err);
  }
};

   const loadDonationsReceived = async () => {
  if (!funding || !account) return;

  try {
    const donations = await funding.getDonation(account); // your contract function
    const formatted = donations.map(d => ({
      id: d[0].toString(),
      donor: d.donor,
      amount: Number(d[1]),
      date: new Date().toLocaleDateString(),
    }));
    setDonationsReceived(formatted);
    console.log("Loaded donations received:", formatted);
  } catch (err) {
    console.error("Error fetching donations received:", err);
  }
};


    useEffect(()=>{
      loadMyCampaigns();
      loadMyDonations();
    loadDonationsReceived();
    },[storage,account]);

  // Donations
  const donationsMade = [];

  const stats = [
  {
    title: "Total Raised",
    value: "$" + myCampaigns?.reduce((sum, c) => sum + Number(c.totalFunded), 0),
    change: "+$2,500 this month",
    icon: DollarSign,
    color: "text-green-600"
  },
  {
    title: "Active Campaigns",
    value: myCampaigns?.filter(c => c.active).length.toString(),
    change: `${myCampaigns?.filter(c => c.active).length} pending approval`,
    icon: Heart,
    color: "text-blue-600"
  },
  {
    title: "Medical Records",
    value: medicalRecords?.length.toString(),
    change: "2 shared for funding",
    icon: FileText,
    color: "text-purple-600"
  },
  {
    title: "Total Donated",
    value: donationsMade?.reduce((sum, d) => sum + d.amount, 0), // ✅ total donated
    change: `${donationsMade.length} donations made`,
    icon: Users,
    color: "text-yellow-600"
  }
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
                  <Link to="/create-request" className="flex flex-col items-center gap-2 h-20">
                  <Plus className="h-6 w-6" /> Create New Campaign
                  </Link>
                </Button>
                

                {/*  Upload Record Dialog Trigger */}
                <UploadRecordDialog onUploadSuccess={handleRecordUpload} />

                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Heart className="h-6 w-6" /> Browse Campaigns
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
         {/* My Campaigns */}
          {/* --- My Campaigns Tab (updated) --- */}
<TabsContent value="campaigns" className="space-y-6">
  <div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold">My Campaigns</h2>
    <Link to="/create-request">
      <Button className="bg-gradient-to-r from-primary to-secondary text-white flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create New Campaign
      </Button>
    </Link>
  </div>

  {myCampaigns.length === 0 ? (
    <Card className="p-6 text-center">
      <Heart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <h3 className="text-lg font-semibold">No campaigns created yet</h3>
      <p className="text-sm text-gray-500 mb-4">Create a new campaign to get started.</p>
      <Link to="/create-request">
        <Button>Create Campaign</Button>
      </Link>
    </Card>
  ) : (
    <div className="grid gap-6">
      {myCampaigns
        .sort((a, b) => {
          const getPriority = (c) => (c.active ? 0 : c.isFunded ? 1 : 2);
          return getPriority(a) - getPriority(b);
        })
        .map((campaign, idx) => {
          const raised = Number(campaign.totalFunded);
          const goal = Number(campaign.goalAmount);
          const daysLeft = Math.max(0, Math.ceil((campaign.deadline - Date.now() / 1000) / 86400));
          const status = campaign.isFunded ? "Funded" : campaign.active ? "Active" : "Rejected";
          const verificationStatus =
            campaign.patientCallVerified && campaign.hospitalCrosscheckVerified && campaign.physicalVisitVerified
              ? "Verified"
              : "Pending";

          return (
            <Card key={idx} className="hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="text-xl font-semibold">{campaign.name}</h3>
                      <Badge variant={status === "Active" ? "default" : status === "Funded" ? "success" : "destructive"}>
                        {status}
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {verificationStatus}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>${raised.toLocaleString()} raised</span>
                        <span>of ${goal.toLocaleString()}</span>
                      </div>
                      <Progress value={(raised / goal) * 100} className="h-2 rounded-full" />
                    </div>

                    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {campaign.donors || 0} donors</div>
                      <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {daysLeft > 0 ? `${daysLeft} days left` : "Completed"}</div>
                      <div className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {((raised / goal) * 100).toFixed(1)}% funded</div>
                      <div className="flex items-center gap-1"><FileText className="h-4 w-4" /> {fundingRecords?.length || 0} records</div>
                      <div className="flex items-center gap-1"><Shield className="h-4 w-4" /> {campaign.visible ? "Visible" : "Hidden"}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    {/* Toggle overall campaign visibility */}
                    <Button
                      size="sm"
                      variant={campaign.visible ? "destructive" : "outline"}
                      onClick={async () => {
                        try {
                          await storage.setVisibility(campaign.patient, !campaign.visible);
                          await loadMyCampaigns();
                          toast({ title: `Visibility updated to ${!campaign.visible ? "Hidden" : "Visible"}` });
                        } catch (err) {
                          toast({ title: "Error updating visibility", variant: "destructive" });
                        }
                      }}
                    >
                      {campaign.visible ? "Hide Records" : "Make Records Visible"}
                    </Button>

                    {/* Mark individual record for funding */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const recordId = parseInt(prompt("Enter record ID to mark/unmark for funding:"));
                        if (!isNaN(recordId)) {
                          const status = confirm("Mark for funding? OK = yes, Cancel = no");
                          try {
                            await funding.markRecordForFunding(recordId, status);
                            await loadMyCampaigns();
                            toast({ title: `Record ${recordId} updated for funding: ${status}` });
                          } catch (err) {
                            toast({ title: "Error updating record", variant: "destructive" });
                          }
                        }
                      }}
                    >
                      Mark Record for Funding
                    </Button>

                    {/* Grant/revoke visibility per address */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={()=>{accessToRecords(prompt("Enter address to grant access:"))}}
                    >
                      Who Can See
                    </Button>

                    <div className="flex gap-2 mt-2">
                      <Button variant="outline" size="sm" onClick={() => console.log("View", campaign)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => console.log("Export", campaign)}>
                        <Download className="h-4 w-4 mr-1" /> Export
                      </Button>
                    </div>
                  </div>
                </div> 
              </CardContent>
            </Card>
          );
        })}
    </div>
  )}
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
      {medicalRecords?.map(record => (
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
    {donationsMades.length === 0 ? (
      <Link to="/hospitals">
        <Button className="self-start md:self-auto">Start Donating</Button>
      </Link>
    ) : (
      <div className="flex items-center justify-between w-full md:w-auto">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <DollarSign className="h-4 w-4" /> Total donated: $
          {donationsMades.reduce((sum, d) => sum + d.amount, 0)}
        </div>
        <Button className="ml-auto md:ml-4">Donate More</Button>
      </div>
    )}
  </div>

  {donationsMades.length === 0 ? (
    <Card className="p-6 text-center">
      <Heart className="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <h3 className="text-lg font-semibold">No donations yet</h3>
      <p className="text-sm text-gray-500">Start donating to make an impact in someone’s life.</p>
    </Card>
  ) : (
    <div className="grid gap-4">
      {donationsMades.map(donation => (
        <Card key={donation.id}>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-100">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">To: {donation.receiver}</h3>
                <p className="text-sm text-gray-500">Donor: {donation.donor}</p>
                <p className="text-sm text-gray-500">Amount: ${donation.amount}</p>
                <p className="text-sm text-gray-500">Date: {donation.date}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Donated
              </Badge>
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
