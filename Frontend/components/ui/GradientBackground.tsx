import React from "react";

function GradientBackground() {
  return (
    <div className=" opacity-30">
      <div className=" bg-primaryColor opacity-70 blur-[200px] size-[227px] fixed -top-56 -left-56"></div>
      <div className=" bg-primaryColor opacity-70 blur-[200px] size-[227px] fixed -bottom-56 left-[50%]"></div>
      <div className=" bg-[#00B8D9] opacity-70 blur-[200px] size-[227px] fixed -top-[300px] left-[30%]"></div>
      <div className=" bg-warningColor opacity-70 blur-[200px] size-[227px] fixed top-[200px] left-[50%]"></div>
      <div className=" bg-errorColor opacity-70 blur-[200px] size-[227px] fixed top-[400px] -left-[100px]"></div>
      <div className=" bg-successColor opacity-70 blur-[200px] size-[227px] fixed -bottom-[150px] -left-[150px]"></div>
      <div className=" bg-warningColor opacity-70 blur-[200px] size-[227px] fixed -bottom-[200px] left-[20%]"></div>
    </div>
  );
}

export default GradientBackground;
