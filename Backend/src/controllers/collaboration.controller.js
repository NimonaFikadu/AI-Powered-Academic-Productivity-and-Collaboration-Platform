const { SharedContent, SharedContentLike, SharedContentComment, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all shared content with pagination, filtering, and sorting
 */
const getSharedContent = async (req, res) => {
  try {
    console.log('[LOG collaboration] ========= Getting shared content');
    
    const {
      page = 1,
      limit = 10,
      type = 'all',
      sort = 'recent',
      search = ''
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const userId = req.user.id;

    // Build where clause
    const whereClause = {};
    if (type !== 'all') {
      whereClause.content_type = type;
    }
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Build order clause
    let orderClause;
    switch (sort) {
      case 'popular':
        orderClause = [['likes_count', 'DESC']];
        break;
      case 'comments':
        orderClause = [['comments_count', 'DESC']];
        break;
      case 'recent':
      default:
        orderClause = [['created_at', 'DESC']];
        break;
    }

    const { count, rows: sharedContent } = await SharedContent.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'full_name', 'avatar_url']
        },
        {
          model: SharedContentLike,
          as: 'likes',
          where: { user_id: userId },
          required: false,
          attributes: ['id']
        }
      ],
      order: orderClause,
      limit: parseInt(limit),
      offset: offset,
      distinct: true
    });

    // Format response
    const formattedContent = sharedContent.map(item => {
      // Ensure tags is always an array
      let parsedTags = [];
      if (item.tags) {
        if (Array.isArray(item.tags)) {
          parsedTags = item.tags;
        } else if (typeof item.tags === 'string') {
          try {
            parsedTags = JSON.parse(item.tags);
            if (!Array.isArray(parsedTags)) parsedTags = [];
          } catch (e) {
            console.warn('[LOG collaboration] ========= Failed to parse tags JSON:', item.tags);
            parsedTags = [];
          }
        }
      }

      return {
        id: item.id,
        type: item.content_type,
        title: item.title,
        description: item.description,
        url: item.content_url,
        tags: parsedTags,
        author: {
          id: item.author.id,
          name: item.author.full_name || item.author.username,
          username: item.author.username,
          avatar: item.author.avatar_url
        },
        likes: item.likes_count,
        comments: item.comments_count,
        isLiked: item.likes && item.likes.length > 0,
        timestamp: item.created_at,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    });

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        content: formattedContent,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('[LOG collaboration] ========= Error getting shared content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get shared content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Create new shared content
 */
const createSharedContent = async (req, res) => {
  try {
    console.log('[LOG collaboration] ========= Creating shared content');
    
    const { content_url, title, description, tags } = req.body;
    const userId = req.user.id;

    // Determine content type from URL
    let content_type = 'topic'; // default
    if (content_url.includes('/quizzes/')) {
      content_type = 'quiz';
    }

    // Create shared content
    const sharedContent = await SharedContent.create({
      user_id: userId,
      content_type,
      content_url,
      title,
      description,
      tags: tags || []
    });

    // Fetch the created content with author info
    const createdContent = await SharedContent.findByPk(sharedContent.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'full_name', 'avatar_url']
        }
      ]
    });

    // Ensure tags is always an array
    let createdTags = [];
    if (createdContent.tags) {
      if (Array.isArray(createdContent.tags)) {
        createdTags = createdContent.tags;
      } else if (typeof createdContent.tags === 'string') {
        try {
          createdTags = JSON.parse(createdContent.tags);
          if (!Array.isArray(createdTags)) createdTags = [];
        } catch (e) {
          console.warn('[LOG collaboration] ========= Failed to parse tags JSON:', createdContent.tags);
          createdTags = [];
        }
      }
    }

    const formattedContent = {
      id: createdContent.id,
      type: createdContent.content_type,
      title: createdContent.title,
      description: createdContent.description,
      url: createdContent.content_url,
      tags: createdTags,
      author: {
        id: createdContent.author.id,
        name: createdContent.author.full_name || createdContent.author.username,
        username: createdContent.author.username,
        avatar: createdContent.author.avatar_url
      },
      likes: createdContent.likes_count,
      comments: createdContent.comments_count,
      isLiked: false,
      timestamp: createdContent.created_at,
      createdAt: createdContent.created_at,
      updatedAt: createdContent.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Content shared successfully',
      data: formattedContent
    });

  } catch (error) {
    console.error('[LOG collaboration] ========= Error creating shared content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to share content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Toggle like on shared content
 */
const toggleLike = async (req, res) => {
  try {
    console.log('[LOG collaboration] ========= Toggling like on shared content');
    
    const { id } = req.params;
    const userId = req.user.id;

    // Check if content exists
    const sharedContent = await SharedContent.findByPk(id);
    if (!sharedContent) {
      return res.status(404).json({
        success: false,
        message: 'Shared content not found'
      });
    }

    // Check if user already liked this content
    const existingLike = await SharedContentLike.findOne({
      where: {
        shared_content_id: id,
        user_id: userId
      }
    });

    let isLiked;
    let likesCount;

    if (existingLike) {
      // Unlike - remove the like
      await existingLike.destroy();
      likesCount = Math.max(0, sharedContent.likes_count - 1);
      await sharedContent.update({ likes_count: likesCount });
      isLiked = false;
    } else {
      // Like - add the like
      await SharedContentLike.create({
        shared_content_id: id,
        user_id: userId
      });
      likesCount = sharedContent.likes_count + 1;
      await sharedContent.update({ likes_count: likesCount });
      isLiked = true;
    }

    res.json({
      success: true,
      message: isLiked ? 'Content liked' : 'Content unliked',
      data: {
        isLiked,
        likesCount
      }
    });

  } catch (error) {
    console.error('[LOG collaboration] ========= Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get comments for shared content
 */
const getComments = async (req, res) => {
  try {
    console.log('[LOG collaboration] ========= Getting comments for shared content');
    
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Check if content exists
    const sharedContent = await SharedContent.findByPk(id);
    if (!sharedContent) {
      return res.status(404).json({
        success: false,
        message: 'Shared content not found'
      });
    }

    const { count, rows: comments } = await SharedContentComment.findAndCountAll({
      where: { shared_content_id: id },
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'full_name', 'avatar_url']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const formattedComments = comments.map(comment => ({
      id: comment.id,
      comment: comment.comment,
      author: {
        id: comment.author.id,
        name: comment.author.full_name || comment.author.username,
        username: comment.author.username,
        avatar: comment.author.avatar_url
      },
      createdAt: comment.created_at,
      updatedAt: comment.updated_at
    }));

    const totalPages = Math.ceil(count / parseInt(limit));

    res.json({
      success: true,
      data: {
        comments: formattedComments,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('[LOG collaboration] ========= Error getting comments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Add comment to shared content
 */
const addComment = async (req, res) => {
  try {
    console.log('[LOG collaboration] ========= Adding comment to shared content');
    
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    // Check if content exists
    const sharedContent = await SharedContent.findByPk(id);
    if (!sharedContent) {
      return res.status(404).json({
        success: false,
        message: 'Shared content not found'
      });
    }

    // Create comment
    const newComment = await SharedContentComment.create({
      shared_content_id: id,
      user_id: userId,
      comment
    });

    // Update comments count
    const commentsCount = sharedContent.comments_count + 1;
    await sharedContent.update({ comments_count: commentsCount });

    // Fetch the created comment with author info
    const createdComment = await SharedContentComment.findByPk(newComment.id, {
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'username', 'full_name', 'avatar_url']
        }
      ]
    });

    const formattedComment = {
      id: createdComment.id,
      comment: createdComment.comment,
      author: {
        id: createdComment.author.id,
        name: createdComment.author.full_name || createdComment.author.username,
        username: createdComment.author.username,
        avatar: createdComment.author.avatar_url
      },
      createdAt: createdComment.created_at,
      updatedAt: createdComment.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: {
        comment: formattedComment,
        commentsCount
      }
    });

  } catch (error) {
    console.error('[LOG collaboration] ========= Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete shared content (only by author)
 */
const deleteSharedContent = async (req, res) => {
  try {
    console.log('[LOG collaboration] ========= Deleting shared content');
    
    const { id } = req.params;
    const userId = req.user.id;

    // Find the shared content
    const sharedContent = await SharedContent.findByPk(id);
    if (!sharedContent) {
      return res.status(404).json({
        success: false,
        message: 'Shared content not found'
      });
    }

    // Check if user is the author
    if (sharedContent.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own shared content'
      });
    }

    // Delete the shared content (cascade will handle likes and comments)
    await sharedContent.destroy();

    res.json({
      success: true,
      message: 'Shared content deleted successfully'
    });

  } catch (error) {
    console.error('[LOG collaboration] ========= Error deleting shared content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shared content',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getSharedContent,
  createSharedContent,
  toggleLike,
  getComments,
  addComment,
  deleteSharedContent
}; 