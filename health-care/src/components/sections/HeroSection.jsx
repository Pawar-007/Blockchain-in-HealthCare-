import React from "react";

const HeroSection = () => {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-300/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
          Everything You Need for{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Healthcare Funding
          </span>
        </h1>
        <p className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-300">
          A decentralized and transparent way to request, donate, and manage
          healthcare funds—ensuring trust, security, and accessibility for
          everyone.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
