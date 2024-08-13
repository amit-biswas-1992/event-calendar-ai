'use client'
import React, { useState, useCallback } from 'react';

interface Event {
  category: string;
  event: string;
}

interface CalendarDay {
  day: number | string;
  date: Date | null;
}

const EventPopup: React.FC<{
  date: Date;
  events: Event[];
  onClose: () => void;
}> = ({ date, events, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
      <h3 className="text-xl font-bold mb-4">
        Events on {date.toDateString()}
      </h3>
      {events.length > 0 ? (
        <div>
          {events.map((event, index) => (
            <div key={index} className="mb-2 p-2 bg-gray-100 rounded">
              <div className="font-bold text-indigo-600">{event.category}</div>
              <div>{event.event}</div>
            </div>
          ))}
        </div>
      ) : (
        <p>No events for this date.</p>
      )}
      <button 
        onClick={onClose}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Close
      </button>
    </div>
  </div>
);

const EventCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const daysOfWeek: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const fetchEventsForDate = useCallback(async (date: Date): Promise<void> => {
    setIsLoading(true);
    setError(null);
    const month = encodeURIComponent(monthNames[date.getMonth()]);
    const day = encodeURIComponent(date.getDate().toString());
    const formattedDate = `${month}%20${day}`;
    
    try {
      const response = await fetch(`/api/events?date=${formattedDate}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const fetchedEvents: Event[] = await response.json();
      setEvents(fetchedEvents);
    } catch (error) {
      console.error(`Error fetching events for ${formattedDate}:`, error);
      setError(`Failed to fetch events: ${error instanceof Error ? error.message : String(error)}`);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, [monthNames]);

  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = getFirstDayOfMonth(year, month);
    const days: CalendarDay[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ day: '', date: null });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({ day, date });
    }

    return days;
  };

  const handlePrevMonth = (): void => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = (): void => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDateClick = (date: Date): void => {
    setSelectedDate(date);
    fetchEventsForDate(date);
  };

  const handleClosePopup = (): void => {
    setSelectedDate(null);
    setEvents([]);
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="max-w-4xl mx-auto mt-10 bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-blue-600 text-white">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-blue-700">
          &lt;
        </button>
        <h2 className="text-xl font-bold">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-blue-700">
          &gt;
        </button>
      </div>
      <div className="grid grid-cols-7 bg-gray-100">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-bold py-2 border-b">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`h-24 border p-1 ${
              day.date
                ? 'cursor-pointer hover:bg-gray-100'
                : 'bg-gray-50'
            } ${
              selectedDate && day.date && selectedDate.getTime() === day.date.getTime()
                ? 'bg-blue-100'
                : ''
            }`}
            onClick={() => day.date && handleDateClick(day.date)}
          >
            <span className="float-right">{day.day}</span>
          </div>
        ))}
      </div>
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      {selectedDate && !isLoading && !error && (
        <EventPopup
          date={selectedDate}
          events={events}
          onClose={handleClosePopup}
        />
      )}
    </div>
  );
};

export default EventCalendar;