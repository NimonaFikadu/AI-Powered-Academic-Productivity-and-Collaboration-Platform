"use client";
import React, { useState } from "react";

function ToggleButton({ 
  fn, 
  active: controlledActive, 
  onChange 
}: { 
  fn?: () => void; 
  active?: boolean;
  onChange?: (val: boolean) => void;
}) {
  const [internalActive, setInternalActive] = useState(false);
  
  const isControlled = controlledActive !== undefined;
  const active = isControlled ? controlledActive : internalActive;

  return (
    <button
      type="button"
      onClick={() => {
        const nextState = !active;
        if (!isControlled) setInternalActive(nextState);
        onChange?.(nextState);
        fn?.();
      }}
      className={` border  rounded-full w-[62px] h-[34px] relative ${
        active
          ? " bg-primaryColor border-primaryColor"
          : "bg-primaryColor/5 border-primaryColor/30"
      } duration-500`}
    >
      <span
        className={`size-7 rounded-full bg-white  absolute  top-0.5 left-0.5 ${
          active ? "translate-x-[29px]" : " translate-x-0 "
        }  duration-500`}
      ></span>
    </button>
  );
}

export default ToggleButton;
