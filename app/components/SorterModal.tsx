import { useState, useEffect } from "react";
import { format, addMinutes, addHours } from "date-fns";

interface SortOptions {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  weeks: string[];
  onlySameMonth: boolean;
  aMonthBefore: boolean;
  aMonthAfter: boolean;
}

interface SorterModalProps {
  onClose: () => void;
  onApply: (options: SortOptions) => void;
}

const SORT_OPTIONS_KEY = "imageSortOptions";
const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getDefaultOptions(): SortOptions {
  const now = new Date();
  const threeYearsAgo = new Date(now);
  threeYearsAgo.setFullYear(now.getFullYear() - 3);
  const later = addMinutes(now, 15);

  return {
    startDate: format(threeYearsAgo, "yyyy-MM-dd"),
    endDate: format(now, "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endTime: format(later, "HH:mm"),
    weeks: [DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1]],
    onlySameMonth: false,
    aMonthBefore: false,
    aMonthAfter: false,
  };
}

const DEFAULT_OPTIONS = getDefaultOptions();

export function SorterModal({ onClose, onApply }: SorterModalProps) {
  const [options, setOptions] = useState<SortOptions>(() => {
    if (typeof window === "undefined") return DEFAULT_OPTIONS;

    const saved = localStorage.getItem(SORT_OPTIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...DEFAULT_OPTIONS,
          ...parsed,
          weeks: Array.isArray(parsed.weeks) ? parsed.weeks : [],
          onlySameMonth: typeof parsed.onlySameMonth === 'boolean' ? parsed.onlySameMonth : false,
          aMonthBefore: typeof parsed.aMonthBefore === 'boolean' ? parsed.aMonthBefore : false,
          aMonthAfter: typeof parsed.aMonthAfter === 'boolean' ? parsed.aMonthAfter : false,
        };
      } catch (e) {
        console.error("Error parsing saved sort options:", e);
        return DEFAULT_OPTIONS;
      }
    }
    return DEFAULT_OPTIONS;
  });

  useEffect(() => {
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(options));
  }, [options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOptions((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleWeekChange = (day: string) => {
    setOptions((prev) => ({
      ...prev,
      weeks: prev.weeks.includes(day)
        ? prev.weeks.filter((d) => d !== day)
        : [...prev.weeks, day],
    }));
  };

  const handleAMonthBeforeChange = () => {
    setOptions((prev) => ({
      ...prev,
      aMonthBefore: !prev.aMonthBefore,
    }));
  };

  const handleAMonthAfterChange = () => {
    setOptions((prev) => ({
      ...prev,
      aMonthAfter: !prev.aMonthAfter,
    }));
  };

  const handleOnlySameMonthChange = () => {
    setOptions((prev) => ({
      ...prev,
      onlySameMonth: !prev.onlySameMonth,
    }));
  };

  const handleNext15Minutes = () => {
    const now = new Date();
    const threeYearsAgo = new Date(now);
    threeYearsAgo.setFullYear(now.getFullYear() - 3);
    const later = addMinutes(now, 15);
    const currentDay = DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1];

    setOptions((prev) => ({
      ...prev,
      startTime: format(now, "HH:mm"),
      endTime: format(later, "HH:mm"),
      startDate: format(threeYearsAgo, "yyyy-MM-dd"),
      endDate: format(now, "yyyy-MM-dd"),
      weeks: [currentDay],
    }));
  };

  const handleNextHour = () => {
    const now = new Date();
    const threeYearsAgo = new Date(now);
    threeYearsAgo.setFullYear(now.getFullYear() - 3);
    const later = addHours(now, 1);
    const currentDay = DAYS_OF_WEEK[now.getDay() === 0 ? 6 : now.getDay() - 1];

    setOptions((prev) => ({
      ...prev,
      startTime: format(now, "HH:mm"),
      endTime: format(later, "HH:mm"),
      startDate: format(threeYearsAgo, "yyyy-MM-dd"),
      endDate: format(now, "yyyy-MM-dd"),
      weeks: [currentDay],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(options);
  };

  const handleClear = () => {
    setOptions(DEFAULT_OPTIONS);
    localStorage.setItem(SORT_OPTIONS_KEY, JSON.stringify(DEFAULT_OPTIONS));
    onApply(DEFAULT_OPTIONS);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sort Options</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={options.startDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={options.endDate}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleNext15Minutes}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Next 15 Min
                  </button>
                  <button
                    type="button"
                    onClick={handleNextHour}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Next 1 Hour
                  </button>
                </div>
              </div>
              <input
                type="time"
                name="startTime"
                value={options.startTime}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                value={options.endTime}
                onChange={handleInputChange}
                className="w-full border rounded p-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.onlySameMonth}
                  onChange={handleOnlySameMonthChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Only Same Month</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Filter images to only show those from the same month as today (August) across all years in the date range
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.aMonthBefore}
                  onChange={handleAMonthBeforeChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">A Month Before</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Include images from the month before the current month (July).
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.aMonthAfter}
                  onChange={handleAMonthAfterChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">A Month After</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Include images from the month after the current month (September).
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Days of Week
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <label
                    key={day}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={options.weeks.includes(day)}
                      onChange={() => handleWeekChange(day)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{day}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 text-red-600 hover:text-red-800 font-medium"
            >
              Clear All
            </button>
            <div className="space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
              >
                Apply
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
