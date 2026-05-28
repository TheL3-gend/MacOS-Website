import React from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarPanelProps {
  currentDate: Date;
  isPhoneLandscape?: boolean;
}

const getMonthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const YEARS_PER_PAGE = 12;

const isSameDay = (firstDate: Date, secondDate: Date) =>
  firstDate.getFullYear() === secondDate.getFullYear() &&
  firstDate.getMonth() === secondDate.getMonth() &&
  firstDate.getDate() === secondDate.getDate();

const getYearPageStart = (year: number) => year - (year % YEARS_PER_PAGE);

const getLocaleWeekStart = () => {
  if (typeof navigator === 'undefined' || typeof Intl.Locale === 'undefined') {
    return 0;
  }

  try {
    const locale = new Intl.Locale(navigator.language) as Intl.Locale & {
      weekInfo?: { firstDay?: number };
    };
    return typeof locale.weekInfo?.firstDay === 'number' ? locale.weekInfo.firstDay % 7 : 0;
  } catch {
    return 0;
  }
};

export const CalendarPanel: React.FC<CalendarPanelProps> = ({
  currentDate,
  isPhoneLandscape = false,
}) => {
  const [visibleMonth, setVisibleMonth] = React.useState(() => getMonthStart(currentDate));
  const [isYearPickerOpen, setIsYearPickerOpen] = React.useState(false);
  const [yearPageStart, setYearPageStart] = React.useState(() => (
    getYearPageStart(currentDate.getFullYear())
  ));
  const weekStart = React.useMemo(() => getLocaleWeekStart(), []);
  const visibleYear = visibleMonth.getFullYear();

  const monthLabel = visibleMonth.toLocaleDateString([], {
    month: 'long',
  });
  const monthTitle = visibleMonth.toLocaleDateString([], {
    month: 'long',
    year: 'numeric',
  });
  const fullDate = currentDate.toLocaleDateString([], {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const weekdayLabels = React.useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(2020, 5, 7 + weekStart + index);
        return date.toLocaleDateString([], { weekday: 'short' });
      }),
    [weekStart],
  );

  const calendarDays = React.useMemo(() => {
    const month = visibleMonth.getMonth();
    const firstOfMonth = new Date(visibleYear, month, 1);
    const leadingDays = (firstOfMonth.getDay() - weekStart + 7) % 7;
    const gridStart = new Date(visibleYear, month, 1 - leadingDays);

    return Array.from({ length: 42 }, (_, index) => (
      new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    ));
  }, [visibleMonth, visibleYear, weekStart]);

  const yearOptions = React.useMemo(
    () => Array.from({ length: YEARS_PER_PAGE }, (_, index) => yearPageStart + index),
    [yearPageStart],
  );

  const goToPreviousMonth = () => {
    setIsYearPickerOpen(false);
    setVisibleMonth((month) => {
      const nextMonth = new Date(month.getFullYear(), month.getMonth() - 1, 1);
      setYearPageStart(getYearPageStart(nextMonth.getFullYear()));
      return nextMonth;
    });
  };

  const goToNextMonth = () => {
    setIsYearPickerOpen(false);
    setVisibleMonth((month) => {
      const nextMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
      setYearPageStart(getYearPageStart(nextMonth.getFullYear()));
      return nextMonth;
    });
  };

  const goToToday = () => {
    setVisibleMonth(getMonthStart(currentDate));
    setYearPageStart(getYearPageStart(currentDate.getFullYear()));
    setIsYearPickerOpen(false);
  };

  const toggleYearPicker = () => {
    setYearPageStart(getYearPageStart(visibleYear));
    setIsYearPickerOpen((isOpen) => !isOpen);
  };

  const goToPreviousYearPage = () => {
    setYearPageStart((startYear) => startYear - YEARS_PER_PAGE);
  };

  const goToNextYearPage = () => {
    setYearPageStart((startYear) => startYear + YEARS_PER_PAGE);
  };

  const chooseYear = (year: number) => {
    setVisibleMonth((month) => new Date(year, month.getMonth(), 1));
    setYearPageStart(getYearPageStart(year));
    setIsYearPickerOpen(false);
  };

  return (
    <div
      data-testid="calendar-panel"
      style={{ background: 'rgba(10, 10, 12, 0.82)' }}
      className={`rounded-2xl glass-panel-dark text-white border border-white/10 shadow-2xl flex flex-col animate-panel-in ${
        isPhoneLandscape
          ? 'w-[min(300px,calc(100vw-20px))] max-h-[calc(100dvh-48px)] overflow-y-auto p-2.5 gap-2'
          : 'w-[300px] p-3 gap-2.5'
      }`}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-white/[0.16] dark:bg-black/35 border border-white/10 p-3">
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center">
          <CalendarDays className="w-4 h-4" />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-white/55">Today</span>
          <span className="text-[13px] font-semibold leading-tight truncate">{fullDate}</span>
        </div>
      </div>

      <div className="rounded-2xl bg-white/[0.16] dark:bg-black/35 border border-white/10 p-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            key={monthTitle}
            data-testid="calendar-month-title"
            className="calendar-title-in flex items-center gap-1 text-[14px] font-bold leading-none"
          >
            <span>{monthLabel} </span>
            <button
              type="button"
              data-testid="calendar-year-button"
              aria-expanded={isYearPickerOpen}
              aria-label={`Choose year ${visibleYear}`}
              onClick={toggleYearPicker}
              className="rounded-md px-1.5 py-1 -my-1 text-white/90 hover:bg-white/15 hover:text-white transition-all"
            >
              {visibleYear}
            </button>
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Previous month"
              onClick={goToPreviousMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 hover:text-white transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={goToNextMonth}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 hover:text-white transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isYearPickerOpen && (
          <div
            data-testid="calendar-year-picker"
            className="calendar-year-picker-in mt-3 rounded-xl bg-black/25 border border-white/10 p-2"
          >
            <div className="flex items-center justify-between gap-2 px-1 pb-2">
              <button
                type="button"
                aria-label="Previous year range"
                onClick={goToPreviousYearPage}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 hover:text-white transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-white/70">
                {yearPageStart} - {yearPageStart + YEARS_PER_PAGE - 1}
              </span>
              <button
                type="button"
                aria-label="Next year range"
                onClick={goToNextYearPage}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white/80 hover:bg-white/15 hover:text-white transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div key={yearPageStart} className="calendar-year-grid-in grid grid-cols-4 gap-1">
              {yearOptions.map((year) => {
                const isVisibleYear = year === visibleYear;
                const isCurrentYear = year === currentDate.getFullYear();

                return (
                  <button
                    key={year}
                    type="button"
                    aria-label={`Show ${year}`}
                    onClick={() => chooseYear(year)}
                    className={`h-8 rounded-lg text-[12px] font-semibold transition-all ${
                      isVisibleYear
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/30'
                        : isCurrentYear
                          ? 'bg-white/15 text-white'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {year}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 mt-3 text-center">
          {weekdayLabels.map((label) => (
            <div
              key={label}
              className="h-6 flex items-center justify-center text-[10px] font-bold text-white/45"
            >
              {label}
            </div>
          ))}
        </div>

        <div
          key={monthTitle}
          role="grid"
          aria-label={monthTitle}
          className="calendar-grid-in grid grid-cols-7 gap-1"
        >
          {calendarDays.map((day) => {
            const isCurrentMonth = day.getMonth() === visibleMonth.getMonth();
            const isToday = isSameDay(day, currentDate);

            return (
              <div
                key={day.toISOString()}
                role="gridcell"
                aria-current={isToday ? 'date' : undefined}
                className={`h-8 rounded-full flex items-center justify-center text-[12px] transition-all ${
                  isToday
                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-950/30'
                    : isCurrentMonth
                      ? 'text-white/90 hover:bg-white/10'
                      : 'text-white/30'
                }`}
              >
                {day.getDate()}
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={goToToday}
        className="w-full text-center py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 text-[10px] font-bold tracking-wide border border-white/5 transition-all text-white/90"
      >
        Today
      </button>
    </div>
  );
};
