export const Card = ({ children, className = "" }) => {
  return <div className={`bg-white shadow rounded-lg ${className}`}>{children}</div>;
};

export const CardHeader = ({ children, className = "" }) => {
  return <div className={`px-6 py-4 border-b ${className}`}>{children}</div>;
};

export const CardTitle = ({ children }) => {
  return <h3 className="text-lg font-semibold">{children}</h3>;
};

export const CardContent = ({ children, className = "" }) => {
  return <div className={`p-6 ${className}`}>{children}</div>;
};
