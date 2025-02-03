"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  PiNote, 
  PiSpeakerHigh,
  PiVideoCameraFill,
  PiCheck,
  PiArrowRight,
  PiListChecks,
  PiChatCircleText,
  PiClockCountdown,
  PiFileText,
  PiSpinnerGap
} from "react-icons/pi";
import Select from "react-select";
import ComingSoonModal from "./ComingSoonModal";
import PremiumGate from "@/components/ui/PremiumGate";
import { getAllTopics, getAllNotes, createNoteWithRAG } from "./noteSummaryService";
import { Topic, Note } from "./noteSummaryService";
import { authService } from "../auth/authService";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const NoteSummarization = () => {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>("written");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>("");
  const [mediaLength, setMediaLength] = useState<string>("5 minutes");
  const [goals, setGoals] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [topics, setTopics] = useState<{value: string, label: string}[]>([]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isComingSoonModalOpen, setIsComingSoonModalOpen] = useState<boolean>(false);
  const [comingSoonFeatureType, setComingSoonFeatureType] = useState<string>("");
  // Premium check — resolved from stored user object
  const [isPremium, setIsPremium] = useState<boolean>(true); // optimistic default
  // AI error state for retry UI
   const [aiError, setAiError] = useState<string | null>(null);
  const [isLongLoading, setIsLongLoading] = useState(false);
  const { t } = useTranslation();
  
  // Fetch topics and recent notes on component mount
  useEffect(() => {
    // Check premium status from stored user object
    const user = authService.getUser();
    setIsPremium(user?.subscription_status === 'premium');

    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch topics
        const topicsData = await getAllTopics();
        const formattedTopics = topicsData.map(topic => ({
          value: topic.id,
          label: topic.title
        }));
        setTopics(formattedTopics);
        
        // Fetch recent notes
        const notesData = await getAllNotes(1, 3);
        setRecentNotes(notesData.notes);
      } catch (error) {
        console.error('[LOG note_summary] ========= Error fetching initial data:', error);
        toast.error(t('noteSummary.failedToLoad'));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Types of summaries
  const summaryTypes = [
    { id: "written", name: t('noteSummary.writtenNote'), icon: <PiNote size={24} /> },
    { id: "audio", name: t('noteSummary.audioExplanation'), icon: <PiSpeakerHigh size={24} /> },
    { id: "video", name: t('noteSummary.videoAnimation'), icon: <PiVideoCameraFill size={24} /> },
  ];
  
  // Handle type selection
  const handleTypeSelect = (type: string) => {
    if (type === "audio" || type === "video") {
      setComingSoonFeatureType(type);
      setIsComingSoonModalOpen(true);
    } else {
      setSelectedType(type);
    }
  };
  
  // Handle topic change
  const handleTopicChange = (option: any) => {
    if (option) {
      setSelectedTopic(option.value);
      setSelectedTopicTitle(option.label);
    } else {
      setSelectedTopic("");
      setSelectedTopicTitle("");
    }
  };
  
  // Create summary
  const handleCreateSummary = async () => {
    if (!title.trim()) {
      toast.error(t('noteSummary.titleLabel') + ' ' + (t('common.required') || 'required'));
      return;
    }
    
    if (!goals.trim()) {
      toast.error(t('noteSummary.sessionGoals') + ' ' + (t('common.required') || 'required'));
      return;
    }
    
    setIsCreating(true);
    setAiError(null);
    setIsLongLoading(false);
    
    // Add 8s long loading message timer
    const loadingTimerId = setTimeout(() => setIsLongLoading(true), 8000);
    
    try {
      const noteData = {
        title: title,
        userGoal: goals,
        topicId: selectedTopic || null,
        isPrivate: true
      };
      
      const response = await createNoteWithRAG(noteData);
      
      if (response.note.id) {
        toast.success(t('noteSummary.noteCreatedSuccess'));
        router.push(`/note-summary/note/${response.note.id}`);
      } else {
        // Backend sent a 202 Processing response (generation takes >30s)
        toast.success(t('noteSummary.noteTakingLonger'), { duration: 6000 });
        router.push('/notes-materials');
      }
    } catch (error: unknown) {
      console.error('[LOG note_summary] ========= Error creating note:', error);
      const status = (error as { status?: number }).status;
      const errorClass = (error as { errorClass?: string }).errorClass;

      if (status === 403) {
        // Not a premium user
        toast.custom((toastItem) => (
          <div className={`${
            toastItem.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4 gap-3`}>
            <span className="text-xl">🔒</span>
            <div className="flex-1">
              <p className="font-medium text-sm">{t('noteSummary.premiumRequired')}</p>
              <p className="text-xs text-gray-500 mt-1">{t('noteSummary.premiumRequiredDesc')}</p>
              <button
                onClick={() => { toast.dismiss(toastItem.id); router.push('/upgrade-plan'); }}
                className="mt-2 text-xs bg-gradient-to-r from-primaryColor to-secondaryColor text-white px-3 py-1 rounded-lg"
              >
                {t('noteSummary.upgradeToPremium')}
              </button>
            </div>
          </div>
        ), { duration: 6000 });
      } else if (errorClass === 'network') {
        setAiError(t('noteSummary.networkError'));
      } else if (status === 503 || status === 504 || errorClass === 'ai_down') {
        // AI provider failure
        setAiError(t('noteSummary.aiUnavailable'));
      } else {
        toast.error(t('noteSummary.failedToCreate'));
      }
    } finally {
      clearTimeout(loadingTimerId);
      setIsCreating(false);
      setIsLongLoading(false);
    }
  };

  return (
    <PremiumGate isBlocked={!isPremium} featureName={t('noteSummary.title')}>
      <div className="w-full max-w-[1070px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <PiFileText className="text-primaryColor" />
          {t('noteSummary.title')}
        </h1>
        <button 
          onClick={() => router.push('/notes-materials')}
          className="bg-primaryColor text-white py-2 px-4 rounded-xl flex items-center gap-1">
          <PiFileText />
          <span>{t('noteSummary.myNotesBtn')}</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white p-5 rounded-xl border border-primaryColor/20 mb-6">
            <h3 className="font-medium mb-5">{t('noteSummary.createSummaryTitle')}</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">{t('noteSummary.selectTypeLabel')}</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {summaryTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => handleTypeSelect(type.id)}
                      className={`flex items-center gap-2 p-3 rounded-xl border ${
                        selectedType === type.id
                          ? "border-primaryColor bg-primaryColor/5 text-primaryColor"
                          : "border-primaryColor/20 hover:border-primaryColor/40"
                      }`}
                    >
                      <span className="text-primaryColor">{type.icon}</span>
                      <span className="text-sm">{type.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('noteSummary.titleLabel')}</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t('noteSummary.titlePlaceholder')}
                  className="w-full py-2 px-4 rounded-xl border border-primaryColor/30 focus:outline-none focus:ring-2 focus:ring-primaryColor bg-transparent"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t('noteSummary.selectTopicLabel')}</label>
                  <Select
                    options={topics}
                    placeholder={t('noteSummary.selectTopicPlaceholder')}
                    onChange={handleTopicChange}
                    isLoading={isLoading}
                    isClearable
                    className="rounded-xl"
                    classNames={{
                      control: () => "border border-primaryColor/30 rounded-xl bg-transparent py-1.5 px-3",
                      menu: () => "bg-white shadow-lg rounded-lg",
                      option: ({ isFocused, isSelected }) =>
                        `${
                          isSelected
                            ? "bg-primaryColor/20 text-n700 dark:text-white"
                            : ""
                        } ${
                          isFocused ? "bg-primaryColor/10 text-n700 dark:text-white" : ""
                        } text-sm py-2`,
                    }}
                  />
                </div>
                
                {(selectedType === "video" || selectedType === "audio") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      {selectedType === "video" ? t('noteSummary.videoLength') : t('noteSummary.audioLength')}
                    </label>
                    <select 
                      value={mediaLength}
                      onChange={(e) => setMediaLength(e.target.value)}
                      className="w-full py-2 px-4 rounded-xl border border-primaryColor/30 focus:outline-none focus:ring-2 focus:ring-primaryColor bg-transparent"
                    >
                      <option value="3 minutes">3 minutes</option>
                      <option value="5 minutes">5 minutes</option>
                      <option value="10 minutes">10 minutes</option>
                      <option value="15 minutes">15 minutes</option>
                      <option value="20 minutes">20 minutes</option>
                    </select>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">{t('noteSummary.sessionGoals')}</label>
                <textarea
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder={t('noteSummary.goalsPlaceholder')}
                  rows={4}
                  className="w-full py-2 px-4 rounded-xl border border-primaryColor/30 focus:outline-none focus:ring-2 focus:ring-primaryColor bg-transparent resize-none"
                ></textarea>
              </div>
              
              <div className="flex justify-between items-center text-sm border-t border-primaryColor/10 pt-4 mt-6">
                <span className="text-n300 dark:text-n400">{t('noteSummary.generatingNoteTime')}</span>
                <div className="flex flex-col items-end gap-2">
                  {/* AI error state with retry */}
                  {aiError && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-1">
                      <span>⚠️</span>
                      <span>{aiError}</span>
                      <button
                         disabled={isCreating || !title.trim() || !goals.trim()}
                        className="ml-1 text-xs bg-primaryColor text-white px-2 py-0.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isCreating ? t('common.retrying') || 'Retrying...' : '↺ ' + (t('common.retry') || 'Retry')}
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={handleCreateSummary}
                    disabled={isCreating || !title.trim() || !goals.trim()}
                    className={`py-2 px-6 bg-primaryColor text-white rounded-xl font-medium flex items-center justify-center gap-2 ${
                      isCreating || !title.trim() || !goals.trim() ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isCreating ? (
                      <>
                        <PiSpinnerGap className="animate-spin" />
                        <span>{t('noteSummary.generating')}</span>
                      </>
                    ) : (
                      <span>{t('noteSummary.createSummaryBtn')}</span>
                    )}
                  </button>
                  {isLongLoading && (
                    <span className="text-xs text-n300 mt-1 italic animate-pulse text-right">
                      {t('noteSummary.stillGenerating')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-primaryColor/5 p-5 rounded-xl border border-primaryColor/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{t('noteSummary.featuresTitle')}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
                <div className="mb-3 text-primaryColor">
                  <PiNote size={24} />
                </div>
                <h4 className="font-medium mb-1">{t('noteSummary.writtenNote')}</h4>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('noteSummary.writtenNotesDesc')}
                </p>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
                <div className="mb-3 text-primaryColor">
                  <PiSpeakerHigh size={24} />
                </div>
                <h4 className="font-medium mb-1">{t('noteSummary.audioExplanation')}</h4>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('noteSummary.audioExplDesc')}
                </p>
                <span className="inline-block mt-2 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                  {t('noteSummary.comingSoon')}
                </span>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-primaryColor/20">
                <div className="mb-3 text-primaryColor">
                  <PiVideoCameraFill size={24} />
                </div>
                <h4 className="font-medium mb-1">{t('noteSummary.videoAnimation')}</h4>
                <p className="text-sm text-n300 dark:text-n400">
                  {t('noteSummary.videoAnimDesc')}
                </p>
                <span className="inline-block mt-2 text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                  {t('noteSummary.comingSoon')}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-primaryColor/20 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">{t('noteSummary.recentSummaries')}</h3>
              {!isLoading && (
                <span className="text-xs bg-primaryColor/10 text-primaryColor px-2 py-1 rounded-full">
                  {recentNotes.length} {t('noteSummary.created')}
                </span>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <PiSpinnerGap className="animate-spin text-primaryColor" size={24} />
              </div>
            ) : recentNotes.length > 0 ? (
              <div className="space-y-4">
                {recentNotes.map((note) => (
                  <div 
                    key={note.id} 
                    className="border border-primaryColor/20 rounded-xl p-4 bg-primaryColor/5 cursor-pointer hover:border-primaryColor/40 transition-colors"
                    onClick={() => router.push(`/note-summary/note/${note.id}`)}
                  >
                    <div className="flex items-center gap-2 text-primaryColor font-medium mb-2">
                      <PiNote />
                      <span className="truncate">{note.title}</span>
                    </div>
                    <div className="text-sm text-n300 dark:text-n400 mb-3">
                      {note.date} • {note.topic || t('noteSummary.uncategorized')}
                    </div>
                    <div className="flex justify-end">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          router.push(`/note-summary/note/${note.id}`)
                        }} 
                        className="text-xs text-primaryColor hover:underline flex items-center gap-1"
                      >
                        {t('noteSummary.viewSummary')} <PiArrowRight />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-primaryColor/20 rounded-xl">
                <p className="text-n300 dark:text-n400 mb-2">{t('noteSummary.noSummaries')}</p>
                <p className="text-sm">{t('noteSummary.createFirstSummary')}</p>
              </div>
            )}
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-primaryColor/20">
            <h3 className="font-medium mb-4">{t('noteSummary.popularTopics')}</h3>
            
            <div className="space-y-3">
              {!isLoading && topics.slice(0, 4).map((topic, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 border border-primaryColor/10 rounded-lg hover:bg-primaryColor/5 cursor-pointer"
                    onClick={() => handleTopicChange(topic)}
                  >
                    <span className="text-sm">{topic.label}</span>
                    <span className="text-xs bg-primaryColor/10 text-primaryColor px-2 py-0.5 rounded-full">
                      {t('common.select') || 'Select'}
                    </span>
                  </div>
                ))}
              
              {!isLoading && topics.length > 0 && (
                <button 
                  onClick={() => router.push('/topics')}
                  className="w-full text-sm text-primaryColor py-2 border border-primaryColor/20 rounded-lg mt-2 hover:bg-primaryColor/5"
                >
                  {t('noteSummary.viewAllTopics')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Coming Soon Modal */}
      <ComingSoonModal 
        isOpen={isComingSoonModalOpen}
        onClose={() => setIsComingSoonModalOpen(false)}
        featureType={comingSoonFeatureType}
      />
    </div>
    </PremiumGate>
  );
};

export default NoteSummarization; 