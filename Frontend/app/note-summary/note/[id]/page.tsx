"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import 'katex/dist/katex.min.css';
import { PiFileText, PiArrowLeft, PiDownload, PiShare, PiCopy, PiBookmark, PiTrash, PiSpinnerGap } from "react-icons/pi";
import { getNoteById, deleteNote, Note } from "../../noteSummaryService";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

// Custom components for ReactMarkdown
const MarkdownComponents = {
  h1: (props: any) => <h1 className="text-2xl font-semibold my-4" {...props} />,
  h2: (props: any) => <h2 className="text-xl font-semibold my-3" {...props} />,
  h3: (props: any) => <h3 className="text-lg font-medium my-3" {...props} />,
  h4: (props: any) => <h4 className="text-base font-medium my-2" {...props} />,
  p: (props: any) => <p className="my-3 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside my-3 ml-4" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside my-3 ml-4" {...props} />,
  li: (props: any) => <li className="my-1" {...props} />,
  a: (props: any) => <a className="text-primaryColor hover:underline" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-primaryColor/30 pl-4 my-4 italic text-gray-600 dark:text-gray-300" {...props} />,
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <div className="my-4 overflow-auto rounded-md">
        <pre className={`${className} bg-gray-100 dark:bg-gray-800 p-4 rounded-md`}>
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    );
  },
  table: (props: any) => <table className="min-w-full divide-y divide-gray-300 my-4" {...props} />,
  thead: (props: any) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
  th: (props: any) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" {...props} />,
  tbody: (props: any) => <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props} />,
  tr: (props: any) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-900" {...props} />,
  td: (props: any) => <td className="px-3 py-2 whitespace-nowrap text-sm" {...props} />,
};

export default function NotePage() {
  const params = useParams();
  const noteId = params?.id as string;
  const router = useRouter();
  const [note, setNote] = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setIsLoading(true);
        const noteData = await getNoteById(noteId);
        setNote(noteData);
      } catch (error) {
        console.error('[LOG note_detail] ========= Error fetching note:', error);
        toast.error(t('noteSummary.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  }, [noteId]);

  const handleDownload = () => {
    if (!note) return;
    
    // Create a Blob with the note content
    const blob = new Blob([note.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, '-').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    toast.success(t('noteSummary.downloadSuccess'));
  };

  const handleCopyToClipboard = () => {
    if (!note) return;
    
    navigator.clipboard.writeText(note.content)
      .then(() => toast.success(t('noteSummary.copySuccess')))
      .catch(() => toast.error(t('noteSummary.copyError')));
  };

  const handleDeleteNote = async () => {
    if (!note) return;
    
    try {
      setIsDeleting(true);
      await deleteNote(note.id);
      toast.success(t('noteSummary.deleteSuccess'));
      router.push('/note-summary');
    } catch (error) {
      console.error('[LOG note_detail] ========= Error deleting note:', error);
      toast.error(t('noteSummary.failedToDelete'));
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1070px] mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primaryColor border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-n300 dark:text-n400">{t('noteSummary.loadingNote')}</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="w-full max-w-[1070px] mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-medium mb-4">{t('noteSummary.noteNotFound')}</h2>
        <p className="text-n300 dark:text-n400 mb-6">{t('noteSummary.noteNotFoundDesc')}</p>
        <button 
          onClick={() => router.push('/note-summary')}
          className="flex items-center gap-2 py-2 px-4 bg-primaryColor text-white rounded-xl"
        >
          <PiArrowLeft /> {t('noteSummary.goBack')}
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1070px] mx-auto p-4">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => router.push('/note-summary')} 
          className="text-n400 dark:text-n300 hover:text-primaryColor flex items-center gap-1"
        >
          <PiArrowLeft /> {t('noteSummary.backToSummaries')}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 order-2 md:order-1">
          <div className="bg-white p-6 rounded-xl border border-primaryColor/20">
            <article className="prose prose-lg dark:prose-invert max-w-none">
              <ReactMarkdown 
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
                components={MarkdownComponents}
              >
                {note?.content || ''}
              </ReactMarkdown>
            </article>
          </div>
        </div>
        
        <div className="md:col-span-1 order-1 md:order-2">
          <div className="sticky top-4">
            <div className="bg-white p-5 rounded-xl border border-primaryColor/20 mb-6">
              <h1 className="text-xl font-semibold mb-2">{note?.title}</h1>
              <div className="flex items-center text-sm text-n400 dark:text-n300 mb-4">
                <span className="mr-3">{note?.topic || t('noteSummary.uncategorized')}</span>
                <span className="mr-3">•</span>
                <span>{note?.date}</span>
                <span className="mr-3">•</span>
                <span>{note?.readTime}</span>
              </div>
              
              {note.user_goal && (
                <div className="p-3 bg-primaryColor/5 rounded-lg mb-4 text-sm">
                  <p className="font-medium mb-1">{t('noteSummary.sessionGoal')}</p>
                  <p className="text-n500 dark:text-n300">{note.user_goal}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-3 mt-6">
                <button 
                  onClick={handleDownload}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 bg-primaryColor text-white rounded-xl font-medium text-sm"
                >
                  <PiDownload className="text-lg" /> {t('noteSummary.download')}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center justify-center gap-1.5 py-2 px-4 border border-red-500/50 text-red-500 rounded-xl text-sm hover:bg-red-500/5"
                >
                  <PiTrash className="text-lg" /> {t('noteSummary.delete')}
                </button>
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-primaryColor/20">
              <h3 className="font-medium mb-4">{t('noteSummary.actions')}</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleCopyToClipboard}
                  className="w-full flex items-center gap-2 p-3 text-sm border border-primaryColor/10 rounded-lg hover:bg-primaryColor/5"
                >
                  <PiCopy className="text-primaryColor" /> 
                  <span>{t('noteSummary.copyToClipboard')}</span>
                </button>
                <button 
                  onClick={() => router.push('/notes-materials')}
                  className="w-full flex items-center gap-2 p-3 text-sm border border-primaryColor/10 rounded-lg hover:bg-primaryColor/5"
                >
                  <PiBookmark className="text-primaryColor" /> 
                  <span>{t('noteSummary.viewAllNotes')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-xl p-6 relative animate-fade-in">
            <h3 className="text-xl font-semibold mb-3">{t('noteSummary.deleteNote')}</h3>
            <p className="text-n500 dark:text-n300 mb-5">
              {t('noteSummary.deleteConfirm')}
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="py-2 px-4 border border-primaryColor/20 text-n7000 rounded-lg"
                disabled={isDeleting}
              >
                {t('noteSummary.cancel')}
              </button>
              <button 
                onClick={handleDeleteNote}
                className="py-2 px-4 bg-red-500 text-white rounded-lg flex items-center gap-2"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <PiSpinnerGap className="animate-spin" />
                    <span>{t('noteSummary.deleting')}</span>
                  </>
                ) : (
                  <>
                    <PiTrash />
                    <span>{t('noteSummary.delete')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 