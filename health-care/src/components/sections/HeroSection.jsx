import React from "react";
import { ArrowRight } from "lucide-react";
import image from "/healthcare-removebg-preview.png"; // ✅ direct from public folder
import { Link } from "react-router-dom";
const HeroSection = () => {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center 
    bg-gradient-to-r from-blue-50 via-white to-green-50 px-6">
      
      {/* Full Page Rounded Box */}
      <div className="w-full max-w-7xl h-auto md:h-[90%] bg-white rounded-3xl shadow-2xl p-10 
      grid md:grid-cols-2 gap-10 items-center">
        
        {/* Left Side - Text */}
        <div className="text-center md:text-left space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-snug">
            Every Life Matters <br />
            <span className="text-blue-700">Get Support for Your Treatment 🩺</span>
          </h1>

          <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
            Start your medical fundraiser today and connect with people 
            willing to help. <br />
            <span className="font-medium text-blue-600">
              100% Secure • Transparent • Trusted
            </span>
          </p>
<div className="flex gap-x-4 ">
      <Link
  to="/requests"
  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 
  rounded-full font-semibold text-lg hover:bg-blue-700 transition"
>
  Start donation <ArrowRight size={22} />
</Link>
   <Link
  to="/create-request"
  className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 
  rounded-full font-semibold text-lg hover:bg-blue-700 transition"
>
  Create Fund Request <ArrowRight size={22} />
</Link>
</div>
        </div>

        {/* Right Side - Illustration */}
        <div className="flex justify-center md:justify-end relative">
          <img
            src={image}
            alt="Healthcare Illustration"
            className="w-[80%] md:w-[90%] h-auto object-contain mix-blend-multiply"
          />

          {/* Floating icons */}
          <span className="absolute top-10 right-16 text-blue-500 text-3xl md:text-4xl">✦</span>
          <span className="absolute bottom-14 left-10 text-green-500 text-3xl md:text-4xl">✚</span>
          <span className="absolute top-32 left-20 text-red-500 text-2xl md:text-3xl"></span>
          <span className="absolute bottom-20 right-20 text-pink-500 text-2xl md:text-3xl"></span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;