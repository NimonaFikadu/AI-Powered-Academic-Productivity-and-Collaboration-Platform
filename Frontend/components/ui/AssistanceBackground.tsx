import React from "react";

function AssistanceBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {/* Main gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primaryColor/10 to-transparent"></div>
      
      {/* Blurred circles that create a beautiful effect */}
      <div className="bg-primaryColor opacity-5 blur-[180px] w-[400px] h-[400px] fixed -top-[100px] -left-[100px]"></div>
      <div className="bg-secondaryColor opacity-10 blur-[180px] w-[300px] h-[300px] fixed top-[30%] -right-[50px]"></div>
      <div className="bg-infoColor opacity-5 blur-[200px] w-[350px] h-[350px] fixed -bottom-[100px] left-[30%]"></div>
    </div>
  );
}

export default AssistanceBackground; 