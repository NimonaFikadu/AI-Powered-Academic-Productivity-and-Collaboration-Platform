import React, { HTMLInputTypeAttribute } from "react";

type FormInputTypes = {
  title: string;
  placeholder: string;
  type?: HTMLInputTypeAttribute;
  value?: string | number;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  name?: string;
  error?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
};

function FormInput({
  title,
  placeholder,
  type = "text",
  value,
  onChange,
  required = false,
  name,
  error,
  onBlur,
}: FormInputTypes) {
  const inputBorderClass = error 
    ? "border-errorColor bg-errorColor/5 dark:border-errorColor dark:bg-errorColor/5" 
    : "border-n30 bg-primaryColor/5 dark:border-lightN30 dark:bg-lightBg1";

  return (
    <div className="">
      <p className="max-sm:text-sm font-medium">{title}</p>
      <div className={`mt-2 sm:mt-4 border rounded-full py-2 sm:py-3 px-6 ${inputBorderClass} transition-colors duration-200`}>
        <input
          type={type}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          required={required}
          className="bg-transparent outline-none placeholder:text-n400 text-sm dark:placeholder:text-lightN400 w-full"
        />
      </div>
      {error && (
        <p className="text-sm text-errorColor mt-1">{error}</p>
      )}
    </div>
  );
}

export default FormInput;
