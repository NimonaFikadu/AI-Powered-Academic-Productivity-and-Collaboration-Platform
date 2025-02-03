"use client";
import React, { useState, useEffect } from "react";
import {
  PiPlus,
  PiLink,
  PiBookmark,
  PiExam,
  PiChatCircle,
  PiHeart,
  PiHeartFill,
  PiShare,
  PiClock,
  PiUser,
  PiMagnifyingGlass,
  PiSpinner,
} from "react-icons/pi";
import { collaborationService, SharedContent, GetContentParams, Comment } from "./collaborationService";
import { useTranslation } from "react-i18next";

type ContentType = "all" | "topic" | "quiz";
type SortType = "recent" | "popular" | "comments";

export default function CollaborationPage() {
  const [sharedContent, setSharedContent] = useState<SharedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<ContentType>("all");
  const [sortBy, setSortBy] = useState<SortType>("recent");
  const [shareUrl, setShareUrl] = useState("");
  const [shareTitle, setShareTitle] = useState("");
  const [shareDescription, setShareDescription] = useState("");
  const [shareTags, setShareTags] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });
  const { t } = useTranslation();

  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Load shared content
  const loadSharedContent = async (params: GetContentParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const requestParams: GetContentParams = {
        page: 1,
        limit: 20,
        sort: sortBy,
        ...params
      };

      // Only add type if it's not 'all'
      if (filterType !== 'all') {
        requestParams.type = filterType;
      }

      // Only add search if it has content
      if (searchQuery.trim()) {
        requestParams.search = searchQuery.trim();
      }
      
      const response = await collaborationService.getSharedContent(requestParams);

      if (response.success) {
        setSharedContent(response.data.content);
        setPagination(response.data.pagination);
      } else {
        setError(t('collaboration.failedToLoad'));
      }
    } catch (err) {
      console.error('[LOG collaboration] ========= Error loading content:', err);
      // Don't show auth errors to the user — they just mean the token isn't ready yet
      const msg = err instanceof Error ? err.message : '';
      if (msg !== 'Authentication required') {
        setError(msg || t('collaboration.failedToLoad'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Load content on component mount and when filters change
  useEffect(() => {
    loadSharedContent();
  }, [filterType, sortBy, searchQuery]);

  const handleLike = async (id: string) => {
    try {
      const response = await collaborationService.toggleLike(id);
      
      if (response.success) {
        // Update the local state
        setSharedContent(prev => prev.map(item => 
          item.id === id 
            ? { 
                ...item, 
                isLiked: response.data.isLiked, 
                likes: response.data.likesCount 
              }
            : item
        ));
      }
    } catch (err) {
      console.error('[LOG collaboration] ========= Error toggling like:', err);
      // Optionally show error toast
    }
  };

  const toggleComments = async (contentId: string) => {
    if (activeCommentId === contentId) {
      setActiveCommentId(null);
      return;
    }
    
    setActiveCommentId(contentId);
    if (!comments[contentId]) {
      try {
        setLoadingComments(contentId);
        const res = await collaborationService.getComments(contentId);
        if (res.success) {
          setComments(prev => ({ ...prev, [contentId]: res.data.comments }));
        }
      } catch (err) {
        console.error('[LOG collaboration] ========= Error loading comments:', err);
      } finally {
        setLoadingComments(null);
      }
    }
  };

  const handleSubmitComment = async (contentId: string) => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await collaborationService.addComment(contentId, { comment: newComment.trim() });
      if (res.success) {
        setComments(prev => ({
          ...prev,
          [contentId]: [res.data.comment, ...(prev[contentId] || [])]
        }));
        
        setSharedContent(prev => prev.map(item => 
          item.id === contentId 
            ? { ...item, comments: res.data.commentsCount } 
            : item
        ));
        
        setNewComment(""); 
      }
    } catch (err) {
      console.error('[LOG collaboration] ========= Error adding comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    if (!shareUrl.trim()) return;
    
    try {
      setIsSharing(true);
      
      // Parse tags from comma-separated string
      const tags = shareTags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const response = await collaborationService.createSharedContent({
        content_url: shareUrl,
        title: shareTitle || undefined,
        description: shareDescription || undefined,
        tags: tags.length > 0 ? tags : undefined
      });

      if (response.success) {
        // Add the new content to the beginning of the list
        setSharedContent(prev => [response.data, ...prev]);
        
        // Close modal and reset form
        setShowShareModal(false);
        setShareUrl("");
        setShareTitle("");
        setShareDescription("");
        setShareTags("");
      }
    } catch (err) {
      console.error('[LOG collaboration] ========= Error sharing content:', err);
      setError(err instanceof Error ? err.message : t('collaboration.failedToLoad'));
    } finally {
      setIsSharing(false);
    }
  };

  const getTypeIcon = (type: string) => {
    return type === "topic" ? (
      <PiBookmark className="text-blue-500" size={16} />
    ) : (
      <PiExam className="text-green-500" size={16} />
    );
  };

  const getTypeColor = (type: string) => {
    return type === "topic" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" : "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400";
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return t('collaboration.justNow');
    if (diffInHours < 24) return t('collaboration.hoursAgo', { count: diffInHours });
    if (diffInHours < 48) return t('collaboration.yesterday');
    return t('collaboration.daysAgo', { count: Math.floor(diffInHours / 24) });
  };

  const getAuthorInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('collaboration.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('collaboration.subtitle')}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => {
                setError(null);
                loadSharedContent();
              }}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              {t('collaboration.tryAgain')}
            </button>
          </div>
        )}

        {/* Action Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <PiMagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder={t('collaboration.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as ContentType)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">{t('collaboration.allTypes')}</option>
                  <option value="topic">{t('collaboration.topics')}</option>
                  <option value="quiz">{t('collaboration.quizzes')}</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortType)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="recent">{t('collaboration.recent')}</option>
                  <option value="popular">{t('collaboration.mostLiked')}</option>
                  <option value="comments">{t('collaboration.mostDiscussed')}</option>
                </select>
              </div>
            </div>

            {/* Share Button */}
            <button
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              <PiPlus size={18} />
              {t('collaboration.shareContentBtn')}
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <PiSpinner className="animate-spin text-blue-600" size={32} />
            <span className="ml-2 text-gray-600 dark:text-gray-400">{t('collaboration.loadingContent')}</span>
          </div>
        )}

        {/* Content Feed */}
        {!loading && (
          <div className="space-y-4">
            {sharedContent.length === 0 ? (
              <div className="text-center py-12">
                <PiChatCircle size={48} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('collaboration.noContentFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? t('collaboration.adjustSearch') : t('collaboration.firstToShare')}
                </p>
              </div>
            ) : (
              sharedContent.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium relative group">
                        {item.author.avatar && (
                          <img 
                            src={item.author.avatar!} 
                            alt={item.author.name}
                            className="w-full h-full rounded-full object-cover z-10 relative bg-white"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-avatar');
                                if (fallback) fallback.classList.remove('hidden');
                            }}
                          />
                        )}
                        <span className={`fallback-avatar ${item.author.avatar ? 'hidden absolute inset-0 flex items-center justify-center' : ''} z-0`}>
                           {getAuthorInitials(item.author.name)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.author.name}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <PiClock size={14} />
                          {formatTimestamp(item.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                      {getTypeIcon(item.type)}
                      {t(`collaboration.${item.type === 'topic' ? 'topics' : 'quizzes'}`).replace(/s$/, '')}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {item.description}
                      </p>
                    )}
                    
                    {/* URL Link */}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition-colors duration-200"
                    >
                      <PiLink size={16} />
                      {t('collaboration.viewContent')}
                    </a>

                    {/* Tags */}
                    {item.tags && Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => handleLike(item.id)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors duration-200 ${
                        item.isLiked
                          ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {item.isLiked ? <PiHeartFill size={16} /> : <PiHeart size={16} />}
                      {item.likes}
                    </button>
                    
                    <button 
                      onClick={() => toggleComments(item.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200"
                    >
                      <PiChatCircle size={16} />
                      {item.comments}
                    </button>
                    
                    <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors duration-200">
                      <PiShare size={16} />
                      {t('collaboration.share')}
                    </button>
                  </div>

                  {/* Comment Section Expansion */}
                  {activeCommentId === item.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      
                      {/* Add Comment Input */}
                      <div className="flex gap-3 mb-6">
                         <div className="flex-1 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                           <input
                             type="text"
                              value={newComment}
                             onChange={(e) => setNewComment(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment(item.id)}
                             placeholder={t('collaboration.writeComment')}
                             className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-0 focus:ring-0 text-sm"
                           />
                         </div>
                         <button 
                           onClick={() => handleSubmitComment(item.id)}
                           disabled={!newComment.trim() || submittingComment}
                           className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded-xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                         >
                           {submittingComment ? <PiSpinner className="animate-spin" size={18} /> : t('collaboration.post')}
                         </button>
                      </div>

                      {/* Comments Feed */}
                      {loadingComments === item.id ? (
                        <div className="flex justify-center items-center py-6">
                           <PiSpinner className="animate-spin text-blue-500" size={24} />
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                           {!comments[item.id] || comments[item.id]?.length === 0 ? (
                             <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">{t('collaboration.noCommentsYet')}</p>
                           ) : (
                             comments[item.id].map((comment) => (
                               <div key={comment.id} className="flex gap-3 items-start group">
                                 <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold relative">
                                    {comment.author.avatar && (
                                     <img 
                                        src={comment.author.avatar!} 
                                        alt={comment.author.name}
                                        className="w-full h-full rounded-full object-cover z-10 relative bg-white"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            const fallback = e.currentTarget.parentElement?.querySelector('.comment-fallback');
                                            if (fallback) fallback.classList.remove('hidden');
                                        }}
                                      />
                                    )}
                                    <span className={`comment-fallback ${comment.author.avatar ? 'hidden absolute inset-0 flex items-center justify-center' : ''} z-0`}>
                                       {getAuthorInitials(comment.author.name)}
                                    </span>
                                 </div>
                                 <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-2xl rounded-tl-none p-3 relative">
                                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                                      {comment.author.name}
                                      <span className="text-xs text-gray-400 font-normal ml-2">{formatTimestamp(comment.createdAt)}</span>
                                    </h4>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{comment.comment}</p>
                                 </div>
                               </div>
                             ))
                           )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('collaboration.shareModalTitle')}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('collaboration.contentUrlLabel')}
                </label>
                <input
                  type="url"
                  placeholder="http://localhost:3001/topics/..."
                  value={shareUrl}
                  onChange={(e) => setShareUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('collaboration.titleLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('collaboration.titlePlaceholder')}
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('collaboration.descriptionLabel')}
                </label>
                <textarea
                  placeholder={t('collaboration.descriptionPlaceholder')}
                  value={shareDescription}
                  onChange={(e) => setShareDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('collaboration.tagsLabel')}
                </label>
                <input
                  type="text"
                  placeholder={t('collaboration.tagsPlaceholder')}
                  value={shareTags}
                  onChange={(e) => setShareTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowShareModal(false)}
                disabled={isSharing}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
              >
                {t('collaboration.cancel')}
              </button>
              <button
                onClick={handleShare}
                disabled={!shareUrl.trim() || isSharing}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSharing && <PiSpinner className="animate-spin" size={16} />}
                {isSharing ? t('collaboration.sharing') : t('collaboration.shareBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}