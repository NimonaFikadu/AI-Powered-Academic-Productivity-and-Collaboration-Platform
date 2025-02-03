import React, { HTMLInputTypeAttribute, useState, ChangeEvent } from "react";
import { PiEye, PiEyeClosed } from "react-icons/pi";

type InputFieldProps = {
  className: string;
  title: string;
  type?: HTMLInputTypeAttribute;
  placeholder: string;
  name?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
};

function InputFieldSecond({
  className,
  title,
  type = "text",
  placeholder,
  name,
  value,
  onChange,
  error,
}: InputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className={className}>
      <p className="text-xs text-n400 -mb-2.5 pl-6">
        <span className="bg-white px-1">{title}</span>
      </p>
      <div className={`border ${error ? 'border-errorColor' : 'border-primaryColor/20'} rounded-xl py-3 px-5 flex justify-between items-center gap-2`}>
        <input
          type={showPassword ? "text" : type}
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent outline-none text-xs placeholder:text-n100 w-full"
        />
        {type === "password" && (
          <button className="" onClick={() => setShowPassword((prev) => !prev)}>
            {showPassword ? <PiEye /> : <PiEyeClosed />}
          </button>
        )}
      </div>
      {error && (
        <p className="text-xs text-errorColor mt-1 pl-5">{error}</p>
      )}
    </div>
  );
}

export default InputFieldSecond;
