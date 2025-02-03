"use client";

import React, { useEffect, useState } from 'react';
import { Topic, topicsService } from './topicsService';
import { useRouter } from 'next/navigation';
import { PiPlus, PiMagnifyingGlass, PiFolderOpen, PiClock, PiTrash } from 'react-icons/pi';
import AddTopic from '@/components/modals/AddTopic';
import DeleteTopicDialog from '@/components/modals/DeleteTopicDialog';
import { format } from 'date-fns';

const TopicsPage = () => {
  const router = useRouter();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  
  // Check if we came from assistance page
  const [fromAssistance, setFromAssistance] = useState(false);
  
  useEffect(() => {
    // Check if we navigated from assistance page
    if (typeof window !== 'undefined') {
      const queryParams = new URLSearchParams(window.location.search);
      const from = queryParams.get('from');
      setFromAssistance(from === 'assistance');
    }
    
    fetchTopics();
  }, []);
  
  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await topicsService.getTopics();
      setTopics(response.topics);
    } catch (err) {
      console.error('[LOG topics] ========= Error fetching topics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  const handleTopicCreated = () => {
    setShowAddTopicModal(false);
    fetchTopics();
  };
  
  const handleTopicDeleted = () => {
    setTopicToDelete(null);
    fetchTopics();
  };
  
  const handleTopicSelect = (topicId: string) => {
    if (fromAssistance) {
      // If we came from assistance, redirect back with the selected topic
      router.push(`/assistance?topic=${topicId}`);
    } else {
      // Otherwise navigate to topic detail page
      router.push(`/topics/${topicId}`);
    }
  };
  
  const filteredTopics = topics.filter(topic => 
    topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full max-w-[1070px] mx-auto py-6 px-4">
      {/* Modals */}
      {showAddTopicModal && (
        <AddTopic 
          onClose={() => setShowAddTopicModal(false)}
          onTopicAdded={handleTopicCreated}
        />
      )}
      
      {topicToDelete && (
        <DeleteTopicDialog
          topicId={topicToDelete.id}
          topicTitle={topicToDelete.title}
          onClose={() => setTopicToDelete(null)}
          onDelete={handleTopicDeleted}
        />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">
          {fromAssistance ? 'Select a Topic for Assistance' : 'My Topics'}
        </h1>
        <button
          onClick={() => setShowAddTopicModal(true)}
          className="flex items-center gap-2 py-2 px-4 bg-primaryColor text-white rounded-lg"
        >
          <PiPlus />
          <span>New Topic</span>
        </button>
      </div>
      
      {/* Search bar */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full py-3 px-5 pl-12 text-sm rounded-xl border border-primaryColor/30 bg-white focus:outline-none focus:ring-2 focus:ring-primaryColor"
        />
        <PiMagnifyingGlass className="absolute left-4 top-3.5 text-lg text-primaryColor" />
      </div>
      
      {/* Topics grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, index) => (
            <div key={index} className="bg-white p-4 rounded-xl border border-primaryColor/20 animate-pulse">
              <div className="h-5 bg-gray-200 rounded mb-2 w-2/3"></div>
              <div className="h-4 bg-gray-200 rounded mb-3 w-full"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-errorColor">
          <p>{error}</p>
          <button 
            onClick={fetchTopics}
            className="mt-4 px-4 py-2 bg-primaryColor text-white rounded-lg"
          >
            Try Again
          </button>
        </div>
      ) : filteredTopics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTopics.map((topic) => (
            <div 
              key={topic.id}
              className={`bg-white p-4 rounded-xl border ${
                selectedTopicId === topic.id 
                  ? 'border-primaryColor' 
                  : 'border-primaryColor/20 hover:border-primaryColor/50'
              } transition duration-300 cursor-pointer relative group`}
            >
              <div onClick={() => handleTopicSelect(topic.id)}>
                <h3 className="font-medium mb-2">{topic.title}</h3>
                <p className="text-sm text-n300 dark:text-n400 mb-3 line-clamp-2">
                  {topic.description}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1 text-xs text-n400">
                    <PiClock className="text-primaryColor" />
                    <span>{formatDate(topic.created_at)}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primaryColor/10 text-primaryColor flex items-center gap-1">
                    <PiFolderOpen />
                    {topic.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
              </div>
              
              {/* Delete button - Only shown on hover */}
              <button
                className="absolute top-2 right-2 p-2 rounded-full bg-white text-errorColor opacity-0 group-hover:opacity-100 transition-opacity hover:bg-errorColor/10"
                onClick={(e) => {
                  e.stopPropagation();
                  setTopicToDelete(topic);
                }}
              >
                <PiTrash />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed border-primaryColor/20 rounded-xl">
          <PiFolderOpen className="text-4xl text-primaryColor/50 mx-auto mb-3" />
          <h3 className="font-medium mb-2">No Topics Found</h3>
          <p className="text-sm text-n300 dark:text-n400 mb-4">
            {searchQuery 
              ? 'No topics match your search query' 
              : 'You haven\'t created any topics yet.'}
          </p>
          <button
            onClick={() => setShowAddTopicModal(true)}
            className="px-4 py-2 bg-primaryColor text-white rounded-lg"
          >
            Create Your First Topic
          </button>
        </div>
      )}
    </div>
  );
};

export default TopicsPage; 