"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
import { PiPaperPlaneRight, PiLightning, PiSparkle, PiRobot } from "react-icons/pi";
import TopicHeader from "@/components/assistance/TopicHeader";
import ChatMessage from "@/components/assistance/ChatMessage";
import TypingAnimation from "@/components/ui/TypingAnimation";
import AssistanceBackground from "@/components/ui/AssistanceBackground";
import PremiumGate from "@/components/ui/PremiumGate";
import { Message, ChatContext, SendMessageRequest } from "./types";
import { assistanceService, isAiUnstable } from "./assistanceService";
import { authService } from "../auth/authService";
import { topicsService } from "../topics/topicsService";
import Image from "next/image";
import logo from "@/public/images/favicon.png";
import { useTranslation } from "react-i18next";

// Loading fallback component
const AssistanceLoading = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center h-screen w-full">
      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primaryColor border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
      <p className="ml-2">{t('assistance.loading')}</p>
    </div>
  );
};

// Main component that uses useSearchParams
const AssistanceContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get("topic");
  const { t } = useTranslation();
  
  // Premium check — read from localStorage user object
  const [isPremium, setIsPremium] = useState<boolean>(true); // optimistic default
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topic, setTopic] = useState({ title: "", description: "", materialsCount: 0 });
  const [hasTopicSelected, setHasTopicSelected] = useState(false);
  
  const [chatContext, setChatContext] = useState<ChatContext>({
    topicId: "",
    topicTitle: "",
    messageHistory: []
  });
  
  // AI health awareness
  const [aiUnstable, setAiUnstable] = useState(false);
  // Keep last user message for retry
  const [lastUserMessage, setLastUserMessage] = useState<string>("");
  const [isLongLoading, setIsLongLoading] = useState(false);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Fetch topic details if topicId is provided
  useEffect(() => {
    // Check premium status from stored user object
    const user = authService.getUser();
    setIsPremium(user?.subscription_status === 'premium');

    const initialize = async () => {
      if (topicId) {
        try {
          const topicData = await topicsService.getTopic(topicId);
          const materialsCount = await assistanceService.getTopicMaterialsCount(topicId);
          
          // Update the topic information
          setTopic({
            title: topicData.title,
            description: topicData.description,
            materialsCount: materialsCount
          });
          
          setHasTopicSelected(true);
          
          // Initialize chat context with topic-specific greeting
          setChatContext({
            topicId: topicId,
            topicTitle: topicData.title,
            messageHistory: [
              {
                id: uuidv4(),
                role: "assistant",
                content: t('assistance.greetingTopic', { title: topicData.title }),
                timestamp: new Date()
              }
            ]
          });
        } catch (error) {
          console.error("[LOG assistance] ========= Error fetching topic details:", error);
          setError(t('assistance.errorGeneric'));
        }
      } else {
        // No topic selected, initialize with a general greeting
        setChatContext({
          topicId: "",
          topicTitle: "",
          messageHistory: [
            {
              id: uuidv4(),
              role: "assistant",
              content: t('assistance.greetingGeneral'),
              timestamp: new Date()
            }
          ]
        });
      }
      
      setIsFetching(false);
    };
    
    initialize();
  }, [topicId]);
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);
  
  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatContext.messageHistory]);
  
  const handleSendMessage = async (e: React.FormEvent, retryContent?: string) => {
    e.preventDefault();
    
    const msgContent = retryContent || message;
    if (!msgContent.trim() || isLoading) return;
    
    // Add user message to chat (only when not retrying an existing message)
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content: msgContent,
      timestamp: new Date()
    };
    
    if (!retryContent) {
      setChatContext(prev => ({
        ...prev,
        messageHistory: [...prev.messageHistory, userMessage]
      }));
      setLastUserMessage(msgContent);
    }
    
    setMessage("");
    setIsLoading(true);
    setIsLongLoading(false);
    setAiUnstable(false); // Optimistically clear while trying
    
    // Add 8s long loading message timer
    const loadingTimerId = setTimeout(() => setIsLongLoading(true), 8000);
    
    try {
      // Format previous messages for API - include only a reasonable history (last 10 messages)
      const previousMessages = chatContext.messageHistory
        .slice(-10)
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // Add the current message
      previousMessages.push({
        role: userMessage.role,
        content: userMessage.content
      });
      
      // Prepare the request object
      const requestData: SendMessageRequest = {
        message: userMessage.content,
        context: {
          previousMessages
        }
      };
      
      // Add topicId only if it exists
      if (topicId) {
        requestData.context.topicId = topicId;
      }
      
      // Send message to API
      const response = await assistanceService.sendMessage(requestData);
      
      // Add assistant response to chat
      const assistantMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: response.message,
        timestamp: response.timestamp
      };
      
      setChatContext(prev => ({
        ...prev,
        messageHistory: [...prev.messageHistory, assistantMessage]
      }));
      setAiUnstable(false);
      
    } catch (error: unknown) {
      console.error("[LOG assistance] ========= Error sending message:", error);
      
      const status = (error as { status?: number }).status;
      const errorClass = (error as { errorClass?: string }).errorClass;
      const isAiDown = status === 503 || status === 500 || isAiUnstable();
      const isPremiumRequired = status === 403;

      // Update AI health state
      if (isAiDown) setAiUnstable(true);

      // Show the right inline message
      let errorContent = error instanceof Error ? error.message : "Sorry, I encountered an error. Please try again.";
      if (isAiDown) {
        errorContent = "__AI_UNAVAILABLE__";
      } else if (isPremiumRequired) {
        errorContent = "__PREMIUM_REQUIRED__";
      } else if (errorClass === 'network') {
        errorContent = "__NETWORK_ERROR__";
      }

      const errorMessage: Message = {
        id: uuidv4(),
        role: "assistant",
        content: errorContent,
        timestamp: new Date()
      };
      
      setChatContext(prev => ({
        ...prev,
        messageHistory: [...prev.messageHistory, errorMessage]
      }));
      
    } finally {
      clearTimeout(loadingTimerId);
      setIsLoading(false);
      setIsLongLoading(false);
    }
  };

  const handleRetry = (e: React.MouseEvent) => {
    if (!lastUserMessage) return;
    // Re-send the last user message without re-appending a new user bubble
    handleSendMessage(e as unknown as React.FormEvent, lastUserMessage);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e as React.FormEvent);
    }
  };
  
  // Redirect to topics page to select a topic
  const handleSelectTopic = () => {
    router.push('/topics?from=assistance');
  };
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-3 bg-primaryColor text-white px-4 py-2 rounded"
          >
            {t('assistance.returnDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <PremiumGate isBlocked={!isPremium} featureName="AI Study Assistant">
      <div className="flex flex-col h-full w-full overflow-hidden">
      <AssistanceBackground />
      <div className="flex flex-col h-full flex-1 overflow-hidden w-full z-20 pt-4 px-4 sm:px-6 md:px-8 max-w-[1200px] mx-auto">
        {/* Topic Header - Only show if a topic is selected */}
        {hasTopicSelected && (
          <TopicHeader 
            title={topic.title} 
            materialsCount={topic.materialsCount}
            description={topic.description}
          />
        )}
        
        {/* Chat Container */}
        <div 
          className={`overflow-auto w-full flex-1 ${!hasTopicSelected ? 'pt-4' : ''}`} 
          ref={chatContainerRef}
        >
          <div className="pb-6 flex-grow w-full max-w-[1070px] mx-auto">
            {/* Topic Selection - Only show if no topic is selected */}
            {!hasTopicSelected && !isFetching && (
              <div className="bg-white p-5 rounded-xl border border-primaryColor/20 shadow-md mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-full bg-primaryColor/10">
                    <Image src={logo} alt="UniHub Logo" width={24} height={24} />
                  </div>
                  <h2 className="font-medium">{t('assistance.welcome')}</h2>
                </div>
                <p className="text-sm text-n300 mb-4">
                  {t('assistance.welcomeDesc')}
                </p>
                <button 
                  onClick={handleSelectTopic}
                  className="flex items-center gap-2 py-2 px-4 bg-primaryColor text-white rounded-lg text-sm"
                >
                  <PiLightning />
                  <span>{t('assistance.selectTopic')}</span>
                </button>
              </div>
            )}
            
            <div className="flex gap-3 relative z-20 w-full flex-col">
              {isFetching ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </div>
              ) : (
                chatContext.messageHistory.map((msg, index) => (
                  <div className="flex flex-col gap-3" key={msg.id}>
                    {/* Special sentinel messages render as rich UI states */}
                    {msg.role === "assistant" && msg.content === "__AI_UNAVAILABLE__" ? (
                      <div className="flex justify-start items-start gap-1 sm:gap-3 w-full max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primaryColor to-secondaryColor flex items-center justify-center flex-shrink-0">
                          <Image src={logo} alt="UniHub Logo" width={20} height={20} className="object-cover" />
                        </div>
                        <div className="flex flex-col justify-start items-start gap-2">
                          <p className="text-xs text-n100">{t('assistance.justNow')}</p>
                          <div className="text-sm bg-amber-50 border border-amber-300 text-amber-800 py-3 px-4 rounded-xl flex flex-col gap-2">
                            <p className="font-medium">{t('assistance.aiUnavailable')}</p>
                            <button
                              onClick={handleRetry}
                              disabled={isLoading}
                              className="self-start text-xs bg-primaryColor text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {isLoading ? t('assistance.retrying') : t('assistance.retry')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : msg.role === "assistant" && msg.content === "__NETWORK_ERROR__" ? (
                      <div className="flex justify-start items-start gap-1 sm:gap-3 w-full max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primaryColor to-secondaryColor flex items-center justify-center flex-shrink-0">
                          <Image src={logo} alt="UniHub Logo" width={20} height={20} className="object-cover" />
                        </div>
                        <div className="flex flex-col justify-start items-start gap-2">
                          <p className="text-xs text-n100">{t('assistance.justNow')}</p>
                          <div className="text-sm bg-amber-50 border border-amber-300 text-amber-800 py-3 px-4 rounded-xl flex flex-col gap-2">
                            <p className="font-medium">{t('assistance.networkError')}</p>
                            <button
                              onClick={handleRetry}
                              disabled={isLoading}
                              className="self-start text-xs bg-primaryColor text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {isLoading ? t('assistance.retrying') : t('assistance.retry')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : msg.role === "assistant" && msg.content === "__PREMIUM_REQUIRED__" ? (
                      <div className="flex justify-start items-start gap-1 sm:gap-3 w-full max-w-[90%]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primaryColor to-secondaryColor flex items-center justify-center flex-shrink-0">
                          <Image src={logo} alt="UniHub Logo" width={20} height={20} className="object-cover" />
                        </div>
                        <div className="flex flex-col justify-start items-start gap-2">
                          <p className="text-xs text-n100">{t('assistance.justNow')}</p>
                          <div className="text-sm bg-purple-50 border border-purple-300 text-purple-800 py-3 px-4 rounded-xl flex flex-col gap-2">
                            <p className="font-medium">{t('assistance.premiumRequired')}</p>
                            <button
                              onClick={() => router.push('/upgrade-plan')}
                              className="self-start text-xs bg-gradient-to-r from-primaryColor to-secondaryColor text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity"
                            >
                              {t('assistance.upgradePremium')}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <ChatMessage 
                        message={msg} 
                        isGreeting={index === 0} 
                        animated={msg.role === 'assistant' && index === chatContext.messageHistory.length - 1}
                      />
                    )}
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start items-start gap-1 sm:gap-3 w-full max-w-[90%]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primaryColor to-secondaryColor flex items-center justify-center flex-shrink-0">
                    <Image src={logo} alt="UniHub Logo" width={20} height={20} className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-start items-start gap-3 flex-1">
                    <p className="text-xs text-n100">{t('assistance.justNow')}</p>
                    <div className="text-sm bg-gradient-to-r from-primaryColor/5 to-transparent py-3 px-5 border border-primaryColor/20 rounded-xl flex flex-col gap-1">
                      <div className="flex items-center">
                        <div className="flex items-center gap-2 mr-3">
                          <PiRobot className="text-primaryColor" />
                          <span className="text-xs font-medium">{t('assistance.aiAssistant')}</span>
                        </div>
                        <TypingAnimation />
                      </div>
                      {isLongLoading && (
                        <p className="text-xs text-n300 mt-1 italic animate-pulse">
                          {t('assistance.stillGenerating')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Input */}
        <div className="w-full max-w-[1070px] mx-auto pt-2 pb-4">
          {/* AI Health Warning Banner */}
          {aiUnstable && (
            <div className="mb-2 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <span>⚠️</span>
              <span>{t('assistance.aiUnstableBanner').split('⚠️')[1]}</span>
            </div>
          )}
          <form
            onSubmit={handleSendMessage}
            className="relative w-full"
          >
            <div className="w-full bg-white rounded-xl shadow-md border border-primaryColor/20 backdrop-blur-sm p-2">
              <textarea
                ref={textareaRef}
                className="w-full outline-none p-3 bg-transparent resize-none overflow-hidden min-h-[48px] max-h-[200px] text-sm"
                placeholder={isLoading ? t('assistance.waitingResponse') : aiUnstable ? t('assistance.aiUnstablePlaceholder') : t('assistance.messagePlaceholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading || isFetching || aiUnstable}
              />
              
              <div className="flex justify-between items-center px-3">
                <div className="text-xs text-n300">
                  <span className="flex items-center gap-1">
                    <PiSparkle className="text-primaryColor" />
                    {t('assistance.poweredBy')}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading || isFetching || aiUnstable}
                  className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                    message.trim() && !isLoading && !isFetching && !aiUnstable
                      ? 'bg-gradient-to-r from-primaryColor to-secondaryColor text-white shadow-sm' 
                      : 'bg-primaryColor/20 text-primaryColor/50'
                  }`}
                >
                  <PiPaperPlaneRight />
                </button>
              </div>
            </div>
          </form>
        </div>
        </div>
      </div>
    </PremiumGate>
  );
};

// Wrap the component that uses useSearchParams in Suspense
const Assistance = () => {
  return (
    <Suspense fallback={<AssistanceLoading />}>
      <AssistanceContent />
    </Suspense>
  );
};

export default Assistance; 