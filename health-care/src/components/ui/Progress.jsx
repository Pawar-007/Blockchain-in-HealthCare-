const Progress = ({ value = 0, className = "" }) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${value}%` }}></div>
    </div>
  );
};

export default Progress;
