import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "../components/layout/navbar.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Hospital from "../pages/Hospital.jsx";
import Index from "../pages/Index.jsx";
import Requests from "../pages/BrouseRequest.jsx";
import AdminPage from "../pages/Admin.jsx";
const Router = () => {
  return (  
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/hospitals" element={<Hospital />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
