import React, { useState } from "react";
import { PiList, PiUploadSimple, PiCaretDown, PiGlobe } from "react-icons/pi";
import UserModal from "./header/UserModal";
import { useMainModal } from "@/stores/modal";
import UpgradeModal from "./header/UpgradeModal";
import ThemeSwitch from "./ThemeSwitch";
import { usePathname } from "next/navigation";
import { useLanguageStore } from "@/stores/languageStore";
import { useTranslation } from "react-i18next";

type HeaderProps = {
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

function Header({ showSidebar, setShowSidebar }: HeaderProps) {
  const { modalOpen } = useMainModal();
  const path = usePathname();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const { currentLanguage, setLanguage } = useLanguageStore();
  const { t } = useTranslation();
  
  // Determine if we're on the assistance page to apply different styling
  const isAssistancePage = path.includes("/assistance");

  const languages = [
    { id: "en", name: "English" },
    { id: "am", name: "Amharic" },
    { id: "om", name: "Afaan Oromo" },
  ];

  const handleLanguageChange = (langId: string) => {
    setLanguage(langId);
    setShowLanguageDropdown(false);
  };

  const getCurrentLanguageName = () => {
    return languages.find(lang => lang.id === currentLanguage)?.name || "English";
  };

  return (
    <div className={`px-6 py-3 flex justify-between items-center w-full sticky top-0 left-0 right-0 z-30 ${
      isAssistancePage ? 'bg-transparent backdrop-blur-sm' : 'bg-white'
    }`}>
      <div className="flex justify-start items-center gap-2">
        <button
          className={`${showSidebar ? "hidden" : ""}`}
          onClick={() => setShowSidebar(true)}
        >
          <PiList className="text-2xl" />
        </button>
        <UpgradeModal />
      </div>
      <div className="flex justify-start items-center gap-2 sm:gap-4 ">
        <ThemeSwitch />
        
        {/* Language Selector */}
        <div className="relative">
          <button 
            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
            className="flex justify-center items-center gap-1 py-2 px-2 sm:px-3 rounded-full border border-primaryColor/20 hover:border-primaryColor/50 text-n500 dark:text-n30"
          >
            <PiGlobe className="text-primaryColor" />
            <span className="text-xs font-medium max-sm:hidden">{getCurrentLanguageName()}</span>
            <PiCaretDown className="text-xs" />
          </button>
          
          {showLanguageDropdown && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-primaryColor/20 rounded-lg shadow-lg py-1 min-w-[120px] z-50">
              {languages.map((language) => (
                <button
                  key={language.id}
                  onClick={() => handleLanguageChange(language.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-primaryColor/5 ${
                    currentLanguage === language.id 
                      ? "text-primaryColor font-medium" 
                      : "text-n500 dark:text-n30"
                  }`}
                >
                  {language.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        {path.includes("chat") && (
          <button
            onClick={() => modalOpen("Share Public Link")}
            className="flex justify-center items-center gap-2 py-2  px-2 sm:px-4 rounded-full border border-primaryColor text-primaryColor"
          >
            <PiUploadSimple />
            <span className="text-xs font-medium max-[400px]:hidden">
              {t('common.share')}
            </span>
          </button>
        )}
        {path === "/custom-bots" && (
          <button
            onClick={() => modalOpen("Create New Bot")}
            className="flex justify-center items-center gap-2 py-2  px-2 sm:px-4 rounded-full border border-primaryColor text-primaryColor"
          >
            <PiUploadSimple />
            <span className="text-xs font-medium max-[400px]:hidden">
              Create New
            </span>
          </button>
        )}

        <UserModal />
      </div>
    </div>
  );
}

export default Header;
