import { useState } from "react";
import Button from "../components/ui/Button.jsx";
import { Card, CardHeader, CardContent, CardTitle } from "../components/ui/Card.jsx";
import Badge from "../components/ui/Badge.jsx";

import Progress from "../components/ui/Progress.jsx";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/Tabs.jsx";
import CreateRequest from "../components/component/CreateRequest.jsx";
// Icons using simple SVGs or react-icons (optional)
import { Plus, Heart, FileText, DollarSign, Users, Clock, Shield, CheckCircle, TrendingUp, Download, Upload, Eye } from "lucide-react";
import React from "react";
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock user data
  const userData = {
    name: "John Doe",
    userType: "Patient",
    walletConnected: true,
    walletAddress: "0x1234...5678"
  };

  // Mock campaign data
  const myCampaigns = [
    { id: 1, title: "Heart Surgery Recovery Fund", goal: 15000, raised: 12500, donors: 89, status: "Active", daysLeft: 12, verificationStatus: "Verified" },
    { id: 2, title: "Physical Therapy Sessions", goal: 8000, raised: 8000, donors: 45, status: "Completed", daysLeft: 0, verificationStatus: "Completed" }
  ];

  // Mock medical records
  const medicalRecords = [
    { id: 1, title: "Cardiac Consultation Report", date: "2024-01-15", type: "Consultation", doctor: "Dr. Smith", hospital: "City General Hospital", sharedForFunding: true, size: "2.4 MB" },
    { id: 2, title: "ECG Test Results", date: "2024-01-10", type: "Test Results", doctor: "Dr. Johnson", hospital: "City General Hospital", sharedForFunding: true, size: "1.2 MB" },
    { id: 3, title: "Blood Work Analysis", date: "2024-01-08", type: "Lab Results", doctor: "Dr. Wilson", hospital: "City General Hospital", sharedForFunding: false, size: "0.8 MB" }
  ];

  // Mock donations made
  const donationsMade = [
    { id: 1, campaignTitle: "Emergency Surgery for Maria", amount: 150, date: "2024-01-20", status: "Confirmed" },
    { id: 2, campaignTitle: "Cancer Treatment Support", amount: 75, date: "2024-01-18", status: "Confirmed" }
  ];

  const stats = [
    { title: "Total Raised", value: "$20,500", change: "+$2,500 this month", icon: DollarSign, color: "text-green-600" },
    { title: "Active Campaigns", value: "1", change: "1 pending approval", icon: Heart, color: "text-blue-600" },
    { title: "Medical Records", value: "3", change: "2 shared for funding", icon: FileText, color: "text-purple-600" },
    { title: "Total Donors", value: "134", change: "+12 this week", icon: Users, color: "text-yellow-600" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome back, {userData.name}</h1>
            <p className="opacity-90">Manage your healthcare funding campaigns and medical records</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary">
              <Shield className="h-3 w-3 mr-1" />
              {userData.userType}
            </Badge>
            {userData.walletConnected && (
              <Badge variant="secondary">
                <CheckCircle className="h-3 w-3 mr-1" />
                {userData.walletAddress}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 gap-2 mb-4">
            {["overview","campaigns","records","donations"].map(tab => (
              <TabsTrigger key={tab} value={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-center ${activeTab === tab ? "bg-white shadow font-semibold" : "bg-gray-100 hover:bg-gray-200"}`}>
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
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Plus className="h-6 w-6" /> Create New Campaign
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Upload className="h-6 w-6" /> Upload Medical Record
                </Button>
                <Button variant="outline" className="flex flex-col items-center gap-2 h-20">
                  <Heart className="h-6 w-6" /> Browse Campaigns
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Campaigns */}
          <TabsContent value="campaigns" activeTab={activeTab}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Campaigns</h2>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Plus className="h-4 w-4 mr-2" /> Create New Campaign
              </Button>
            </div>
            <div className="grid gap-6">
              {myCampaigns.map(campaign => (
                <Card key={campaign.id}>
                  <CardContent>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold">{campaign.title}</h3>
                          <Badge variant={campaign.status === "Active" ? "default" : "secondary"}>{campaign.status}</Badge>
                          <Badge variant="success" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" /> {campaign.verificationStatus}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>${campaign.raised.toLocaleString()} raised</span>
                            <span>of ${campaign.goal.toLocaleString()}</span>
                          </div>
                          <Progress value={(campaign.raised / campaign.goal) * 100} />
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-1"><Users className="h-4 w-4" /> {campaign.donors} donors</div>
                          <div className="flex items-center gap-1"><Clock className="h-4 w-4" /> {campaign.daysLeft > 0 ? `${campaign.daysLeft} days left` : "Completed"}</div>
                          <div className="flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {((campaign.raised / campaign.goal) * 100).toFixed(1)}% funded</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2" /> View</Button>
                        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Medical Records */}
          <TabsContent value="records" activeTab={activeTab}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Medical Records</h2>
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"><Upload className="h-4 w-4 mr-2" /> Upload New Record</Button>
            </div>
            <div className="grid gap-4">
              {medicalRecords.map(record => (
                <Card key={record.id}>
                  <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-gray-100"><FileText className="h-6 w-6 text-blue-600" /></div>
                      <div>
                        <h3 className="font-semibold">{record.title}</h3>
                        <p className="text-sm text-gray-500">{record.type} • {record.doctor} • {record.hospital}</p>
                        <p className="text-xs text-gray-500 mt-1">{record.date} • {record.size}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {record.sharedForFunding ? <Badge variant="success" className="flex items-center gap-1"><Heart className="h-3 w-3" /> Shared for Funding</Badge> : <Badge variant="outline">Private</Badge>}
                      <Button variant="outline" size="sm"><Eye className="h-4 w-4 mr-2" /> View</Button>
                      <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Download</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* My Donations */}
          <TabsContent value="donations" activeTab={activeTab}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Donations</h2>
              <div className="flex items-center gap-2 text-sm text-gray-500"><DollarSign className="h-4 w-4" /> Total donated: $225</div>
            </div>
            <div className="grid gap-4">
              {donationsMade.map(donation => (
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
                      <Badge variant="success" className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {donation.status}</Badge>
                      <Button variant="outline" size="sm">View Campaign</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
