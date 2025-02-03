"use client";
import React, { useState, useEffect } from "react";
import InputFieldSecond from "@/components/ui/InputFieldSecond";
import TextArea from "@/components/ui/TextArea";
import SmallButtons from "@/components/ui/buttons/SmallButtons";
import Alert from "@/components/ui/Alert";
import { topicsService } from "@/app/topics/topicsService";
import ToggleSwitch from "../ui/ToggleSwitch";


import { PiX } from "react-icons/pi";
import { useTranslation } from "react-i18next";


function AddTopicModal({ onClose, onTopicAdded }: { onClose: () => void, onTopicAdded: () => void }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    isPublic: false
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData(prev => ({ ...prev, isPublic: checked }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      newErrors.title = t('common.required');
    }

    if (!formData.description.trim()) {
      newErrors.description = t('common.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTopic = async () => {
    if (!isClient) return;
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await topicsService.createTopic(formData);

      setAlert({
        message: "Topic created successfully!",
        type: 'success'
      });

      // Notify parent component that a topic was added
      onTopicAdded();

      // Close the modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error("[LOG add_topic] ========= Error creating topic:", error);
      setAlert({
        message: error instanceof Error ? error.message : "Failed to create topic",
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Display loading state while the component is being hydrated
  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="relative w-full max-w-[600px] bg-white dark:bg-n800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">{t('materials.createNewTopic')}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-n100 dark:hover:bg-n700 transition"
          >
            <PiX className="text-xl" />
          </button>
        </div>

        {alert && (
          <div className="mb-4">
            <Alert
              message={alert.message}
              type={alert.type}
              onClose={() => setAlert(null)}
            />
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12">
            <InputFieldSecond
              className="col-span-12"
              placeholder={t('materials.topicTitlePlaceholder')}
              title={t('materials.topicTitle')}
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              error={errors.title}
            />
          </div>

          <div className="col-span-12">
            <TextArea
              className="col-span-12"
              placeholder={t('materials.topicDescPlaceholder')}
              title={t('materials.topicDesc')}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              error={errors.description}
            />
          </div>

          <div className="col-span-12 flex items-center justify-between py-2">
            <div>
              <span className="text-sm font-medium block">{t('materials.makeTopicPublic')}</span>
              <span className="text-xs text-n400 block">{t('materials.publicTopicDesc')}</span>
            </div>
            <ToggleSwitch
              isChecked={formData.isPublic}
              onChange={handleToggleChange}
            />
          </div>
        </div>

        <div className="flex justify-end items-center gap-3 mt-8 border-t dark:border-n700 pt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-n200 dark:border-n600 hover:bg-n50 dark:hover:bg-n700 transition"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleCreateTopic}
            disabled={isLoading}
            className={`px-8 py-2 rounded-full bg-primaryColor text-white hover:bg-primaryColor/90 transition flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>{t('materials.creatingTopic')}</span>
              </>
            ) : (
              t('home.createTopic')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddTopicModal; 