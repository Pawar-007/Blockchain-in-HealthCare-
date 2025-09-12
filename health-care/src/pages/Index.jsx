import React from "react";
import FeaturesSection from "../components/sections/Features.jsx"
import Navbar from "../components/layout/navbar.jsx";
import HeroSection from "../components/sections/HeroSection.jsx";
const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar/>
      <main>
         <HeroSection />
        <FeaturesSection />
      </main>
    </div>
  );
};

export default Index;
