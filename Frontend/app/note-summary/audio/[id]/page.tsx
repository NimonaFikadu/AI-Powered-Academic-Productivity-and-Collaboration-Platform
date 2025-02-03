"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  PiArrowLeft, 
  PiDownload, 
  PiShare, 
  PiThumbsUp, 
  PiBookmark, 
  PiWaveform, 
  PiSpeakerHigh, 
  PiPlayCircle, 
  PiPauseCircle,
  PiSkipBackCircle,
  PiSkipForwardCircle,
  PiChatText
} from "react-icons/pi";

type AudioData = {
  id: string;
  title: string;
  topic: string;
  date: string;
  audioUrl: string;
  description: string;
  duration: string;
  likes: number;
  listens: number;
  chapters: {
    time: string;
    title: string;
  }[];
};

// Mock data - this would come from an API in a real implementation
const mockAudios: Record<string, AudioData> = {
  "1": {
    id: "1",
    title: "Calculus - Understanding Derivatives",
    topic: "Mathematics",
    date: "May 10, 2023",
    audioUrl: "https://file-examples.com/storage/febc49ada864bafa2710317/2017/11/file_example_MP3_1MG.mp3", // Sample audio
    description: "This audio explanation covers the fundamental concepts of derivatives in calculus. We explore the power rule, product rule, and chain rule with step-by-step explanations. Perfect for students looking to grasp calculus concepts through auditory learning.",
    duration: "8:24",
    likes: 215,
    listens: 876,
    chapters: [
      { time: "0:00", title: "Introduction to derivatives" },
      { time: "1:30", title: "The power rule explained" },
      { time: "3:45", title: "Product rule with examples" },
      { time: "5:20", title: "Chain rule demystified" },
      { time: "7:00", title: "Applications of derivatives" }
    ],
  },
  "2": {
    id: "2",
    title: "Understanding Object-Oriented Programming",
    topic: "Computer Science",
    date: "May 5, 2023",
    audioUrl: "https://file-examples.com/storage/febc49ada864bafa2710317/2017/11/file_example_MP3_1MG.mp3", // Sample audio
    description: "A comprehensive audio guide to object-oriented programming concepts. This explanation covers encapsulation, inheritance, polymorphism, and abstraction with practical examples and clear explanations.",
    duration: "12:37",
    likes: 342,
    listens: 1245,
    chapters: [
      { time: "0:00", title: "What is Object-Oriented Programming?" },
      { time: "2:15", title: "Encapsulation: Bundling data and methods" },
      { time: "4:30", title: "Inheritance: Reusing and extending code" },
      { time: "7:45", title: "Polymorphism: Many forms, one interface" },
      { time: "10:00", title: "Abstraction: Hiding complexity" }
    ],
  },
  "3": {
    id: "3",
    title: "Renaissance Period - Key Figures and Contributions",
    topic: "History",
    date: "April 28, 2023",
    audioUrl: "https://file-examples.com/storage/febc49ada864bafa2710317/2017/11/file_example_MP3_1MG.mp3", // Sample audio
    description: "An audio journey through the Renaissance period, exploring the lives and contributions of key figures like Leonardo da Vinci, Michelangelo, and Raphael. Perfect for history students wanting to understand the cultural and artistic developments of this important era.",
    duration: "15:42",
    likes: 186,
    listens: 742,
    chapters: [
      { time: "0:00", title: "Introduction to the Renaissance" },
      { time: "2:30", title: "Early Renaissance and Humanism" },
      { time: "5:15", title: "Leonardo da Vinci: The Universal Genius" },
      { time: "8:20", title: "Michelangelo: Sculpture and Painting" },
      { time: "11:00", title: "Raphael and the High Renaissance" },
      { time: "13:45", title: "Legacy of the Renaissance Period" }
    ],
  }
};

