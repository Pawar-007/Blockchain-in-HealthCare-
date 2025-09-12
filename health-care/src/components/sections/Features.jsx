import { Card, CardContent, CardHeader, CardTitle } from "./../ui/Card.jsx";
import Badge from "../ui/Badge.jsx";
import { 
  Shield, 
  Heart, 
  FileText, 
  Building2, 
  Users, 
  Lock,
  CheckCircle,
  Globe
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Heart,
      title: "Verified Funding Requests",
      description: "Multi-step verification process including admin calls, hospital verification, and physical visits ensures authentic medical needs.",
      badge: "Trust & Safety",
      color: "from-red-500 to-pink-500"
    },
    {
      icon: FileText,
      title: "Secure Medical Records",
      description: "Encrypted IPFS storage for medical documents with patient-controlled access permissions and guardian support.",
      badge: "Privacy First",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: Building2,
      title: "Hospital Integration",
      description: "Direct integration with verified hospitals for seamless verification workflow and fund disbursement.",
      badge: "Professional Network",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Blockchain Security",
      description: "Smart contract-based escrow system with transparent fund management and automatic refund protection.",
      badge: "Decentralized",
      color: "from-purple-500 to-violet-500"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Connect with donors worldwide through transparent, verifiable campaigns with real-time progress tracking.",
      badge: "Global Reach",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Lock,
      title: "Access Control",
      description: "Granular permission system for medical records with time-based access and easy revocation capabilities.",
      badge: "Patient Control",
      color: "from-teal-500 to-cyan-500"
    }
  ];

  const workflow = [
    {
      step: "1",
      title: "Create Request",
      description: "Patient submits funding request with medical documentation",
      icon: FileText
    },
    {
      step: "2", 
      title: "Verification",
      description: "Multi-step verification by admin and hospital staff",
      icon: CheckCircle
    },
    {
      step: "3",
      title: "Live Campaign",
      description: "Approved requests go live for public donations",
      icon: Globe
    },
    {
      step: "4",
      title: "Secure Disbursement", 
      description: "Funds transferred directly to verified hospital",
      icon: Shield
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-background to-muted/20">
      <div className="container">
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <Badge variant="outline" className="mb-4">Platform Features</Badge>
          <h2 className="text-3xl lg:text-5xl font-bold text-center">
             Everything You Need for{" "}
         <span className="bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent inline-block w-fit">
         Healthcare Funding
         </span>

</h2>


          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our comprehensive platform combines the power of blockchain technology with healthcare expertise 
            to create a trusted ecosystem for medical funding and record management.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 border-0 shadow-soft"
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${feature.color} shadow-md`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow Section */}
        <div className="space-y-12">
          <div className="text-center space-y-4">
            <Badge variant="outline">How It Works</Badge>
            <h3 className="text-2xl lg:text-4xl font-bold">
              Simple & Secure Process
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our streamlined verification and funding process ensures both patient needs are met 
              and donor trust is maintained through every step.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {workflow.map((step, index) => (
              <div key={index} className="relative text-center group">
                {/* Connector Line */}
                {index < workflow.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/20 -z-10" />
                )}
                
                <Card className="p-6 hover:shadow-medium transition-all duration-300">
                  <div className="space-y-4">
                    <div className="relative mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                      <step.icon className="h-8 w-8 text-white" />
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-background border-2 border-primary rounded-full flex items-center justify-center text-xs font-bold text-primary">
                        {step.step}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {step.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;