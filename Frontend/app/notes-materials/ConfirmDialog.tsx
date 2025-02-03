import React from 'react';
import { PiX, PiWarning, PiTrash } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmButtonText: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmButtonText,
  onConfirm,
  onCancel,
  isLoading = false
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <PiWarning className="text-warningColor" size={24} />
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          <button 
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 hover:bg-n300/10 rounded-full"
          >
            <PiX size={20} />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-n500">{message}</p>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="py-2 px-4 border border-n300 text-n500 rounded-xl hover:bg-n200/10"
          >
            {t('noteSummary.cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="py-2 px-4 bg-errorColor text-white rounded-xl flex items-center gap-1 hover:bg-errorColor/90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></span>
                <span>{t('noteSummary.deleting')}</span>
              </>
            ) : (
              <>
                <PiTrash />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 