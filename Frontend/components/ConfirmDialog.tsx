import React from 'react';
import { PiX } from 'react-icons/pi';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmButtonClass = 'bg-errorColor hover:bg-errorColor/90',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-primaryColor/20">
          <h2 className="text-xl font-medium">{title}</h2>
          <button 
            onClick={onCancel}
            className="text-n300 hover:text-n400 dark:text-n400 dark:hover:text-n300"
          >
            <PiX size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <p className="mb-6">{message}</p>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="py-2 px-3 border border-n300 text-n400 rounded-lg hover:bg-n200/10"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`py-2 px-3 text-white rounded-lg ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog; 