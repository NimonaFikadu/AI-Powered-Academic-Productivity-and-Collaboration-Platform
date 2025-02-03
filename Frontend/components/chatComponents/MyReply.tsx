import React from "react";
import { PiCopy, PiPencilSimpleLine } from "react-icons/pi";

type MyReplyProps = {
  replyTime: string;
  replyText: string;
};

function MyReply({ replyTime, replyText }: MyReplyProps) {
  return (
    <div className="flex flex-col justify-end items-end gap-3 ">
      <p className="text-xs text-n100">{replyTime}</p>
      <div className="text-sm bg-infoColor/5 py-3 px-5 border border-infoColor/20 rounded-lg">
        <p className="">{replyText}</p>
      </div>
      <div className=" flex justify-end items-center gap-2 cursor-pointer">
        <PiPencilSimpleLine />
        <PiCopy />
      </div>
    </div>
  );
}

export default MyReply;
