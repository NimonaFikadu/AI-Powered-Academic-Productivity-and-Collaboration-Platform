import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '@/hooks/useCalendarEvents';
import { PiX } from 'react-icons/pi';
import { useTranslation } from 'react-i18next';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: any) => void;
  initialEvent?: CalendarEvent;
  isLoading?: boolean;
}

const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialEvent,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    type: 'personal',
    location: '',
    isOnline: false,
    meetingLink: '',
    participants: [] as string[],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (initialEvent) {
      setFormData({
        title: initialEvent.title || '',
        description: initialEvent.description || '',
        startTime: new Date(initialEvent.start_time).toISOString().slice(0, 16),
        endTime: new Date(initialEvent.end_time).toISOString().slice(0, 16),
        type: initialEvent.type || 'personal',
        location: initialEvent.location || '',
        isOnline: initialEvent.is_online === 1,
        meetingLink: initialEvent.meeting_link || '',
        participants: initialEvent.participant_names || [],
      });
    } else {
      // Reset form for new event
      setFormData({
        title: '',
        description: '',
        startTime: new Date().toISOString().slice(0, 16),
        endTime: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
        type: 'personal',
        location: '',
        isOnline: false,
        meetingLink: '',
        participants: [],
      });
    }
    setErrors({});
  }, [initialEvent, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = t('calendar.titleRequired');
    }
    
    if (!formData.startTime) {
      newErrors.startTime = t('calendar.startTimeRequired');
    }
    
    if (!formData.endTime) {
      newErrors.endTime = t('calendar.endTimeRequired');
    }
    
    if (new Date(formData.startTime) > new Date(formData.endTime)) {
      newErrors.endTime = t('calendar.endTimeAfterStart');
    }
    
    if (formData.isOnline && !formData.meetingLink.trim()) {
      newErrors.meetingLink = t('calendar.meetingLinkRequired');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b border-primaryColor/20">
          <h2 className="text-xl font-medium">
            {initialEvent ? t('calendar.editEvent') : t('calendar.createNewEvent')}
          </h2>
          <button 
            onClick={onClose}
            className="text-n300 hover:text-n400 dark:text-n400 dark:hover:text-n300"
          >
            <PiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('calendar.titleLabel')} <span className="text-errorColor">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg ${
                errors.title ? 'border-errorColor' : 'border-primaryColor/20'
              }`}
              placeholder={t('calendar.titlePlaceholder')}
            />
            {errors.title && (
              <p className="text-xs text-errorColor mt-1">{errors.title}</p>
            )}
          </div>
          
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('calendar.descriptionLabel')}</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border border-primaryColor/20 rounded-lg min-h-[80px]"
              placeholder={t('calendar.descriptionPlaceholder')}
            />
          </div>
          
          {/* Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('calendar.startTimeLabel')} <span className="text-errorColor">*</span>
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg ${
                  errors.startTime ? 'border-errorColor' : 'border-primaryColor/20'
                }`}
              />
              {errors.startTime && (
                <p className="text-xs text-errorColor mt-1">{errors.startTime}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('calendar.endTimeLabel')} <span className="text-errorColor">*</span>
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg ${
                  errors.endTime ? 'border-errorColor' : 'border-primaryColor/20'
                }`}
              />
              {errors.endTime && (
                <p className="text-xs text-errorColor mt-1">{errors.endTime}</p>
              )}
            </div>
          </div>
          
          {/* Event Type */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('calendar.eventType')}</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="w-full p-2 border border-primaryColor/20 rounded-lg"
            >
              <option value="personal">{t('calendar.personal')}</option>
              <option value="group">{t('calendar.group')}</option>
            </select>
          </div>
          
          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-1">{t('calendar.locationLabel')}</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border border-primaryColor/20 rounded-lg"
              placeholder={t('calendar.locationPlaceholder')}
            />
          </div>
          
          {/* Online Toggle */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isOnline"
              name="isOnline"
              checked={formData.isOnline}
              onChange={handleCheckboxChange}
              className="mr-2"
            />
            <label htmlFor="isOnline" className="text-sm">
              {t('calendar.onlineToggle')}
            </label>
          </div>
          
          {/* Meeting Link (conditional) */}
          {formData.isOnline && (
            <div>
              <label className="block text-sm font-medium mb-1">
                {t('calendar.meetingLinkLabel')} {formData.isOnline && <span className="text-errorColor">*</span>}
              </label>
              <input
                type="text"
                name="meetingLink"
                value={formData.meetingLink}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg ${
                  errors.meetingLink ? 'border-errorColor' : 'border-primaryColor/20'
                }`}
                placeholder="https://meet.example.com/room"
              />
              {errors.meetingLink && (
                <p className="text-xs text-errorColor mt-1">{errors.meetingLink}</p>
              )}
            </div>
          )}
          
          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-primaryColor text-white rounded-lg hover:bg-primaryColor/90 disabled:opacity-70"
            >
              {isLoading ? t('calendar.saving') : initialEvent ? t('calendar.saveChanges') : t('calendar.createEventBtn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarEventModal; 