import React from 'react';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { PiX, PiCalendar, PiMapPin, PiLink, PiTrash, PiPencil } from 'react-icons/pi';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface CalendarEventDetailsProps {
  event: CalendarEvent;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const CalendarEventDetails: React.FC<CalendarEventDetailsProps> = ({
  event,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();

  if (!isOpen || !event) return null;

  // Format dates for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (err) {
      console.error('[LOG format_date] ========= Error formatting date:', err);
      return dateString;
    }
  };

  // Determine if the event is happening today
  const isToday = () => {
    const today = new Date();
    const eventDate = new Date(event.start_time);
    return (
      today.getDate() === eventDate.getDate() &&
      today.getMonth() === eventDate.getMonth() &&
      today.getFullYear() === eventDate.getFullYear()
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="flex justify-between items-center p-4 border-b border-primaryColor/20">
          <h2 className="text-xl font-medium">{t('calendar.eventDetails')}</h2>
          <button 
            onClick={onClose}
            className="text-n300 hover:text-n400 dark:text-n400 dark:hover:text-n300"
          >
            <PiX size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <h3 className="text-xl font-semibold mb-1">{event.title}</h3>
            {isToday() && (
              <span className="inline-block bg-primaryColor text-white text-xs px-2 py-1 rounded-full">
                {t('calendar.today')}
              </span>
            )}
          </div>
          
          {event.description && (
            <p className="text-n400 dark:text-n300 mb-4">{event.description}</p>
          )}
          
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <PiCalendar className="text-primaryColor" size={18} />
              <div>
                <div>{formatDate(event.start_time)}</div>
                <div>{t('calendar.to')} {formatDate(event.end_time)}</div>
              </div>
            </div>
            
            {event.location && (
              <div className="flex items-center gap-3">
                <PiMapPin className="text-primaryColor" size={18} />
                <span>{event.location}</span>
              </div>
            )}
            
            {event.is_online === 1 && event.meeting_link && (
              <div className="flex items-center gap-3">
                <PiLink className="text-primaryColor" size={18} />
                <a 
                  href={event.meeting_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primaryColor hover:underline"
                >
                  {t('calendar.joinMeeting')}
                </a>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-sm text-n300 dark:text-n400 mb-6">
            <span>{t('calendar.createdBy', { creator: event.creator_name })}</span>
            {event.participant_count > 0 && (
              <span>• {t('calendar.participants', { count: event.participant_count })}</span>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={onDelete}
              className="flex items-center gap-1 py-2 px-3 border border-errorColor text-errorColor rounded-lg hover:bg-errorColor/10"
            >
              <PiTrash size={16} />
              <span>{t('calendar.deleteBtn')}</span>
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-1 py-2 px-3 bg-primaryColor text-white rounded-lg hover:bg-primaryColor/90"
            >
              <PiPencil size={16} />
              <span>{t('calendar.edit')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEventDetails; 