export default function AudioPage() {
  const params = useParams();
  const audioId = params?.id as string;
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [audio, setAudio] = useState<AudioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeChapter, setActiveChapter] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    // In a real implementation, this would be an API call
    setIsLoading(true);
    setTimeout(() => {
      setAudio(mockAudios[audioId] || null);
      setIsLoading(false);
    }, 500); // Simulate loading time
  }, [audioId]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    const updateTime = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
    };
    
    const updateDuration = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration);
      }
    };
    
    const updateChapter = () => {
      if (!audio || !audioRef.current) return;
      
      const currentTimeInSeconds = audioRef.current.currentTime;
      // Find the active chapter based on current time
      // This is simplified - in a real app you'd convert the time strings to seconds
      const chapterIndex = audio.chapters.findIndex((chapter, index, arr) => {
        const chapterTime = convertTimeToSeconds(chapter.time);
        const nextChapterTime = index < arr.length - 1 
          ? convertTimeToSeconds(arr[index + 1].time) 
          : Infinity;
        
        return currentTimeInSeconds >= chapterTime && currentTimeInSeconds < nextChapterTime;
      });
      
      if (chapterIndex !== -1) {
        setActiveChapter(chapterIndex);
      }
    };
    
    const handlePlayPause = () => {
      setIsPlaying(!audioRef.current?.paused);
    };
    
    audioRef.current.addEventListener('timeupdate', updateTime);
    audioRef.current.addEventListener('timeupdate', updateChapter);
    audioRef.current.addEventListener('durationchange', updateDuration);
    audioRef.current.addEventListener('play', handlePlayPause);
    audioRef.current.addEventListener('pause', handlePlayPause);
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', updateTime);
        audioRef.current.removeEventListener('timeupdate', updateChapter);
        audioRef.current.removeEventListener('durationchange', updateDuration);
        audioRef.current.removeEventListener('play', handlePlayPause);
        audioRef.current.removeEventListener('pause', handlePlayPause);
      }
    };
  }, [audio]);
  
  // Convert time string (e.g., "1:30") to seconds
  const convertTimeToSeconds = (timeString: string): number => {
    const [minutes, seconds] = timeString.split(':').map(Number);
    return minutes * 60 + seconds;
  };
  
  // Format seconds to time string (e.g., 90 -> "1:30")
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Play/pause toggle
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };
  
  // Skip backward 10 seconds
  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
    }
  };
  
  // Skip forward 30 seconds
  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration, 
        audioRef.current.currentTime + 30
      );
    }
  };
  
  // Handle seek on progress bar
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const seekTime = parseFloat(e.target.value);
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };
  
  // Change volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };
  
  // Jump to specific chapter
  const jumpToChapter = (time: string) => {
    if (audioRef.current) {
      audioRef.current.currentTime = convertTimeToSeconds(time);
      if (!isPlaying) {
        audioRef.current.play();
      }
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1070px] mx-auto p-4 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primaryColor border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-2 text-n300 dark:text-n400">Loading audio...</p>
        </div>
      </div>
    );
  }

  if (!audio) {
    return (
      <div className="w-full max-w-[1070px] mx-auto p-4 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-medium mb-4">Audio not found</h2>
        <p className="text-n300 dark:text-n400 mb-6">The audio explanation you're looking for doesn't exist or has been removed.</p>
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
          <div className="bg-white p-5 rounded-xl border border-primaryColor/20 mb-6">
            <audio 
              ref={audioRef} 
              src={audio.audioUrl} 
              className="hidden"
              onEnded={() => setIsPlaying(false)}
            />
            
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-primaryColor/10 rounded-xl flex items-center justify-center text-primaryColor mr-4">
                <PiSpeakerHigh size={32} />
              </div>
              <div className="flex-1">
                <h1 className="text-xl font-semibold mb-1">{audio.title}</h1>
                <div className="flex flex-wrap items-center text-sm text-n400 dark:text-n300">
                  <span className="mr-3">{audio.topic}</span>
                  <span className="mr-3">•</span>
                  <span className="mr-3">{audio.date}</span>
                  <span className="mr-3">•</span>
                  <span>{audio.listens} listens</span>
                </div>
              </div>
            </div>
            
            {/* Waveform visualization (mock) */}
            <div className="h-20 mb-2 bg-primaryColor/5 rounded-lg relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-around">
                {Array.from({ length: 100 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="w-0.5 bg-primaryColor/30 rounded-full"
                    style={{ 
                      height: `${10 + Math.sin(i * 0.2) * 20 + Math.random() * 25}px`,
                      opacity: currentTime / duration > i / 100 ? 1 : 0.3
                    }}
                  ></div>
                ))}
              </div>
            </div>
            
            {/* Audio player controls */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-n400 dark:text-n300">{formatTime(currentTime)}</span>
                <span className="text-xs text-n400 dark:text-n300">{formatTime(duration)}</span>
              </div>
              
              <input 
                type="range" 
                min="0" 
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-primaryColor/20 rounded-lg appearance-none cursor-pointer accent-primaryColor"
              />
              
              <div className="flex items-center justify-center gap-4 mt-4">
                <button 
                  onClick={skipBackward}
                  className="text-n600 dark:text-n200 hover:text-primaryColor"
                >
                  <PiSkipBackCircle size={36} />
                </button>
                
                <button 
                  onClick={togglePlayPause}
                  className="text-primaryColor hover:text-primaryColor/80"
                >
                  {isPlaying ? <PiPauseCircle size={56} /> : <PiPlayCircle size={56} />}
                </button>
                
                <button 
                  onClick={skipForward}
                  className="text-n600 dark:text-n200 hover:text-primaryColor"
                >
                  <PiSkipForwardCircle size={36} />
                </button>
              </div>
              
              <div className="flex items-center mt-4">
                <PiSpeakerHigh className="text-n500 dark:text-n300 mr-2" />
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1.5 bg-primaryColor/20 rounded-lg appearance-none cursor-pointer accent-primaryColor"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-6 pb-4 border-b border-primaryColor/10">
              <button 
                onClick={() => setIsLiked(!isLiked)} 
                className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-sm ${
                  isLiked 
                    ? "bg-primaryColor/10 text-primaryColor" 
                    : "border border-primaryColor/20 hover:bg-primaryColor/5"
                }`}
              >
                <PiThumbsUp /> {isLiked ? audio.likes + 1 : audio.likes}
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
            
            <div className="mt-6">
              <h3 className="font-medium mb-3">Description</h3>
              <p className="text-n700 dark:text-n200 text-sm leading-relaxed">
                {audio.description}
              </p>
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-3">Chapters</h3>
              <div className="space-y-2">
                {audio.chapters.map((chapter, index) => (
                  <div 
                    key={index} 
                    onClick={() => jumpToChapter(chapter.time)}
                    className={`flex items-center p-3 rounded-lg cursor-pointer ${
                      activeChapter === index 
                        ? 'bg-primaryColor/10 text-primaryColor' 
                        : 'hover:bg-primaryColor/5'
                    }`}
                  >
                    <span className="w-12 text-sm font-medium">{chapter.time}</span>
                    <span className="flex-1">{chapter.title}</span>
                    {activeChapter === index && (
                      <div className="w-1.5 h-1.5 rounded-full bg-primaryColor animate-pulse"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <div className="bg-white p-5 rounded-xl border border-primaryColor/20 mb-6">
              <h3 className="font-medium mb-4">Ask a Question</h3>
              <textarea 
                placeholder="Have a question about this explanation? Ask here and get AI-generated answers..."
                className="w-full py-2 px-4 rounded-xl border border-primaryColor/30 focus:outline-none focus:ring-2 focus:ring-primaryColor bg-transparent resize-none text-sm"
                rows={4}
              ></textarea>
              <button className="w-full mt-3 py-2 px-4 bg-primaryColor text-white rounded-xl flex items-center justify-center gap-1.5 text-sm">
                <PiChatText /> Ask AI Assistant
              </button>
            </div>
            
            <div className="bg-white p-5 rounded-xl border border-primaryColor/20">
              <h3 className="font-medium mb-4">Related Audio Explanations</h3>
              <div className="space-y-4">
                {Object.values(mockAudios)
                  .filter(a => a.id !== audioId)
                  .map((audio) => (
                    <div 
                      key={audio.id} 
                      className="flex gap-3 pb-3 border-b border-primaryColor/10 last:border-0 cursor-pointer"
                      onClick={() => router.push(`/note-summarymary/audio/${audio.id}`)}
                    >
                      <div className="w-12 h-12 bg-primaryColor/10 rounded-lg flex items-center justify-center text-primaryColor flex-shrink-0">
                        <PiSpeakerHigh size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium line-clamp-2">{audio.title}</h4>
                        <p className="text-xs text-n400 dark:text-n300 mt-1">{audio.duration} • {audio.listens} listens</p>
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