import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./App.css";

// Pages
import Dashboard from "./pages/Dashboard.jsx";
import LoginPage from "./login.jsx";
import Hospital from "./pages/Hospital.jsx";

// Navbar
import Navbar from "./components/layout/navbar.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <BrowserRouter>
      {/* Navbar always visible */}
      <Navbar />

      {/* Page Routes */}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/hospitals" element={<Hospital />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
