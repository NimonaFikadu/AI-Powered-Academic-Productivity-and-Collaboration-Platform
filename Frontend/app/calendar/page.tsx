"use client";

import React, { useState, useEffect } from "react";
import { PiCalendar, PiPlus, PiCaretLeft, PiCaretRight } from "react-icons/pi";
import useCalendarEvents, { CalendarEvent } from "@/hooks/useCalendarEvents";
import CalendarEventModal from "@/components/CalendarEventModal";
import CalendarEventDetails from "@/components/CalendarEventDetails";
import ConfirmDialog from "@/components/ConfirmDialog";
import { format, isSameDay, isSameMonth, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

// Define event category colors
const eventTypeColors = {
  personal: "bg-primaryColor",
  group: "bg-secondaryColor"
};

const Calendar = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [currentYear, setCurrentYear] = useState(2023);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { t } = useTranslation();
  
  // Event management states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEventDetailsOpen, setIsEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  
  // Get events from the API
  const { 
    events, 
    isLoading, 
    error, 
    fetchEvents, 
    createEvent, 
    updateEvent, 
    deleteEvent 
  } = useCalendarEvents();

  // Initialize dates once component mounts
  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setIsMounted(true);
  }, []);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get day of week for first day of month (0 = Sunday)
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Create calendar grid
  const days = [];
  const monthNames = [
    t('calendar.months.january'), t('calendar.months.february'), t('calendar.months.march'), 
    t('calendar.months.april'), t('calendar.months.may'), t('calendar.months.june'), 
    t('calendar.months.july'), t('calendar.months.august'), t('calendar.months.september'), 
    t('calendar.months.october'), t('calendar.months.november'), t('calendar.months.december')
  ];
  
  // Only render calendar if component is mounted (client-side)
  if (isMounted) {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);
    
    // Previous month days
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`prev-${i}`} className="p-2 text-n300/50 text-sm"></div>);
    }
    
    // Get events for a specific day
    const getEventsForDay = (day: number) => {
      const date = new Date(currentYear, currentMonth, day);
      return events.filter(event => {
        const eventStartDate = parseISO(event.start_time);
        return isSameDay(eventStartDate, date);
      });
    };
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(currentYear, currentMonth, day);
      const dayEvents = getEventsForDay(day);
      const isCurrentDay = 
        new Date().getDate() === day && 
        new Date().getMonth() === currentMonth && 
        new Date().getFullYear() === currentYear;
      
      days.push(
        <div 
          key={`day-${day}`} 
          className={`p-2 border border-primaryColor/10 min-h-[100px] cursor-pointer hover:bg-primaryColor/5 ${
            isCurrentDay ? 'bg-primaryColor/5 border-primaryColor' : ''
          }`}
          onClick={() => {
            setSelectedDate(currentDate);
            setIsCreateModalOpen(true);
          }}
        >
          <div className="flex justify-between items-center">
            <span className={`font-medium ${isCurrentDay ? 'text-primaryColor' : ''}`}>{day}</span>
            {dayEvents.length > 0 && (
              <span className="text-xs bg-primaryColor/10 text-primaryColor px-1.5 py-0.5 rounded-full">
                {dayEvents.length}
              </span>
            )}
          </div>
          <div className="mt-1">
            {dayEvents.map(event => (
              <div 
                key={event.id}
                className={`text-xs p-1 mb-1 rounded truncate text-white ${eventTypeColors[event.type] || 'bg-primaryColor'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEvent(event);
                  setIsEventDetailsOpen(true);
                }}
              >
                {event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }
  
  // Handle month navigation
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Event handlers
  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setIsEditMode(false);
    setSelectedEvent(null);
  };

  const handleCloseEventDetails = () => {
    setIsEventDetailsOpen(false);
    setSelectedEvent(null);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailsOpen(true);
  };

  const handleEditEvent = () => {
    setIsEventDetailsOpen(false);
    setIsEditMode(true);
    setIsCreateModalOpen(true);
  };

  const handleDeleteEvent = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!selectedEvent) return;
    
    const result = await deleteEvent(selectedEvent.id);
    if (result.success) {
      setIsDeleteConfirmOpen(false);
      setIsEventDetailsOpen(false);
      setSelectedEvent(null);
    } else {
      console.error('[LOG delete_event_error] ========= Failed to delete event:', result.error);
      // You could show an error toast here
    }
  };

  const handleCreateOrUpdateEvent = async (eventData: any) => {
    setSubmitLoading(true);
    
    try {
      if (isEditMode && selectedEvent) {
        // Update existing event
        const result = await updateEvent(selectedEvent.id, eventData);
        if (result.success) {
          handleCloseCreateModal();
        } else {
          console.error('[LOG update_event_error] ========= Failed to update event:', result.error);
          // You could show an error toast here
        }
      } else {
        // Create new event
        const result = await createEvent(eventData);
        if (result.success) {
          handleCloseCreateModal();
        } else {
          console.error('[LOG create_event_error] ========= Failed to create event:', result.error);
          // You could show an error toast here
        }
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Format date for display in upcoming events
  const formatEventDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('[LOG format_date_error] ========= Error formatting date:', error);
      return dateString;
    }
  };

  // Get upcoming events (events that haven't started yet or are happening today)
  const getUpcomingEvents = () => {
    if (!isMounted) return [];
    
    const now = new Date();
    return events
      .filter(event => {
        const eventStartDate = parseISO(event.start_time);
        return eventStartDate >= now || isSameDay(eventStartDate, now);
      })
      .sort((a, b) => {
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      })
      .slice(0, 5); // Limit to 5 upcoming events
  };

  const upcomingEvents = getUpcomingEvents();

  return (
    <div className="w-full max-w-[1070px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <PiCalendar className="text-primaryColor" />
          {t('calendar.title')}
        </h1>
        <button 
          className="bg-primaryColor text-white py-2 px-4 rounded-xl flex items-center gap-1"
          onClick={() => {
            setSelectedDate(new Date());
            setIsEditMode(false);
            setSelectedEvent(null);
            setIsCreateModalOpen(true);
          }}
        >
          <PiPlus />
          <span>{t('calendar.newEvent')}</span>
        </button>
      </div>
      
      <div className="bg-white rounded-xl border border-primaryColor/20 p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-4 items-center">
            <button onClick={goToPreviousMonth} className="p-2 hover:bg-primaryColor/10 rounded-full">
              <PiCaretLeft />
            </button>
            <h2 className="text-xl font-medium">
              {isMounted ? monthNames[currentMonth] : ''} {currentYear}
            </h2>
            <button onClick={goToNextMonth} className="p-2 hover:bg-primaryColor/10 rounded-full">
              <PiCaretRight />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button className="text-sm px-3 py-1 rounded-xl bg-primaryColor text-white">{t('calendar.month')}</button>
            <button className="text-sm px-3 py-1 rounded-xl text-n300 hover:bg-primaryColor/10">{t('calendar.week')}</button>
            <button className="text-sm px-3 py-1 rounded-xl text-n300 hover:bg-primaryColor/10">{t('calendar.day')}</button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {[t('calendar.sun'), t('calendar.mon'), t('calendar.tue'), t('calendar.wed'), t('calendar.thu'), t('calendar.fri'), t('calendar.sat')].map(day => (
            <div key={day} className="p-2 font-medium text-center">{day}</div>
          ))}
          {!isMounted ? (
            <div className="col-span-7 py-10 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primaryColor border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            </div>
          ) : isLoading ? (
            <div className="col-span-7 py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primaryColor border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2 text-n300">{t('calendar.loadingEvents')}</p>
            </div>
          ) : error ? (
            <div className="col-span-7 py-10 text-center text-errorColor">
              {t('calendar.failedToLoad')}
            </div>
          ) : (
            days
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-primaryColor/20 p-4">
        <h3 className="font-medium mb-3">{t('calendar.upcomingEvents')}</h3>
        {!isMounted ? (
          <div className="py-10 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primaryColor border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          </div>
        ) : isLoading ? (
          <div className="py-10 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primaryColor border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          </div>
        ) : upcomingEvents.length > 0 ? (
          <div className="space-y-2">
            {upcomingEvents.map(event => (
              <div 
                key={event.id} 
                className="flex items-center gap-3 p-2 border-b border-primaryColor/10 cursor-pointer hover:bg-primaryColor/5 rounded"
                onClick={() => handleEventClick(event)}
              >
                <div className={`w-3 h-3 rounded-full ${eventTypeColors[event.type] || 'bg-primaryColor'}`}></div>
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-xs text-n300 dark:text-n400">
                    {formatEventDate(event.start_time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-n300">
            {t('calendar.noUpcomingEvents')}
          </div>
        )}
      </div>

      {/* Event Create/Edit Modal */}
      {isMounted && (
        <CalendarEventModal
          isOpen={isCreateModalOpen}
          onClose={handleCloseCreateModal}
          onSubmit={handleCreateOrUpdateEvent}
          initialEvent={isEditMode ? selectedEvent || undefined : undefined}
          isLoading={submitLoading}
        />
      )}

      {/* Event Details Modal */}
      {isMounted && selectedEvent && (
        <CalendarEventDetails
          event={selectedEvent}
          isOpen={isEventDetailsOpen}
          onClose={handleCloseEventDetails}
          onEdit={handleEditEvent}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {isMounted && (
        <ConfirmDialog
          isOpen={isDeleteConfirmOpen}
          title={t('calendar.deleteEventTitle')}
          message={t('calendar.deleteConfirmMessage')}
          confirmText={t('calendar.deleteBtn')}
          onConfirm={confirmDeleteEvent}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      )}
    </div>
  );
};

export default Calendar; 