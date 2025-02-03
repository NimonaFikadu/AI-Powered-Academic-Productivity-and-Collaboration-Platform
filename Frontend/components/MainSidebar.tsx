"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import fav from "@/public/images/favicon.png";
import {
  PiAlignLeft,
  PiCaretDown,
  PiCaretUp,
  PiArrowUUpLeft,
  PiMagnifyingGlass,
  PiHouseLine,
  PiRobot,
  PiCalendar,
  PiChartLine,
  PiExam,
  PiChalkboardTeacher,
  PiNote,
  PiGear,
  PiQuestion,
  PiPlus,
  PiTrash,
  PiX,
  PiBookmark,
  PiUsers,
} from "react-icons/pi";
import Link from "next/link";
import { useMainModal } from "@/stores/modal";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { topicsService, Topic } from "@/app/topics/topicsService";
import AddTopicModal from "./modals/AddTopic";
import DeleteTopicDialog from "./modals/DeleteTopicDialog";

type MainSidebarProps = {
  showSidebar: boolean;
  setShowSidebar: React.Dispatch<React.SetStateAction<boolean>>;
};

function MainSidebar({ showSidebar, setShowSidebar }: MainSidebarProps) {
  const { modalOpen } = useMainModal();
  const pathname = usePathname();
  const [showTopics, setShowTopics] = useState(true);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<Topic[]>([]);
  const [topicFilter, setTopicFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  
  // Modal states
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<{id: string, title: string} | null>(null);
  
  // Filter topics based on search input
  useEffect(() => {
    if (topics.length > 0) {
      if (topicFilter.trim() === "") {
        setFilteredTopics(topics);
      } else {
        const filtered = topics.filter(topic => 
          topic.title.toLowerCase().includes(topicFilter.toLowerCase())
        );
        setFilteredTopics(filtered);
      }
    }
  }, [topics, topicFilter]);
  
  // Set isClient to true once component mounts (client-side only)
  useEffect(() => {
    setIsClient(true);
    
    // Set sidebar visibility based on screen size (client-side only)
    if (window.innerWidth > 992) {
      setShowSidebar(true);
    }
    
    // Load topics expanded state from localStorage
    const savedTopicsState = localStorage.getItem('topicsExpanded');
    if (savedTopicsState !== null) {
      setShowTopics(savedTopicsState === 'true');
    }
  }, [setShowSidebar]);
  
  // Save expanded state to localStorage when it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('topicsExpanded', showTopics.toString());
    }
  }, [showTopics, isClient]);
  
  // Fetch topics from the API
  const fetchTopics = async () => {
    // Don't attempt if we have no token — avoids noisy auth errors on page load
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    try {
      setIsLoading(true);
      setError(null);
      const response = await topicsService.getTopics();
      setTopics(response.topics);
      setFilteredTopics(response.topics);
    } catch (err) {
      console.error("[LOG sidebar] ========= Error fetching topics:", err);
      // Silently ignore auth errors — user may not be logged in yet
      const msg = err instanceof Error ? err.message : '';
      if (msg !== 'Authentication required') {
        setError(msg || 'Failed to load topics');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch topics when component mounts on client side
  useEffect(() => {
    if (isClient) {
      fetchTopics();
    }
  }, [isClient]);

  // Check if a link is active
  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };
  
  // Handle topic deletion click
  const handleDeleteClick = (e: React.MouseEvent, topic: Topic) => {
    e.preventDefault();
    e.stopPropagation();
    setTopicToDelete({ id: topic.id, title: topic.title });
    setShowDeleteDialog(true);
  };
  
  // Handle topic deletion
  const handleTopicDeleted = () => {
    // Refresh the topics list
    fetchTopics();
  };

  // Navigation items
  const navItems = [
    { 
      path: "/home", 
      name: t('sidebar.home'), 
      icon: <PiHouseLine size={20} className="text-primaryColor" /> 
    },
    { 
      path: "/assistance", 
      name: t('sidebar.assistance'), 
      icon: <PiRobot size={20} className="text-primaryColor" /> 
    },
    { 
      path: "/calendar", 
      name: t('sidebar.calendar'), 
      icon: <PiCalendar size={20} className="text-primaryColor" /> 
    },
    { 
      path: "/insights", 
      name: t('sidebar.insights'), 
      icon: <PiChartLine size={20} className="text-primaryColor" /> 
    },
    { 
      path: "/quizzes", 
      name: t('sidebar.testsQuizfetch'), 
      icon: <PiExam size={20} className="text-primaryColor" /> 
    },
    { 
      path: "/note-summary", 
      name: t('sidebar.tutorMe'), 
      icon: <PiChalkboardTeacher size={20} className="text-primaryColor" /> 
    },
    { 
      path: "/notes-materials", 
      name: t('sidebar.notesMaterials'), 
      icon: <PiNote size={20} className="text-primaryColor" /> 
    },
    { 
      path: "/collaboration", 
      name: t('sidebar.collaboration'), 
      icon: <PiUsers size={20} className="text-primaryColor" /> 
    },
  ];

  return (
    <div
      className={`w-[312px] bg-white border-r border-primaryColor/20 h-dvh overflow-hidden duration-200 max-lg:absolute z-40 top-0 left-0 ${
        showSidebar
          ? "visible opacity-100"
          : "max-lg:invisible max-lg:opacity-0 ml-[-312px]"
      }`}
    >
      <div
        className={`p-5 bg-primaryColor/5 overflow-auto h-full flex flex-col justify-between`}
      >
        <div className="">
          <div className="flex justify-between items-center">
            <div className="flex justify-start items-center gap-1.5">
              <Image src={fav} alt="UniHub Logo" />
              <span className="text-2xl font-semibold text-n700">
                UniHub
              </span>
            </div>
            <div className="flex justify-start items-center gap-2">
              <button
                onClick={() => modalOpen("Search")}
                className="bg-white p-2 rounded-full flex justify-center items-center border border-primaryColor/20 dark:bg-n0"
              >
                <PiMagnifyingGlass />
              </button>
              <button
                onClick={() => setShowSidebar(false)}
                className="bg-white p-2 rounded-full flex justify-center items-center border border-primaryColor/20 dark:bg-n0"
              >
                <PiArrowUUpLeft />
              </button>
            </div>
          </div>
          
          {/* Started Topics Dropdown */}
          <div className="mt-6">
            <button 
              onClick={() => setShowTopics(!showTopics)}
              className={`flex w-full justify-between items-center py-3 px-6 hover:text-primaryColor rounded-xl duration-300 ${
                showTopics ? 'bg-primaryColor/10 text-primaryColor' : 'hover:bg-primaryColor/10'
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <PiAlignLeft size={20} className="text-primaryColor" />
                <span className="text-sm">{t('sidebar.startedTopics')}</span>
              </span>
              <div className="flex items-center gap-2">
                {isClient && (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAddTopicModal(true);
                    }}
                    className="p-1 hover:bg-primaryColor/20 rounded-full cursor-pointer"
                    title="Add new topic"
                  >
                    <PiPlus size={16} className="text-primaryColor" />
                  </span>
                )}
                {showTopics ? (
                  <PiCaretUp className="text-primaryColor" />
                ) : (
                  <PiCaretDown className="text-primaryColor" />
                )}
              </div>
            </button>
            
            {/* Dropdown Content */}
            <div className={`overflow-y-auto transition-all duration-300 scrollbar-thin scrollbar-thumb-primaryColor/20 scrollbar-track-transparent ${
              showTopics ? 'max-h-[40vh]' : 'max-h-0'
            }`}>
              {/* Search filter - only show if we have topics and the dropdown is open */}
              {showTopics && topics.length > 3 && (
                <div className="relative mx-6 my-2">
                  <input
                    type="text"
                    placeholder="Filter topics..."
                    value={topicFilter}
                    onChange={(e) => setTopicFilter(e.target.value)}
                    className="w-full py-1.5 px-3 pr-8 text-sm rounded-lg bg-white dark:bg-n700 border border-primaryColor/20 focus:border-primaryColor focus:outline-none"
                  />
                  {topicFilter && (
                    <button
                      onClick={() => setTopicFilter("")}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-n300 hover:text-primaryColor"
                    >
                      <PiX size={14} />
                    </button>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="text-sm text-center py-2 pl-12 pr-6">Loading topics...</div>
              ) : error ? (
                <div className="text-sm text-center text-errorColor py-2 pl-12 pr-6">{error}</div>
              ) : !isClient ? (
                <div className="text-sm text-center py-2 pl-12 pr-6">Loading...</div>
              ) : topics.length === 0 ? (
                <button
                  onClick={() => setShowAddTopicModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm bg-primaryColor/5 hover:bg-primaryColor/10 text-primaryColor rounded-xl my-2 mx-6"
                >
                  <PiPlus size={16} />
                  <span>Add Topic</span>
                </button>
              ) : filteredTopics.length === 0 && topicFilter.trim() !== "" ? (
                <div className="py-2 px-6 text-center text-sm text-n300">
                  No topics found matching "{topicFilter}"
                </div>
              ) : (
                <div className="py-1">
                  {filteredTopics.map((topic) => (
                    <div key={topic.id} className="relative group">
                      <Link
                        href={`/topics/${topic.id}`}
                        className={`flex items-center gap-2 py-2.5 pl-12 pr-6 text-sm hover:text-primaryColor hover:bg-primaryColor/10 rounded-xl duration-200 ${
                          isActive(`/topics/${topic.id}`) ? 'bg-primaryColor/10 text-primaryColor' : ''
                        }`}
                      >
                        <PiBookmark size={14} className="text-primaryColor opacity-70" />
                        <span className="truncate">{topic.title}</span>
                      </Link>
                      {isClient && (
                        <span
                          onClick={(e) => handleDeleteClick(e, topic)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 hover:bg-errorColor/10 text-errorColor transition-opacity cursor-pointer"
                          title="Delete topic"
                        >
                          <PiTrash size={14} />
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Main Navigation */}
          <div className="flex flex-col gap-1 mt-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-2 py-3 px-6 rounded-xl duration-200 ${
                  isActive(item.path)
                    ? 'bg-primaryColor/10 text-primaryColor'
                    : 'hover:text-primaryColor hover:bg-primaryColor/10'
                }`}
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1 justify-start items-start">
            {/* <button
              className="w-full flex justify-between items-center py-3 px-6 hover:text-primaryColor hover:bg-primaryColor/10 rounded-xl duration-500"
              onClick={() => modalOpen("Support Modal")}
            >
              <span className="flex justify-center items-center gap-2 ">
                <PiQuestion size={20} className="text-primaryColor" />
                <span className="text-sm">{t('sidebar.help')}</span>
              </span>
              <span className="block size-1 rounded-full bg-successColor"></span>
            </button> */}
            <button
              className="w-full flex justify-between items-center py-3 px-6 hover:text-primaryColor hover:bg-primaryColor/10 rounded-xl duration-200"
              onClick={() => modalOpen("Settings")}
            >
              <span className="flex justify-center items-center gap-2 ">
                <PiGear size={20} className="text-primaryColor" />
                <span className="text-sm">{t('sidebar.settings')}</span>
              </span>
              <span className="block size-1 rounded-full bg-successColor"></span>
            </button>
          </div>
          
          {/* Copyright text */}
          <div className="px-6 pb-2">
            <p className="text-xs text-n500/60 dark:text-n30/60 text-center">
              {t('footer.copyright')}
            </p>
          </div>
        </div>
      </div>

      {/* Only render modals on client side */}
      {isClient && (
        <>
          {/* Add Topic Modal */}
          {showAddTopicModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full">
                <AddTopicModal 
                  onClose={() => setShowAddTopicModal(false)} 
                  onTopicAdded={fetchTopics}
                />
              </div>
            </div>
          )}
          
          {/* Delete Topic Dialog */}
          {showDeleteDialog && topicToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="bg-white rounded-xl max-w-sm w-full">
                <DeleteTopicDialog
                  topicId={topicToDelete.id}
                  topicTitle={topicToDelete.title}
                  onClose={() => {
                    setShowDeleteDialog(false);
                    setTopicToDelete(null);
                  }}
                  onDelete={handleTopicDeleted}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MainSidebar;
