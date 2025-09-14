import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "../components/layout/navbar.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Hospital from "../pages/Hospital.jsx";
import Index from "../pages/Index.jsx";
const Router = () => {
  return (   // ✅ you forgot this "return"
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hospitals" element={<Hospital />} />
        
       
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
