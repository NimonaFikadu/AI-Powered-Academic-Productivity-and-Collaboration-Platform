import { create } from "zustand";

type MainModalType = {
  show: boolean;
  modalName: string;
  modalOpen: (name: string) => void;
  modalClose: () => void;
};

export const useMainModal = create<MainModalType>((set) => ({
  show: false,
  modalName: "",
  modalOpen: (name) => set({ show: true, modalName: name }),
  modalClose: () => set({ show: false, modalName: "" }),
}));
