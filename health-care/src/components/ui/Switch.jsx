import React, { useState, forwardRef } from "react";

const Switch = forwardRef(({ className = "", checked: controlledChecked, ...props }, ref) => {
  const [checked, setChecked] = useState(controlledChecked || false);

  const toggle = () => {
    setChecked(!checked);
  };

  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={toggle}
      ref={ref}
      className={`relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full transition-colors
        ${checked ? "bg-green-600" : "bg-gray-300"} ${className}`}
      {...props}
    >
      <span
        className={`block h-5 w-5 transform rounded-full bg-white shadow transition-transform
          ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </div>
  );
});

Switch.displayName = "Switch";

export { Switch };
