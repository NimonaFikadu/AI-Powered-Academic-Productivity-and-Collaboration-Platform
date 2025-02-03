import { IconType } from 'react-icons';
import { PiFilePdf, PiFileDoc, PiFileCsv, PiImage, PiFileText } from 'react-icons/pi';

export const getFileIconComponent = (fileType: string): IconType => {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return PiFilePdf;
    case 'docx':
      return PiFileDoc;
    case 'ppt':
      return PiFileCsv;
    case 'image':
      return PiImage;
    default:
      return PiFileText;
  }
};

export const getFileIconColorClass = (fileType: string): string => {
  switch (fileType.toLowerCase()) {
    case 'pdf':
      return 'text-errorColor';
    case 'docx':
      return 'text-primaryColor';
    case 'ppt':
      return 'text-successColor';
    case 'image':
      return 'text-secondaryColor';
    default:
      return 'text-n300';
  }
};

export const formatFileSize = (sizeInBytes: number): string => {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  } else if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  } else {
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
};

export const getFormattedDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }
}; 