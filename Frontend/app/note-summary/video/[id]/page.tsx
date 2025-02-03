"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { PiArrowLeft, PiDownload, PiShare, PiThumbsUp, PiBookmark, PiChatText } from "react-icons/pi";

type VideoData = {
  id: string;
  title: string;
  topic: string;
  date: string;
  videoUrl: string;
  description: string;
  duration: string;
  likes: number;
  views: number;
  transcript: Array<{
    time: string;
    text: string;
  }>;
};

// Mock data - this would come from an API in a real implementation
const mockVideos: Record<string, VideoData> = {
  "1": {
    id: "1",
    title: "Calculus - Understanding Derivatives",
    topic: "Mathematics",
    date: "May 10, 2023",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Sample video
    description: "This video covers the fundamental concepts of derivatives in calculus. We explore the power rule, product rule, and chain rule with clear visual examples. Perfect for students struggling with calculus concepts.",
    duration: "8:24",
    likes: 342,
    views: 1245,
    transcript: [
      { time: "0:00", text: "Introduction to derivatives" },
      { time: "1:30", text: "The power rule explained" },
      { time: "3:45", text: "Product rule with examples" },
      { time: "5:20", text: "Chain rule demystified" },
      { time: "7:00", text: "Applications of derivatives in real world" }
    ],
  },
  "2": {
    id: "2",
    title: "Understanding Object-Oriented Programming",
    topic: "Computer Science",
    date: "May 5, 2023",
    videoUrl: "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", // Sample video
    description: "A comprehensive guide to object-oriented programming concepts. This video animation explains encapsulation, inheritance, polymorphism, and abstraction with practical examples in Python.",
    duration: "12:37",
    likes: 568,
    views: 2134,
    transcript: [
      { time: "0:00", text: "What is Object-Oriented Programming?" },
      { time: "2:15", text: "Encapsulation: Bundling data and methods" },
      { time: "4:30", text: "Inheritance: Reusing and extending code" },
      { time: "7:45", text: "Polymorphism: Many forms, one interface" },
      { time: "10:00", text: "Abstraction: Hiding complexity" }
    ],
  }
};

export default function VideoPage() {
  const params = useParams();
  const videoId = params?.id as string;
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [video, setVideo] = useState<VideoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState<'description'|'transcript'>('description');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // In a real implementation, this would be an API call
    setIsLoading(true);
    setTimeout(() => {
      setVideo(mockVideos[videoId] || null);
      setIsLoading(false);
    }, 500); // Simulate loading time
  }, [videoId]);

  // Handle video play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1070px] mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primaryColor border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-n300 dark:text-n400">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="w-full max-w-[1070px] mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-medium mb-4">Video not found</h2>
        <p className="text-n300 dark:text-n400 mb-6">The video you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-2 py-2 px-4 bg-primaryColor text-white rounded-xl"
        >
          <PiArrowLeft /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1070px] mx-auto p-4">
      <div className="flex items-center mb-4">
        <button 
          onClick={() => router.back()} 
          className="text-n400 dark:text-n300 hover:text-primaryColor flex items-center gap-1"
        >
          <PiArrowLeft /> Back
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-black rounded-xl overflow-hidden mb-4">
            <video 
              ref={videoRef}
              className="w-full h-auto aspect-video"
              src={video.videoUrl}
              controls
              poster="/poster-image.jpg" // You would need to create this
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-primaryColor/20 mb-6">
            <h1 className="text-xl font-semibold mb-2">{video.title}</h1>
            <div className="flex flex-wrap items-center text-sm text-n400 dark:text-n300 mb-4">
              <span className="mr-3">{video.topic}</span>
              <span className="mr-3">•</span>
              <span className="mr-3">{video.date}</span>
              <span className="mr-3">•</span>
              <span className="mr-3">{video.duration}</span>
              <span className="mr-3">•</span>
              <span>{video.views} views</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-3 pb-4 border-b border-primaryColor/10">
              <button 
                onClick={() => setIsLiked(!isLiked)} 
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-sm ${
                  isLiked 
                    ? "bg-primaryColor/10 text-primaryColor" 
                    : "border border-primaryColor/20 hover:bg-primaryColor/5"
                }`}
              >
                <PiThumbsUp /> {isLiked ? video.likes + 1 : video.likes}
              </button>
              <button 
                onClick={() => setIsBookmarked(!isBookmarked)}
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-sm ${
                  isBookmarked 
                    ? "bg-primaryColor/10 text-primaryColor" 
                    : "border border-primaryColor/20 hover:bg-primaryColor/5"
                }`}
              >
                <PiBookmark /> Save
              </button>
              <button className="flex items-center gap-1.5 py-1.5 px-3 border border-primaryColor/20 rounded-lg text-sm hover:bg-primaryColor/5">
                <PiShare /> Share
              </button>
              <button className="flex items-center gap-1.5 py-1.5 px-3 border border-primaryColor/20 rounded-lg text-sm hover:bg-primaryColor/5">
                <PiDownload /> Download
              </button>
            </div>
            
            <div className="mt-4">
              <div className="flex border-b border-primaryColor/10">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'description' 
                      ? 'text-primaryColor border-b-2 border-primaryColor' 
                      : 'text-n400 dark:text-n300'
                  }`}
                >
                  Description
                </button>
                <button 
                  onClick={() => setActiveTab('transcript')}
                  className={`py-2 px-4 text-sm font-medium ${
                    activeTab === 'transcript' 
                      ? 'text-primaryColor border-b-2 border-primaryColor' 
                      : 'text-n400 dark:text-n300'
                  }`}
                >
                  Transcript
                </button>
              </div>
              
              {activeTab === 'description' ? (
                <div className="py-4">
                  <p className="text-n700 dark:text-n200">
                    {video.description}
                  </p>
                </div>
              ) : (
                <div className="py-4">
                  <ul className="space-y-3">
                    {video.transcript.map((item, index) => (
                      <li key={index} className="flex">
                        <span className="w-16 text-n400 dark:text-n300 text-sm font-medium">
                          {item.time}
                        </span>
                        <span className="text-n700 dark:text-n200">
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="bg-white p-5 rounded-xl border border-primaryColor/20 mb-6">
              <h3 className="font-medium mb-4">Ask a Question</h3>
              <textarea 
                placeholder="Have a question about this video? Ask here and get AI-generated answers..."
                className="w-full py-2 px-4 rounded-xl border border-primaryColor/30 focus:outline-none focus:ring-2 focus:ring-primaryColor bg-transparent resize-none text-sm"
                rows={4}
              ></textarea>
              <button className="w-full mt-3 py-2 px-4 bg-primaryColor text-white rounded-xl flex items-center justify-center gap-1.5 text-sm">
                <PiChatText /> Ask AI Assistant
              </button>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-primaryColor/20">
              <h3 className="font-medium mb-4">Related Videos</h3>
              <div className="space-y-4">
                {Object.values(mockVideos)
                  .filter(v => v.id !== videoId)
                  .map((video) => (
                    <div 
                      key={video.id} 
                      className="flex gap-3 pb-3 border-b border-primaryColor/10 last:border-0 cursor-pointer"
                      onClick={() => router.push(`/note-summary/video/${video.id}`)}
                    >
                      <div className="relative w-24 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0">
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-8 border-l-primaryColor ml-0.5"></div>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium line-clamp-2">{video.title}</h4>
                        <p className="text-xs text-n400 dark:text-n300 mt-1">{video.duration} • {video.views} views</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 