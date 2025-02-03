import { useMainModal } from "@/stores/modal";
import React from "react";
import { PiX } from "react-icons/pi";
import BotDetailsModal from "./BotDetailsModal";
import SupportModal from "./SupportModal";
import ShareViedeoModal from "./ShareViedeoModal";
import ShareImageModal from "./ShareImageModal";
import AdjustPhotoModal from "./AdjustPhotoModal";
import ShareRetouchImageModal from "./ShareRetouchImageModal";
import EditProfileModal from "./EditYourProfile";
import IntegrationModal from "./IntegrationModal";
import SettingsModal from "./SettingsModal";
import UpgradeModal from "./UpgradeModal";
import ShareLinkModal from "./ShareLinkModal";
import CreateNewModal from "./CreateNewModal";
import ShareCodeModal from "./ShareCodeModal";
import SearchModal from "./SearchModal";
import CustomDetailsModal from "./CustomDetailsModal";
import EditBotModal from "./EditBotModal";
import PerformanceModal from "./PerformanceModal";
import UploadToAIQuill from "./UploadToAIQuill";

function MainModal() {
  const { show, modalName, modalClose } = useMainModal();
  return (
    <div
      className={`bg-black fixed inset-0 bg-opacity-40 z-[99] flex   ${
        show
          ? " scale-100 opacity-100 visible translate-y-0"
          : " scale-90 opacity-0 invisible -translate-y-4"
      } duration-300  ${
        modalName === "Upgrade"
          ? "justify-end items-start overflow-auto"
          : "justify-center items-center px-4 sm:px-6"
      }`}
    >
      <div
        className={`bg-white rounded-xl  w-full ${
          modalName === "Upgrade"
            ? " overflow-hidden sm:w-[600px]"
            : modalName === "Support Modal"
            ? "p-4 sm:p-6 overflow-y-auto max-w-[1067px] max-h-[90vh]"
            : "p-4 sm:p-6 overflow-y-auto max-w-[900px] max-h-[90vh]"
        }`}
      >
        {modalName !== "Upgrade" && (
          <div className="flex justify-between items-center pb-6 mb-6 border-b border-primaryColor/30">
            <p className="font-medium ">{modalName}</p>
            <button onClick={modalClose}>
              <PiX className="text-xl" />
            </button>
          </div>
        )}
        {modalName === "Bot Details Modal" && <BotDetailsModal />}
        {modalName === "Support Modal" && <SupportModal />}
        {modalName === "Upload To Bot Ai" && <UploadToAIQuill />}
        {modalName === "Share Video" && <ShareViedeoModal />}
        {modalName === "Share Image" && <ShareImageModal />}
        {modalName === "Adjust Photo" && <AdjustPhotoModal />}
        {modalName === "Share Retouch Image" && <ShareRetouchImageModal />}
        {modalName === "Edit Profile" && <EditProfileModal />}
        {modalName === "Integrations" && <IntegrationModal />}
        {modalName === "Settings" && <SettingsModal />}
        {modalName === "Upgrade" && <UpgradeModal />}
        {modalName === "Share Public Link" && <ShareLinkModal />}
        {modalName === "Create New Bot" && <CreateNewModal />}
        {modalName === "Share Code" && <ShareCodeModal />}
        {modalName === "Search" && <SearchModal />}
        {modalName === "Custom Bot Details" && <CustomDetailsModal />}
        {modalName === "Edit Your Bot" && <EditBotModal />}
        {modalName === "Performance" && <PerformanceModal />}
      </div>
    </div>
  );
}

export default MainModal;
