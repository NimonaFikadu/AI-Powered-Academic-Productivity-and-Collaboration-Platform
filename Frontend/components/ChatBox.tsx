import { useChatHandler } from "@/stores/chatList";
import { usePathname, useRouter } from "next/navigation";
import React, { FormEvent, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  PiArrowUp,
  PiLightbulb,
  PiMagnifyingGlass,
  PiMicrophone,
  PiPaperclip,
} from "react-icons/pi";

function ChatBox() {
  const [inputText, setInputText] = useState("");
  const router = useRouter();
  const path = usePathname();
  const { userQuery, handleSubmit, setUserQuery } = useChatHandler();

  const chatIdUrl = path.split("/chat/")[1];

  const handleSendMessage = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (userQuery.length === 0) {
      return;
    }

    const chatId = uuidv4();
    let currentChatId = "";
    currentChatId = chatId;
    if (!path.includes("/chat/")) {
      router.push(`/chat/${currentChatId}`);
    } else {
      currentChatId = chatIdUrl;
    }
    handleSubmit(userQuery, currentChatId);
    setInputText("");
  };
  return (
    <div className=" w-full max-w-[1070px] mx-auto px-4 sm:px-6">
      <form
        onSubmit={handleSendMessage}
        className={`  w-full bg-primaryColor/5 p-2 lg:p-4 rounded-xl border border-primaryColor/20  `}
      >
        <div className="w-full  bg-white rounded-lg max-lg:text-sm block dark:bg-n0">
          <input
            className=" w-full outline-none  p-4 bg-transparent "
            placeholder={inputText ? inputText : "Message UniHub..."}
            value={inputText}
            onChange={(e) => {
              setUserQuery(e.target.value);
              setInputText(e.target.value);
            }}
          />
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="flex justify-start items-center gap-3">
            <button className="flex justify-center items-center gap-2 py-2 px-2 sm:px-4 rounded-full border border-secondaryColor/20  bg-secondaryColor/5">
              <PiMagnifyingGlass className="text-secondaryColor" />
              <span className="text-xs font-medium max-sm:hidden">Search</span>
            </button>
            <button className="flex justify-center items-center gap-2 py-2  px-2 sm:px-4 rounded-full border border-warningColor/30  bg-warningColor/5">
              <PiLightbulb className="text-warningColor" />
              <span className="text-xs font-medium max-sm:hidden">
                Brainstorm
              </span>
            </button>
          </div>
          <div className="flex justify-end items-center gap-3">
            <button className="bg-white p-2 rounded-full flex justify-center items-center border border-primaryColor/20 dark:bg-n0">
              <PiMicrophone />
            </button>
            <button className="bg-white p-2 rounded-full flex justify-center items-center border border-primaryColor/20 dark:bg-n0">
              <PiPaperclip />
            </button>
            <button
              type="submit"
              className="bg-primaryColor p-2 rounded-full flex justify-center items-center border border-primaryColor text-white"
            >
              <PiArrowUp />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ChatBox;
