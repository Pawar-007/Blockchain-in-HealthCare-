const Badge = ({ children, variant = "default", className = "" }) => {
  const variants = {
    default: "bg-gray-200 text-gray-800",
    secondary: "bg-blue-200 text-blue-800",
    success: "bg-green-200 text-green-800",
    warning: "bg-yellow-200 text-yellow-800"
  };
  return <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>;
};

export default Badge;
