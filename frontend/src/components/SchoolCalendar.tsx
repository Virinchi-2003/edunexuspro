import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Users,
  Bell
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { toast } from 'sonner';
import { isToday } from 'date-fns';

const SchoolCalendar: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [events, setEvents] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedDay, setSelectedDay] = React.useState<number | null>(new Date().getDate());
  const [selectedDayEvents, setSelectedDayEvents] = React.useState<any[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Fetch events on mount and schoolId change
  const fetchEvents = React.useCallback(async () => {
    if (!user?.schoolId) return;
    try {
      setLoading(true);
      const res = await api.get(`/announcements/${user.schoolId}`);
      // Filter for events and holidays
      const filtered = (res.data.data || []).filter(
        (ann: any) => ann.type === 'event' || ann.type === 'holiday'
      );
      setEvents(filtered);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      toast.error('Failed to sync calendar events');
    } finally {
      setLoading(false);
    }
  }, [user?.schoolId]);

  React.useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Days in month calculation
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Previous month padding days
  const prevDaysInMonth = new Date(year, month, 0).getDate();
  const prevMonthPadding = [];
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    prevMonthPadding.push(prevDaysInMonth - i);
  }

  // Next month padding days
  const totalCells = 42;
  const nextMonthPaddingCount = totalCells - (prevMonthPadding.length + daysInMonth);
  const nextMonthPadding = [];
  for (let i = 1; i <= nextMonthPaddingCount; i++) {
    nextMonthPadding.push(i);
  }

  // Helper to check events for a specific day
  const getEventsForDay = React.useCallback((day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.postedAt);
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    });
  }, [events, month, year]);

  // Update selected day's events when selectedDay or events/currentDate changes
  React.useEffect(() => {
    if (selectedDay !== null) {
      setSelectedDayEvents(getEventsForDay(selectedDay));
    } else {
      setSelectedDayEvents([]);
    }
  }, [selectedDay, events, currentDate, getEventsForDay]);

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDay(null);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 bg-slate-50/50 p-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">School Calendar</CardTitle>
            <p className="text-slate-400 text-xs font-semibold">Events & Holiday Planner</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleToday}
            className="rounded-xl border-slate-200 bg-white font-bold text-xs shadow-sm h-8"
          >
            Today
          </Button>
          <div className="flex items-center rounded-xl border border-slate-200 bg-white p-0.5 shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrevMonth}
              className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-3 text-xs font-bold text-slate-700 select-none">
              {monthNames[month]} {year}
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleNextMonth}
              className="h-7 w-7 rounded-lg text-slate-500 hover:text-slate-900"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex flex-col flex-1 gap-6">
        {/* Calendar Grid */}
        <div className="space-y-2 select-none">
          {/* Days of week */}
          <div className="grid grid-cols-7 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(day => (
              <span key={day} className="text-xs font-bold text-slate-400 py-1 uppercase tracking-wider">
                {day}
              </span>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Previous Month Padding */}
            {prevMonthPadding.map((day, idx) => (
              <div 
                key={`prev-${idx}`} 
                className="h-11 rounded-2xl flex items-center justify-center text-slate-300 text-xs font-semibold bg-slate-50/20"
              >
                {day}
              </div>
            ))}

            {/* Current Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayEvents = getEventsForDay(dayNum);
              const isSelected = selectedDay === dayNum;
              const isCellToday = isToday(new Date(year, month, dayNum));
              
              const eventDotColor = dayEvents.some(e => e.type === 'holiday') 
                ? 'bg-amber-500' 
                : 'bg-emerald-500';

              return (
                <button
                  key={`day-${dayNum}`}
                  onClick={() => setSelectedDay(dayNum)}
                  className={`
                    h-11 rounded-2xl flex flex-col items-center justify-center relative transition-all duration-200 group
                    ${isSelected 
                      ? 'bg-primary text-white font-bold shadow-lg shadow-primary/25 scale-105' 
                      : 'hover:bg-slate-100 text-slate-700 font-semibold'
                    }
                    ${isCellToday && !isSelected ? 'border-2 border-primary/40 text-primary font-bold' : ''}
                  `}
                >
                  <span className="text-xs">{dayNum}</span>
                  {dayEvents.length > 0 && (
                    <span 
                      className={`
                        absolute bottom-1.5 w-1.5 h-1.5 rounded-full transition-transform duration-200 group-hover:scale-125
                        ${isSelected ? 'bg-white shadow' : eventDotColor}
                      `} 
                    />
                  )}
                </button>
              );
            })}

            {/* Next Month Padding */}
            {nextMonthPadding.map((day, idx) => (
              <div 
                key={`next-${idx}`} 
                className="h-11 rounded-2xl flex items-center justify-center text-slate-300 text-xs font-semibold bg-slate-50/20"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Selected Day / Active Events List */}
        <div className="flex-1 flex flex-col min-h-[160px] bg-slate-50/65 rounded-2xl border border-slate-100 p-4 overflow-y-auto">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6 text-slate-400 gap-2">
              <div className="w-5 h-5 border-2 border-slate-200 border-t-primary rounded-full animate-spin" />
              <span className="text-xs font-semibold">Updating planner...</span>
            </div>
          ) : selectedDayEvents.length > 0 ? (
            <div className="space-y-3 w-full">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Schedule for {monthNames[month]} {selectedDay}, {year}
                </span>
                <Badge variant="outline" className="bg-white border-slate-200 font-bold text-[10px] text-primary">
                  {selectedDayEvents.length} Event{selectedDayEvents.length > 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="space-y-2">
                {selectedDayEvents.map(event => (
                  <div 
                    key={event.id} 
                    className="p-3 bg-white rounded-xl border border-slate-100 hover:shadow-sm transition-all duration-200 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {event.type}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {event.title}
                        </h4>
                      </div>
                      <Badge className={`text-[9px] font-bold border-none uppercase tracking-wide px-2 py-0.5 rounded-md ${getPriorityColor(event.priority)}`}>
                        {event.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                      {event.content}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-50 text-[10px] text-slate-400 font-semibold">
                      {event.audience && (
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          Audience: {event.audience.toUpperCase()}
                        </span>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(event.postedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 gap-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <Bell className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <h4 className="text-slate-700 font-bold text-xs">No active schedules</h4>
                <p className="text-slate-400 text-[11px] mt-1 font-semibold leading-relaxed">
                  {selectedDay 
                    ? `There are no events or holidays logged for ${monthNames[month]} ${selectedDay}.`
                    : "Select a highlighted day to view academic schedules."
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SchoolCalendar;
