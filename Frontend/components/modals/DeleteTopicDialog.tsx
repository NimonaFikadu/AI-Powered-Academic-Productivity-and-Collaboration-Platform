"use client";
import React, { useState, useEffect } from "react";
import SmallButtons from "@/components/ui/buttons/SmallButtons";
import Alert from "@/components/ui/Alert";
import { topicsService } from "@/app/topics/topicsService";

interface DeleteTopicDialogProps {
  topicId: string;
  topicTitle: string;
  onClose: () => void;
  onDelete: () => void;
}

import { PiX, PiWarning } from "react-icons/pi";


function DeleteTopicDialog({
  topicId,
  topicTitle,
  onClose,
  onDelete
}: DeleteTopicDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDeleteTopic = async () => {
    if (!isClient) return;
    setIsLoading(true);

    try {
      await topicsService.deleteTopic(topicId);

      setAlert({
        message: "Topic deleted successfully!",
        type: 'success'
      });

      // Notify parent component
      onDelete();

      // Close the dialog after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error("[LOG delete_topic] ========= Error deleting topic:", error);
      setAlert({
        message: error instanceof Error ? error.message : "Failed to delete topic",
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Display a loading state while the component is being hydrated
  if (!isClient) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50">
      <div className="relative w-full max-w-[450px] bg-white dark:bg-n800 rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-errorColor">
            <PiWarning className="text-2xl" />
            <h2 className="text-xl font-medium">Delete Topic</h2>
          </div>
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

        <p className="mb-8 text-n400 dark:text-n200">
          Are you sure you want to delete the topic <span className="font-semibold text-n500 dark:text-n30">&quot;{topicTitle}&quot;</span>? This action cannot be undone and all associated materials will be lost.
        </p>

        <div className="flex justify-end items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-full border border-n200 dark:border-n600 hover:bg-n50 dark:hover:bg-n700 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteTopic}
            disabled={isLoading}
            className={`px-8 py-2 rounded-full bg-errorColor text-white hover:bg-errorColor/90 transition flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteTopicDialog; 