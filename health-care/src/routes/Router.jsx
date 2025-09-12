//import React from "react";
//import { BrowserRouter, Routes, Route } from "react-router-dom";
//const Router = () => {
   
   
//}

//export default Router;



import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// pages
import Dashboard from "../pages/Dashboard.jsx";
import LoginPage from "../login.jsx";
import Hospital from "../pages/Hospital.jsx";

// layout
import Navbar from "../components/layout/navbar.jsx";

const Router = () => {
  return (
    <BrowserRouter>
      {/* Navbar will always show */}
      <Navbar />

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hospitals" element={<Hospital />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
