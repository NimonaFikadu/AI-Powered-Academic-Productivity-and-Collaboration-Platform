import React, { ChangeEvent } from "react";

type TextAreaProps = {
  className: string;
  title: string;
  placeholder: string;
  name?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
};

function TextArea({ 
  className, 
  title, 
  placeholder,
  name,
  value,
  onChange,
  error
}: TextAreaProps) {
  return (
    <div className={className}>
      <p className="text-xs text-n400 -mb-2.5 pl-6">
        <span className="bg-white px-1 dark:bg-n0">{title}</span>
      </p>
      <div className={`border ${error ? 'border-errorColor' : 'border-primaryColor/20'} rounded-xl py-3 px-5`}>
        <textarea
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={onChange}
          className="bg-transparent outline-none text-xs placeholder:text-n100 w-full h-[60px]"
        ></textarea>
      </div>
      {error && (
        <p className="text-xs text-errorColor mt-1 pl-5">{error}</p>
      )}
    </div>
  );
}

export default TextArea;
