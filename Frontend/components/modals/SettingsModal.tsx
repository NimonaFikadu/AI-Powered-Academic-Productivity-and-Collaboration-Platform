import SmallButtons from "@/components/ui/buttons/SmallButtons";
import InputFieldSecond from "@/components/ui/InputFieldSecond";
import ToggleButton from "@/components/ui/ToggleButton";
import {
  accentColorItems,
  responseStyle,
  settingsTabItems,
  themeSettingsData,
} from "@/constants/data";
import { useTheme } from "next-themes";
import React, { useState, useEffect } from "react";
import SelectDropdown from "../ui/SelectDropdown";
import { authService } from "@/app/auth/authService";
import { API_ENDPOINTS } from "@/config/apiConfig";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Mapping from data.ts tab index → settings locale key
const TAB_KEYS = ["tabGeneral", "tabSecurity", "tabAppearance"] as const;

function SettingsModal() {
  const [activeMenu, setActiveMenu] = useState(0);
  const { setTheme } = useTheme();
  const { t } = useTranslation();

  // --- Password Change State ---
  const [savingPassword, setSavingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- API Key State ---
  const [apiKey, setApiKey] = useState("sk-unihub-************************");

  // --- Local Preferences State ---
  const [preferences, setPreferences] = useState({
    messageHistory: true,
    codeHighlighting: true,
    aiSuggestions: true,
    e2eEncryption: false,
    autoDelete: false,
    twoFactor: false,
    messageBubbles: true,
    compactMode: false,
    largeFont: false,
    accentColor: "#4D6BFE",
    responseStyle: "Response Style 1",
    codeFormat: "Response Style 1",
    recoveryEmail: "",
  });

  useEffect(() => {
    const stored = localStorage.getItem("unihub_preferences");
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        /* fail silently if malformed */
      }
    }
  }, []);

  const handleToggle = (key: keyof typeof preferences) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("unihub_preferences", JSON.stringify(next));
      return next;
    });
  };

  const handleStringChange = (key: keyof typeof preferences, val: string) => {
    setPreferences((prev) => {
      const next = { ...prev, [key]: val };
      localStorage.setItem("unihub_preferences", JSON.stringify(next));
      return next;
    });
  };

  const handleAccentChange = (hex: string) => {
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex[1] + hex[2], 16);
      g = parseInt(hex[3] + hex[4], 16);
      b = parseInt(hex[5] + hex[6], 16);
    }
    document.documentElement.style.setProperty("--primary-color", `${r} ${g} ${b}`);

    setPreferences(prev => {
      const next = { ...prev, accentColor: hex };
      localStorage.setItem("unihub_preferences", JSON.stringify(next));
      return next;
    });
  };

  const handlePasswordChange = async () => {
    if (!oldPassword) {
      toast.error(t("settings.currentPassword") + " " + t("common.required") + ".");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t("settings.newPassword") + " " + t("common.required") + ".");
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t("settings.newPassword") + " " + t("common.required") + ".");
      return;
    }

    const token = authService.getToken();
    if (!token) {
      toast.error(t("auth.login"));
      return;
    }

    setSavingPassword(true);
    try {
      const res = await fetch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword: oldPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || t("settings.savePassword"));

      toast.success(data.message || t("settings.savePassword"));
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRegenerateKey = () => {
    const newKey = "sk-unihub-" + Math.random().toString(36).substr(2, 24);
    setApiKey(newKey);
    toast.success(t("settings.apiKeyGenerated"));
  };

  // Localised tab labels — override the static data.ts names
  const localizedTabLabels = TAB_KEYS.map(key => t(`settings.${key}`));

  return (
    <div className=" dark:text-n30">
      <div className="p-2 border border-primaryColor/30 bg-primaryColor/5 rounded-xl min-[1400px]:rounded-full flex flex-row justify-centert items-center flex-wrap gap-2 w-full mt-6">
        {settingsTabItems.map(({ id, icon }, idx) => (
          <div
            key={id}
            className={`flex justify-start items-center gap-2 xl:gap-2 py-2 pl-2 pr-6  border  rounded-full cursor-pointer ${
              activeMenu === idx
                ? " border-primaryColor bg-primaryColor"
                : "border-primaryColor/30 bg-white"
            }`}
            onClick={() => setActiveMenu(idx)}
          >
            <div
              className={`flex justify-center items-center border  rounded-full p-1.5 xl:p-2  ${
                activeMenu === idx
                  ? " border-primaryColor bg-white"
                  : "border-primaryColor/30 bg-primaryColor/5"
              }`}
            >
              {React.createElement(icon, {
                className: `text-primaryColor text-base xl:text-xl`,
              })}
            </div>
            <p
              className={`text-sm font-medium text-nowrap pr-4 ${
                activeMenu === idx ? "text-white" : ""
              }`}
            >
              {localizedTabLabels[idx]}
            </p>
          </div>
        ))}
      </div>

      {/* ── General Tab ── */}
      {activeMenu === 0 && (
        <div className="mt-6 bg-primaryColor/5 border border-primaryColor/30 rounded-xl p-5">
          <div className=" pb-5 border-b border-primaryColor/30">
            <p className="text-n700 font-medium  dark:text-n30">{t("settings.generalTitle")}</p>
            <p className="pt-2 text-xs">{t("settings.generalSubtitle")}</p>
          </div>
          <div className="flex flex-col gap-3 pt-5 ">
            <div className="flex justify-between items-center p-4 rounded-xl hover:bg-primaryColor/5 hover:border-primaryColor/30 border border-transparent duration-500  ">
              <div className=" ">
                <p className="text-n700 font-medium  dark:text-n30 text-sm">
                  {t("settings.messageHistory")}
                </p>
                <p className="pt-2 text-xs">{t("settings.messageHistoryDesc")}</p>
              </div>
              <div className="">
                <ToggleButton
                  active={preferences.messageHistory}
                  onChange={() => handleToggle("messageHistory")}
                />
              </div>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl hover:bg-primaryColor/5 hover:border-primaryColor/30 border border-transparent duration-500  ">
              <div className=" ">
                <p className="text-n700 font-medium  dark:text-n30 text-sm">
                  {t("settings.codeHighlighting")}
                </p>
                <p className="pt-2 text-xs">{t("settings.codeHighlightingDesc")}</p>
              </div>
              <div className="">
                <ToggleButton
                  active={preferences.codeHighlighting}
                  onChange={() => handleToggle("codeHighlighting")}
                />
              </div>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl hover:bg-primaryColor/5 hover:border-primaryColor/30 border border-transparent duration-500  ">
              <div className=" ">
                <p className="text-n700 font-medium  dark:text-n30 text-sm">
                  {t("settings.aiSuggestions")}
                </p>
                <p className="pt-2 text-xs">{t("settings.aiSuggestionsDesc")}</p>
              </div>
              <div className="">
                <ToggleButton
                  active={preferences.aiSuggestions}
                  onChange={() => handleToggle("aiSuggestions")}
                />
              </div>
            </div>

            <div className="p-4 border border-primaryColor/30 rounded-xl bg-white">
              <p className="text-n700 font-medium  dark:text-n30 text-sm pb-2">
                {t("settings.moreStyleFormat")}
              </p>
              <div className="flex flex-col gap-2">
                <SelectDropdown
                  options={responseStyle}
                  placeholder={t("settings.responseStylePlaceholder")}
                  title={t("settings.responseStyleTitle")}
                  value={preferences.responseStyle}
                  onChange={(val) => handleStringChange("responseStyle", val)}
                />
                <SelectDropdown
                  options={responseStyle}
                  placeholder={t("settings.codeFormatPlaceholder")}
                  title={t("settings.codeFormatTitle")}
                  value={preferences.codeFormat}
                  onChange={(val) => handleStringChange("codeFormat", val)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-start items-center gap-2 pt-5 text-xs">
            <SmallButtons
              name={t("settings.saveChanges")}
              fn={() => toast.success(t("settings.savedLocally"))}
            />
          </div>
        </div>
      )}

      {/* ── Security Tab ── */}
      {activeMenu === 1 && (
        <div className="flex flex-col gap-6 pt-6">
          <div className="p-5 border border-primaryColor/30 rounded-xl">
            <div className=" pb-5 border-b border-primaryColor/30">
              <p className="text-n700 font-medium  dark:text-n30">
                {t("settings.changePasswordTitle")}
              </p>
              <p className="pt-2 text-xs">{t("settings.changePasswordDesc")}</p>
            </div>

            <div className="grid grid-cols-12 gap-6 pt-6">
              <InputFieldSecond
                className="col-span-12"
                placeholder="*******"
                title={t("settings.currentPassword")}
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
              <InputFieldSecond
                className="col-span-6"
                placeholder="*******"
                title={t("settings.newPassword")}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <InputFieldSecond
                className="col-span-6"
                placeholder="*******"
                title={t("settings.confirmPassword")}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <div className="flex justify-start items-center gap-2 text-xs col-span-12">
                <SmallButtons
                  name={savingPassword ? t("settings.savingPassword") : t("settings.savePassword")}
                  fn={handlePasswordChange}
                  disabled={savingPassword || (!oldPassword && !newPassword && !confirmPassword)}
                />
                <SmallButtons
                  name={t("settings.resetFields")}
                  secondary={true}
                  fn={() => {
                    setOldPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                />
              </div>
            </div>
          </div>

          <div className=" bg-primaryColor/5 border border-primaryColor/30 rounded-xl p-5">
            <div className=" pb-5 border-b border-primaryColor/30">
              <p className="text-n700 font-medium  dark:text-n30">{t("settings.securityTitle")}</p>
              <p className="pt-2 text-xs">{t("settings.securityDesc")}</p>
            </div>
            <div className="flex flex-col gap-3 pt-5 ">
              <div className="flex justify-between items-center p-4 rounded-xl hover:bg-primaryColor/5 hover:border-primaryColor/30 border border-transparent duration-500  ">
                <div className=" ">
                  <p className="text-n700 font-medium  dark:text-n30 text-sm">
                    {t("settings.e2eEncryption")}
                  </p>
                  <p className="pt-2 text-xs">{t("settings.e2eEncryptionDesc")}</p>
                </div>
                <div className="">
                  <ToggleButton
                    active={preferences.e2eEncryption}
                    onChange={() => handleToggle("e2eEncryption")}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl hover:bg-primaryColor/5 hover:border-primaryColor/30 border border-transparent duration-500  ">
                <div className=" ">
                  <p className="text-n700 font-medium  dark:text-n30 text-sm">
                    {t("settings.autoDelete")}
                  </p>
                  <p className="pt-2 text-xs">{t("settings.autoDeleteDesc")}</p>
                </div>
                <div className="">
                  <ToggleButton
                    active={preferences.autoDelete}
                    onChange={() => handleToggle("autoDelete")}
                  />
                </div>
              </div>
              <div className="flex justify-between items-center p-4 rounded-xl hover:bg-primaryColor/5 hover:border-primaryColor/30 border border-transparent duration-500  ">
                <div className=" ">
                  <p className="text-n700 font-medium  dark:text-n30 text-sm">
                    {t("settings.twoFactor")}
                  </p>
                  <p className="pt-2 text-xs">{t("settings.twoFactorDesc")}</p>
                </div>
                <div className="">
                  <ToggleButton
                    active={preferences.twoFactor}
                    onChange={() => handleToggle("twoFactor")}
                  />
                </div>
              </div>

              <div className="p-4 border border-primaryColor/30 rounded-xl bg-white">
                <p className="text-n700 font-medium  dark:text-n30 text-sm">
                  {t("settings.moreSecurity")}
                </p>
                <InputFieldSecond
                  className=" pt-3"
                  placeholder="recovery@example.com"
                  title={t("settings.recoveryEmail")}
                  type="email"
                  value={preferences.recoveryEmail}
                  onChange={(e) => handleStringChange("recoveryEmail", e.target.value)}
                />
                <div className="col-span-12 mt-4">
                  <p className="text-xs text-n400 -mb-2.5 pl-6">
                    <span className="bg-white px-1">{t("settings.apiKey")}</span>
                  </p>
                  <div className="border border-primaryColor/20 rounded-xl py-2 pl-5 pr-2 flex justify-between items-center gap-2 ">
                    <input
                      type="password"
                      readOnly
                      value={apiKey}
                      className="bg-transparent outline-none text-xs placeholder:text-n100 w-full"
                    />
                    <button
                      type="button"
                      onClick={handleRegenerateKey}
                      className="text-xs font-medium text-primaryColor bg-primaryColor/10 border border-primaryColor/20 py-2 px-4 rounded-md"
                    >
                      {t("settings.regenerate")}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-start items-center gap-2 pt-5 text-xs">
              <SmallButtons
                name={t("settings.saveChanges")}
                fn={() => toast.success(t("settings.securitySaved"))}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Appearance Tab ── */}
      {activeMenu === 2 && (
        <div className=" bg-primaryColor/5 border border-primaryColor/30 rounded-xl p-5 mt-6">
          <div className=" pb-5 border-b border-primaryColor/30">
            <p className="text-n700 font-medium  dark:text-n30">{t("settings.appearanceTitle")}</p>
            <p className="pt-2 text-xs">{t("settings.appearanceDesc")}</p>
          </div>
          <div className="flex flex-col gap-3 pt-5 ">
            <div className="flex flex-col gap-4 items-start ">
              <div className=" ">
                <p className="text-n700 font-medium  dark:text-n30 text-sm">
                  {t("settings.themeTitle")}
                </p>
                <p className="pt-2 text-xs">{t("settings.themeDesc")}</p>
              </div>
              <div className="flex justify-start items-start bg-white p-2 rounded-xl border border-primaryColor/30 gap-2 dark:bg-n0">
                {themeSettingsData.map(({ id, name, icon }) => (
                  <div
                    className="bg-primaryColor/5 border border-primaryColor/30 py-3 px-10 flex flex-col justify-center items-center gap-2 rounded-xl cursor-pointer group hover:bg-primaryColor hover:border-primaryColor duration-300"
                    key={id}
                    onClick={() => setTheme(name.toLowerCase())}
                  >
                    <div className="flex justify-center items-center bg-white  text-primaryColor border border-primaryColor/30 p-2 text-xl rounded-full">
                      {React.createElement(icon)}
                    </div>
                    <p className="text-sm font-medium text-center group-hover:text-white">
                      {name}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4 items-start ">
              <div className=" ">
                <p className="text-n700 font-medium  dark:text-n30 text-sm">
                  {t("settings.accentColor")}
                </p>
                <p className="pt-2 text-xs">{t("settings.accentColorDesc")}</p>
              </div>
              <div className="flex justify-start items-center gap-1">
                {accentColorItems.map(({ id, color }) => (
                  <div
                    className={`bg-white rounded-full size-7 flex justify-center items-center border hover:border-primaryColor duration-300 dark:bg-n0 dark:border-lightN30 cursor-pointer ${
                      preferences.accentColor === color ? 'border-primaryColor border-2' : 'border-white'
                    }`}
                    key={id}
                    onClick={() => handleAccentChange(color)}
                  >
                    <div
                      className="size-5 rounded-full"
                      style={{ backgroundColor: color }}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <div className=" ">
                <p className="text-n700 font-medium  dark:text-n30 text-sm">
                  {t("settings.messageBubbles")}
                </p>
                <p className="pt-1 text-xs">{t("settings.messageBubblesDesc")}</p>
              </div>
              <div className="">
                <ToggleButton
                  active={preferences.messageBubbles}
                  onChange={() => handleToggle("messageBubbles")}
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <div className=" ">
                <p className="text-n700 font-medium  dark:text-n30 text-sm">
                  {t("settings.compactMode")}
                </p>
                <p className="pt-1 text-xs">{t("settings.compactModeDesc")}</p>
              </div>
              <div className="">
                <ToggleButton
                  active={preferences.compactMode}
                  onChange={() => handleToggle("compactMode")}
                />
              </div>
            </div>
            <div className="flex justify-between items-center mt-3">
              <div className=" ">
                <p className="text-n700 font-medium  dark:text-n30 text-sm">
                  {t("settings.largeFont")}
                </p>
                <p className="pt-1 text-xs">{t("settings.largeFontDesc")}</p>
              </div>
              <div className="">
                <ToggleButton
                  active={preferences.largeFont}
                  onChange={() => handleToggle("largeFont")}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-start items-center gap-2 pt-5 text-xs">
            <SmallButtons
              name={t("settings.saveChanges")}
              fn={() => toast.success(t("settings.appearanceSaved"))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsModal;
