import React from 'react';
import { PiX, PiClock, PiWarningCircle } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';

interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureType: string;
}

const ComingSoonModal: React.FC<ComingSoonModalProps> = ({ isOpen, onClose, featureType }) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl p-6 relative animate-fade-in">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-n300 dark:text-n400 hover:text-n700 dark:hover:text-white"
        >
          <PiX size={24} />
        </button>
        
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-full">
            <PiClock className="text-yellow-600 dark:text-yellow-400 text-3xl" />
          </div>
          
          <h3 className="text-xl font-semibold mb-2">{t('noteSummary.comingSoonTitle')}</h3>
          <p className="text-n400 dark:text-n300 mb-6">
            {featureType === "audio" 
              ? t('noteSummary.audioComingSoonDesc')
              : t('noteSummary.videoComingSoonDesc')}
          </p>
          
          <div className="bg-primaryColor/10 p-4 rounded-lg w-full mb-6">
            <div className="flex items-start gap-3">
              <PiWarningCircle className="text-primaryColor text-xl flex-shrink-0 mt-0.5" />
              <p className="text-sm text-left text-n500 dark:text-n300">
                {t('noteSummary.comingSoonWarning')}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="py-2 px-6 bg-primaryColor text-white rounded-xl font-medium"
          >
            {t('noteSummary.gotIt')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonModal; 