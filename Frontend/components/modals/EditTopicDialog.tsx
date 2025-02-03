"use client";
import React, { useRef, useEffect } from "react";
import EditTopicModal from "./EditTopic";
import { Topic } from "@/app/topics/topicsService";
import { PiX } from "react-icons/pi";

interface EditTopicDialogProps {
  topic: Topic;
  isOpen: boolean;
  onClose: () => void;
  onTopicUpdated: () => void;
}

const EditTopicDialog: React.FC<EditTopicDialogProps> = ({
  topic,
  isOpen,
  onClose,
  onTopicUpdated
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div 
        ref={dialogRef}
        className="bg-white rounded-xl w-full max-w-md p-6 relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-n300 dark:hover:text-white"
        >
          <PiX className="text-xl" />
        </button>
        
        <EditTopicModal 
          topic={topic} 
          onClose={onClose} 
          onTopicUpdated={onTopicUpdated} 
        />
      </div>
    </div>
  );
};

export default EditTopicDialog; 