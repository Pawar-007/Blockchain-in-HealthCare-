import { useState } from "react";

export const Tabs = ({ value, onValueChange, children, className = "" }) => {
  return <div className={className}>{children}</div>;
};

export const TabsList = ({ children, className = "" }) => {
  return <div className={`flex space-x-2 ${className}`}>{children}</div>;
};

export const TabsTrigger = ({ value, children, onClick, className = "" }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 font-medium rounded-lg bg-gray-100 hover:bg-gray-200 ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, activeTab, children, className = "" }) => {
  return <div className={`${activeTab === value ? "block" : "hidden"} ${className}`}>{children}</div>;
};
