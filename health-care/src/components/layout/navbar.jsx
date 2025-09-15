import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { React } from "react";
import {
  Heart,
  Users,
  Building2,
  Settings,
  Menu,
  X,
  Wallet,
  Shield,
} from "lucide-react";
import {useContracts} from "../../context/ContractContext.jsx";
import { useMedicalRecords } from "../../context/MedicalRecordContext.jsx";
const navItems = [
  { name: "Browse Requests", href: "/requests", icon: Users },
  { name: "Medical Records", href: "/records", icon: Heart },
  { name: "For Hospitals", href: "/hospitals", icon: Building2 },
  { name: "Dashboard", href: "/dashboard", icon: Shield },
  { name: "Admin", href: "/admin", icon: Settings },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const {account, connectWallet,disconnectWallet,storage} = useContracts();
  const {setMedicalRecords} = useMedicalRecords();
   const handleConnectWallet = async () => {
    try {
      console.log("Connecting wallet...");
      await connectWallet();
      
    } catch (err) {
      console.error("Wallet connect or register failed:", err);
    }
  };

  const handleDisconnectWallet =async () => {
    console.log("Disconnecting wallet...");
    await disconnectWallet();
    setMedicalRecords([]);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 w-full bg-white/95 backdrop-blur-md border-b border-gray-200 z-50"
      >
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-9 h-9 bg-gradient-to-r from-teal-500 to-green-500 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-teal-500 to-green-500 bg-clip-text text-transparent">
                HealthFund
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative flex items-center space-x-2 px-2 py-2 rounded-md transition-colors ${
                      isActive
                        ? "text-teal-600 font-medium"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                  >
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-teal-100 rounded-md -z-10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Side Buttons */}
            {
              account!=null ? (
             <div className="flex items-center space-x-4">
            {/* Show connected wallet */}
              <span className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-100">
                 {account?.slice(0, 6)}...{account?.slice(-4)}
                 </span>
                 {/* Logout button */}
                <button
                  onClick={handleDisconnectWallet}
                  className="px-3 py-2 border border-red-500 text-red-500 rounded-md hover:bg-red-50 transition"
                >
                  Logout
                </button>
    </div>
              ):(
                <div className="hidden md:flex items-center space-x-4">
              <button className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition"
                onClick={handleConnectWallet}
              >
                <Wallet className="w-4 h-4 mr-2" />
                 Connect Wallet
              </button>
              
            </div>
              )
            }

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-100 transition"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200"
            >
              <div className="py-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block px-4 py-3 rounded-md ${
                        isActive
                          ? "bg-teal-100 text-teal-600 font-medium"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
                <div className="px-4 pt-4 flex flex-col gap-2">
                  <button className="flex items-center w-full px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 transition">
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet
                  </button>
                  <Link
                    to="/get-started"
                    className="block w-full text-center px-3 py-2 text-white rounded-md text-sm font-medium bg-gradient-to-r from-teal-500 to-green-500 hover:opacity-90 transition"
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.nav>

      {/* Spacer so content doesn’t hide behind navbar */}
      <div className="h-16"></div>
    </>
  );
}