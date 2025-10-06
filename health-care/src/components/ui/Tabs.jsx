// import { useState } from "react";

// export const Tabs = ({ value, onValueChange, children, className = "" }) => {
//   return <div className={className}>{children}</div>;
// };

// export const TabsList = ({ children, className = "" }) => {
//   return <div className={`flex space-x-2 ${className}`}>{children}</div>;
// };

// export const TabsTrigger = ({ value, children, onClick, className = "" }) => {
//   return (
//     <button
//       onClick={onClick}
//       className={`px-4 py-2 font-medium rounded-lg bg-gray-100 hover:bg-gray-200 ${className}`}
//     >
//       {children}
//     </button>
//   );
// };

// export const TabsContent = ({ value, activeTab, children, className = "" }) => {
//   return <div className={`${activeTab === value ? "block" : "hidden"} ${className}`}>{children}</div>;
// };
import { createContext, useContext, useState } from "react";

const TabsContext = createContext();

export const Tabs = ({ defaultValue, value, onValueChange, children, className = "" }) => {
  const [activeTab, setActiveTab] = useState(defaultValue || value);

  const handleChange = (val) => {
    setActiveTab(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <TabsContext.Provider value={{ activeTab, onChange: handleChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = "" }) => (
  <div className={`flex space-x-2 ${className}`}>{children}</div>
);

export const TabsTrigger = ({ value, children, className = "" }) => {
  const { activeTab, onChange } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => onChange(value)}
      className={`px-4 py-2 font-medium rounded-lg transition-colors ${
        isActive
          ? "bg-blue-600 text-white"
          : "bg-gray-100 hover:bg-gray-200"
      } ${className}`}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, className = "" }) => {
  const { activeTab } = useContext(TabsContext);
  return (
    <div className={`${activeTab === value ? "block" : "hidden"} ${className}`}>
      {children}
    </div>
  );
};
