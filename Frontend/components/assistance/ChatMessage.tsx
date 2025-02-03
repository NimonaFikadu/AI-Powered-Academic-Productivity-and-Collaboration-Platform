"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { PiRobot, PiCopy, PiCheck } from "react-icons/pi";
import logo from "@/public/images/favicon.png";
import { formatDistanceToNow } from 'date-fns';
import { Message } from "@/app/assistance/types";
import TextAnimation from "@/components/ui/TextAnimation";
import TypingAnimation from "@/components/ui/TypingAnimation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import 'katex/dist/katex.min.css';
import { useTranslation } from "react-i18next";

// Custom components for ReactMarkdown
const MarkdownComponents = {
  h1: (props: any) => <h1 className="text-xl font-semibold my-3" {...props} />,
  h2: (props: any) => <h2 className="text-lg font-semibold my-2" {...props} />,
  h3: (props: any) => <h3 className="text-base font-medium my-2" {...props} />,
  h4: (props: any) => <h4 className="text-sm font-medium my-1" {...props} />,
  p: (props: any) => <p className="my-2 leading-relaxed" {...props} />,
  ul: (props: any) => <ul className="list-disc list-inside my-2 ml-4" {...props} />,
  ol: (props: any) => <ol className="list-decimal list-inside my-2 ml-4" {...props} />,
  li: (props: any) => <li className="my-1" {...props} />,
  a: (props: any) => <a className="text-primaryColor hover:underline" {...props} />,
  blockquote: (props: any) => <blockquote className="border-l-4 border-primaryColor/30 pl-4 my-3 italic text-gray-600 dark:text-gray-300" {...props} />,
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || '');
    return !inline && match ? (
      <div className="my-3 overflow-auto rounded-md">
        <pre className={`${className} bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs`}>
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    ) : (
      <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs" {...props}>
        {children}
      </code>
    );
  },
  table: (props: any) => (
    <div className="overflow-x-auto my-4 rounded-md border border-gray-200 dark:border-gray-700">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
    </div>
  ),
  thead: (props: any) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
  th: (props: any) => <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider border-b border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />,
  tbody: (props: any) => <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" {...props} />,
  tr: (props: any) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-800" {...props} />,
  td: (props: any) => <td className="px-3 py-2 text-xs border-r border-gray-200 dark:border-gray-700 last:border-r-0" {...props} />,
};

interface ChatMessageProps {
  message: Message;
  isGreeting?: boolean;
  animated?: boolean;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isGreeting = false,
  animated = true 
}) => {
  const [copied, setCopied] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [renderedContent, setRenderedContent] = useState<string>('');
  const { t } = useTranslation();
  
  // Format the timestamp
  const formattedTime = message.timestamp 
    ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
    : '2 min ago';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Skip animation for user messages
  useEffect(() => {
    if (message.role === "user") {
      setIsAnimating(false);
    }
  }, [message.role]);
  
  // When animation completes, set the full content for markdown rendering
  useEffect(() => {
    if (!isAnimating) {
      setRenderedContent(message.content);
    }
  }, [isAnimating, message.content]);
  
  if (message.role === "user") {
    return (
      <div className="flex flex-col justify-end items-end gap-3">
        <p className="text-xs text-n100">{formattedTime}</p>
        <div className="text-sm bg-infoColor/10 py-3 px-5 border border-infoColor/20 rounded-xl shadow-sm max-w-full overflow-hidden">
          <p>{message.content}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex justify-start items-start gap-1 sm:gap-3 w-full max-w-[90%]">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primaryColor to-secondaryColor flex items-center justify-center flex-shrink-0">
        <Image src={logo} alt="UniHub Logo" width={20} height={20} className="object-cover" />
      </div>
      <div className="flex flex-col justify-start items-start gap-3 flex-1">
        <p className="text-xs text-n100">UniHub, {formattedTime}</p>
        <div className="text-sm bg-gradient-to-r from-primaryColor/5 to-transparent py-3 px-5 border border-primaryColor/20 rounded-xl shadow-sm w-full sm:max-w-[95%]">
          <div className="flex items-center gap-2 mb-2">
            <PiRobot className="text-primaryColor" />
            <span className="text-xs font-medium">{t('assistance.aiAssistant')}</span>
          </div>
          
          {isAnimating && animated ? (
            <div>
              <TextAnimation 
                text={message.content} 
                speed={3} 
                batchSize={8}
                onComplete={() => setIsAnimating(false)} 
              />
            </div>
          ) : (
            <div className="markdown-wrapper w-full overflow-hidden">
              <div className="prose prose-sm dark:prose-invert max-w-none overflow-x-auto break-words">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeHighlight, rehypeKatex]}
                  components={MarkdownComponents}
                >
                  {renderedContent}
                </ReactMarkdown>
              </div>
              <style jsx global>{`
                .markdown-wrapper table {
                  display: table;
                  width: 100%;
                  border-collapse: separate;
                  border-spacing: 0;
                  overflow-x: auto;
                  white-space: normal;
                }
                
                .markdown-wrapper td,
                .markdown-wrapper th {
                  word-break: normal;
                  white-space: nowrap;
                }
                
                .markdown-wrapper .math-inline {
                  display: inline-flex;
                  align-items: center;
                }
                
                .markdown-wrapper .math-display {
                  display: block;
                  overflow-x: auto;
                  max-width: 100%;
                }
              `}</style>
            </div>
          )}
        </div>
        {!isGreeting && !isAnimating && (
          <div className="flex justify-end items-center gap-2">
            <button onClick={handleCopy} className="cursor-pointer hover:text-primaryColor transition-colors p-1 rounded-full hover:bg-primaryColor/10">
              {copied ? <PiCheck className="text-green-500" /> : <PiCopy />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage; 