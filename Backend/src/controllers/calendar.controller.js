const { CalendarEvent, User } = require('../models');
const { Op } = require('sequelize');

const getEvents = async (req, res) => {
  const { startDate, endDate, type } = req.query;

  try {
    const where = {
      [Op.or]: [
        { user_id: req.user.id },
        { '$participants.id$': req.user.id }
      ]
    };

    if (startDate) {
      where.start_time = { [Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.end_time = { [Op.lte]: new Date(endDate) };
    }
    if (type) {
      where.type = type;
    }

    console.log('[LOG calendar_get_events] ========= Query parameters:', { startDate, endDate, type });

    const events = await CalendarEvent.findAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        },
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'username'],
          through: { attributes: [] }
        }
      ],
      order: [['start_time', 'ASC']]
    });

    console.log('[LOG calendar_get_events] ========= Found events:', events.length);

    const formattedEvents = events.map(event => {
      const plainEvent = event.get({ plain: true });
      return {
        ...plainEvent,
        creator_name: plainEvent.creator ? plainEvent.creator.username : 'Unknown',
        participant_names: plainEvent.participants ? plainEvent.participants.map(p => p.username) : [],
        participant_count: plainEvent.participants ? plainEvent.participants.length : 0
      };
    });

    res.json(formattedEvents);
  } catch (error) {
    console.error('[LOG calendar_error] ========= Error fetching events:', error);
    res.status(500).json({ message: 'Error fetching events' });
  }
};

const getEvent = async (req, res) => {
  try {
    const event = await CalendarEvent.findOne({
      where: {
        id: req.params.id,
        [Op.or]: [
          { user_id: req.user.id },
          { '$participants.id$': req.user.id }
        ]
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['username']
        },
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'username'],
          through: { attributes: [] }
        }
      ]
    });

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const plainEvent = event.get({ plain: true });
    const formattedEvent = {
      ...plainEvent,
      creator_name: plainEvent.creator ? plainEvent.creator.username : 'Unknown',
      participant_names: plainEvent.participants ? plainEvent.participants.map(p => p.username) : []
    };

    res.json(formattedEvent);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ message: 'Error fetching event' });
  }
};

const createEvent = async (req, res) => {
  const {
    title, description, startTime, endTime, type,
    location, isOnline, meetingLink, participants = []
  } = req.body;

  try {
    const event = await CalendarEvent.create({
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      type,
      location,
      is_online: isOnline,
      meeting_link: meetingLink,
      user_id: req.user.id
    });

    if (participants.length > 0) {
      await event.setParticipants(participants);
    }

    res.status(201).json({
      message: 'Event created successfully',
      eventId: event.id
    });
  } catch (error) {
    console.error('[LOG calendar_error] ========= Error creating event:', error);
    res.status(500).json({ message: 'Error creating event' });
  }
};

const updateEvent = async (req, res) => {
  const {
    title, description, startTime, endTime,
    location, isOnline, meetingLink, participants
  } = req.body;

  try {
    const event = await CalendarEvent.findOne({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (!event) {
      return res.status(404).json({
        message: 'Event not found or you do not have permission to update it'
      });
    }

    await event.update({
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      location,
      is_online: isOnline,
      meeting_link: meetingLink
    });

    if (participants !== undefined) {
      await event.setParticipants(participants);
    }

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('[LOG calendar_error] ========= Error updating event:', error);
    res.status(500).json({ message: 'Error updating event' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const deletedCount = await CalendarEvent.destroy({
      where: { id: req.params.id, user_id: req.user.id }
    });

    if (deletedCount === 0) {
      return res.status(404).json({
        message: 'Event not found or you do not have permission to delete it'
      });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('[LOG calendar_error] ========= Error deleting event:', error);
    res.status(500).json({ message: 'Error deleting event' });
  }
};

module.exports = {
  getEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent
}; 