import { demoChatData } from "@/constants/chats";
import { create } from "zustand";

type ChatMessagesType = {
  text:
    | string
    | {
        summary: string;
        isCommandSuggestion?: boolean;
        commands?: { command: string; label: string }[];
        code?: string;
        language?: string;
        image?: string;
      };
  isUser: boolean;
  timestamp: string;
};

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessagesType[];
}

type ChatHandlerType = {
  userQuery: string;
  chatList: Chat[];
  isAnimation: boolean;
  handleSubmit: (text: string, chatId: string) => void;
  updateChatList: () => void;
  emptyQuery: () => void;
  setUserQuery: (text: string) => void;
};

export const useChatHandler = create<ChatHandlerType>((set) => ({
  userQuery: "",
  chatList: demoChatData,
  isAnimation: false,
  setUserQuery: (text) => {
    set({ userQuery: text });
  },
  emptyQuery: () => {
    set({ userQuery: "" });
  },
  updateChatList: () => {
    try {
      const storedData = localStorage.getItem("chat-list");

      if (!storedData) {
        localStorage.setItem("chat-list", JSON.stringify(demoChatData));
      } else {
        const parsedData = JSON.parse(storedData);
        JSON.parse(storedData);
        set({ chatList: parsedData });
      }
    } catch (error) {
      console.log(error);
    }
  },
  handleSubmit: (text, chatId) => {
    set({ userQuery: text });
    const storedData = localStorage.getItem("chat-list");
    if (storedData) {
      const parsedData: Chat[] = JSON.parse(storedData);

      const isOldChat = parsedData.some(({ id }: { id: string }) => {
        return id === chatId;
      });

      if (!isOldChat) {
        const newChatList: Chat[] = [
          {
            id: chatId,
            title: text,
            messages: [
              { text: text, isUser: true, timestamp: new Date().toISOString() },
            ],
          },
          ...parsedData,
        ];
        localStorage.setItem("chat-list", JSON.stringify(newChatList));
        set({ chatList: newChatList });
      } else {
        const updatedChatList: Chat[] = parsedData.map((chat) => {
          if (chat.id === chatId) {
            return {
              ...chat,
              messages: [
                ...chat.messages,
                {
                  text: text,
                  isUser: true,
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          }
          return chat;
        });

        localStorage.setItem("chat-list", JSON.stringify(updatedChatList));
        set({ chatList: updatedChatList });
      }
    }
  },
}));
