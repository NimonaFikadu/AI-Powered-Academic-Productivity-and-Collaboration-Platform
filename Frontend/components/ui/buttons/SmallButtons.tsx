import React from "react";

type SmallButtonProps = {
  name: string;
  fn?: () => void;
  secondary?: boolean;
  disabled?: boolean;
  className?: string;
};

function SmallButtons({ 
  name, 
  fn, 
  secondary, 
  disabled = false,
  className = ""
}: SmallButtonProps) {
  return (
    <button
      onClick={fn}
      disabled={disabled}
      className={`py-2 px-4 rounded-full border ${
        secondary
          ? "border-primaryColor text-primaryColor hover:bg-primaryColor/5"
          : "bg-primaryColor text-white border-primaryColor hover:bg-primaryColor/90"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
    >
      {name}
    </button>
  );
}

export default SmallButtons;
