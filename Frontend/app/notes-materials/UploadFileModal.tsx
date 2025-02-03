import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { PiX, PiUpload, PiFilePdf, PiFileDoc, PiFileCsv, PiImage, PiPlus } from 'react-icons/pi';
import { uploadMaterial } from './materials.service';
import { TopicProgress } from './statistics.service';
import { topicsService } from '../topics/topicsService';
import Alert from '@/components/ui/Alert';
import { useTranslation } from "react-i18next";

interface UploadFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicProgress[];
  onUploadSuccess: () => void;
}

const UploadFileModal: React.FC<UploadFileModalProps> = ({ 
  isOpen, 
  onClose, 
  topics,
  onUploadSuccess 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [isNewTopic, setIsNewTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isUploading || isCreatingTopic) return;
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      setSelectedFile(files[0]);
      setError(null);
    }
  };

  const handleTopicChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTopicId(value);
    setIsNewTopic(value === 'new');
    setError(null);
  };

  const handleNewTopicNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setNewTopicName(e.target.value);
    setError(null);
  };

  const createNewTopic = async (): Promise<string | null> => {
    if (!newTopicName.trim()) {
      setError(t('materials.topicNameRequired'));
      return null;
    }

    setIsCreatingTopic(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        setError(t('materials.loginRequiredTopic'));
        return null;
      }
      
      const response = await topicsService.createTopic({
        title: newTopicName.trim(),
        description: '',
        isPublic: true
      });
      return response.topicId;
    } catch (error) {
      console.error('[LOG upload_modal] ========= Error creating topic:', error);
      setError(t('materials.topicCreateFailed'));
      return null;
    } finally {
      setIsCreatingTopic(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError(t('materials.fileRequired'));
      return;
    }

    let topicId = selectedTopicId;
    
    // Create new topic if needed
    if (isNewTopic) {
      const newTopicId = await createNewTopic();
      if (!newTopicId) return;
      topicId = newTopicId;
    } else if (!topicId) {
      setError(t('materials.topicRequired'));
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // Check if user is logged in
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        setError(t('materials.loginRequiredUpload'));
        setIsUploading(false);
        return;
      }
      
      await uploadMaterial(selectedFile, topicId);
      onUploadSuccess();
      setShowSuccessAlert(true);
      
      // Close the modal after a short delay to show the success state
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('[LOG upload_modal] ========= Error uploading file:', error);
      setError(t('materials.uploadFailed'));
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = () => {
    const fileType = selectedFile?.type || '';

    if (fileType.includes('pdf')) return <PiFilePdf className="text-errorColor" size={24} />;
    if (fileType.includes('doc')) return <PiFileDoc className="text-primaryColor" size={24} />;
    if (fileType.includes('image')) return <PiImage className="text-secondaryColor" size={24} />;
    if (fileType.includes('csv') || fileType.includes('excel') || fileType.includes('spreadsheet')) 
      return <PiFileCsv className="text-successColor" size={24} />;

    return <PiFilePdf className="text-n300" size={24} />;
  };

  const formatFileSize = (sizeInBytes: number) => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('materials.uploadNewMaterial')}</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-n300/10 rounded-full"
          >
            <PiX size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-errorColor/10 border border-errorColor/20 text-errorColor rounded-lg text-sm">
            {error}
          </div>
        )}

        {showSuccessAlert && (
          <Alert
            message={t('materials.uploadSuccess')}
            type="success"
            onClose={() => setShowSuccessAlert(false)}
          />
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">{t('materials.topics')}</label>
          <select
            value={selectedTopicId}
            onChange={handleTopicChange}
            className="w-full py-2 px-3 border border-primaryColor/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryColor bg-transparent"
            disabled={isUploading || isCreatingTopic}
          >
            <option value="">{t('materials.selectTopicPlaceholder')}</option>
            {topics.map(topic => (
              <option key={topic.topicId} value={topic.topicId}>
                {topic.topicTitle}
              </option>
            ))}
            <option value="new">➕ {t('materials.createNewTopic')}</option>
          </select>
        </div>

        {isNewTopic && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t('materials.newTopicNameLabel')}</label>
            <input
              type="text"
              value={newTopicName}
              onChange={handleNewTopicNameChange}
              className="w-full py-2 px-3 border border-primaryColor/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primaryColor bg-transparent"
              placeholder={t('materials.newTopicNamePlaceholder')}
              disabled={isUploading || isCreatingTopic}
            />
          </div>
        )}

        <div className="mb-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primaryColor bg-primaryColor/10 scale-[1.01]'
                : selectedFile
                ? 'border-primaryColor/50 bg-primaryColor/5'
                : 'border-n300/30 hover:border-primaryColor/30'
            }`}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <div className="mb-2">{getFileIcon()}</div>
                <p className="font-medium mb-1 break-all">{selectedFile.name}</p>
                <p className="text-sm text-n300">{formatFileSize(selectedFile.size)}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="p-3 rounded-full bg-primaryColor/10 mb-2">
                  <PiUpload className="text-primaryColor" size={24} />
                </div>
                <p className="font-medium mb-1">{t('materials.uploadFile')}</p>
                <p className="text-sm text-n300">{t('materials.clickToBrowse')}</p>
                <p className="text-xs text-n300 mt-2">{t('materials.supportedFormats')}</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif"
              disabled={isUploading || isCreatingTopic}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="py-2 px-4 border border-primaryColor/30 text-primaryColor rounded-xl hover:bg-primaryColor/5"
            disabled={isUploading || isCreatingTopic}
          >
            {t('noteSummary.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="py-2 px-4 bg-primaryColor text-white rounded-xl flex items-center gap-1 disabled:opacity-50"
            disabled={isUploading || isCreatingTopic || !selectedFile || (!selectedTopicId && !isNewTopic) || (isNewTopic && !newTopicName.trim())}
          >
            {isUploading ? (
              <>
                <span className="inline-block h-4 w-4 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('materials.uploading')}
              </>
            ) : isCreatingTopic ? t('materials.creatingTopic') : t('materials.uploadBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadFileModal; 