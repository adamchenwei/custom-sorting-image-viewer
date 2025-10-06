'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { format, parse, isSameDay, getMonth } from 'date-fns';

interface PlannerEvent {
  startDate: string;
  endDate: string;
  holidayOnly: boolean;
  startTime: string | null;
  endTime: string | null;
  locationName: string;
  locationAddress: string;
  cityName: string;
  coordinate: { lat: number; lng: number };
  headCount: number;
  probabilityFor2025: {
    probability: number;
    detail: string;
    statisticsreasoning: string;
  };
  schoolDays?: {
    duringBreaks: boolean;
    duringSchoolDays: boolean;
    schoolCountyName: string;
  };
  everyWeek?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  everyMonth?: { [month: number]: boolean };
  isPrivateRoute?: boolean;
}

const PlannerPageClient = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [data, setData] = useState<PlannerEvent[]>([]);
  const [filteredData, setFilteredData] = useState<PlannerEvent[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [schoolCounties, setSchoolCounties] = useState<string[]>([]);

  // Filter states
  const [selectedYear, setSelectedYear] = useState(() => searchParams.get('year') || '2025');
  const [selectedDate, setSelectedDate] = useState(() => 
    searchParams.get('date') ? parse(searchParams.get('date')!, 'yyyy-MM-dd', new Date()) : new Date()
  );
  const [selectedCity, setSelectedCity] = useState(() => searchParams.get('city') || '');
  const [selectedWeekdays, setSelectedWeekdays] = useState<Set<string>>(() => new Set(searchParams.getAll('weekday')));
  const [selectedStartTime, setSelectedStartTime] = useState(() => searchParams.get('startTime') || '');
  const [selectedEndTime, setSelectedEndTime] = useState(() => searchParams.get('endTime') || '');
  const [duringSchoolDays, setDuringSchoolDays] = useState(() => searchParams.get('duringSchoolDays') === 'true');
  const [duringBreaks, setDuringBreaks] = useState(() => searchParams.get('duringBreaks') === 'true');
  const [selectedSchoolCounty, setSelectedSchoolCounty] = useState(() => searchParams.get('schoolCounty') || '');
  const [selectedRouteType, setSelectedRouteType] = useState(() => searchParams.get('routeType') || 'all'); // 'all', 'public', 'private'
  const [selectedMonths, setSelectedMonths] = useState<Set<number>>(() => new Set(searchParams.getAll('month').map(Number)));

  useEffect(() => {
    const availableYears = ['2025', '2026']; // Hardcoded for now
    setYears(availableYears);
  }, []);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('year', selectedYear);
    params.set('date', format(selectedDate, 'yyyy-MM-dd'));
    if (selectedCity) params.set('city', selectedCity);
    selectedWeekdays.forEach(day => params.append('weekday', day));
    if (selectedStartTime) params.set('startTime', selectedStartTime);
    if (selectedEndTime) params.set('endTime', selectedEndTime);
    if (duringSchoolDays) params.set('duringSchoolDays', 'true');
    if (duringBreaks) params.set('duringBreaks', 'true');
    if (selectedSchoolCounty) params.set('schoolCounty', selectedSchoolCounty);
    if (selectedRouteType !== 'all') params.set('routeType', selectedRouteType);
    selectedMonths.forEach(month => params.append('month', month.toString()));

    router.push(`${pathname}?${params.toString()}`);
  }, [selectedYear, selectedDate, selectedCity, selectedWeekdays, selectedStartTime, selectedEndTime, duringSchoolDays, duringBreaks, selectedSchoolCounty, selectedRouteType, selectedMonths, pathname, router]);

  useEffect(() => {
    if (!selectedYear) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`/planner-data/surges-${selectedYear}.json`);
        const jsonData: PlannerEvent[] = await response.json();
        setData(jsonData);
        const uniqueCities = [...new Set(jsonData.map(item => item.cityName))].filter(Boolean).sort();
        setCities(uniqueCities);
        const uniqueSchoolCounties = [...new Set(jsonData.flatMap(item => item.schoolDays ? [item.schoolDays.schoolCountyName] : []))].filter(Boolean).sort();
        setSchoolCounties(uniqueSchoolCounties);
      } catch (error) {
        console.error('Error fetching planner data:', error);
        setData([]);
      }
    };

    fetchData();
  }, [selectedYear]);

  useEffect(() => {
    let result = data;

    // Date filter
    result = result.filter(item => isSameDay(parse(item.startDate, 'yyyy-MM-dd', new Date()), selectedDate));

    // City filter
    if (selectedCity) {
        result = result.filter(item => item.cityName === selectedCity);
    }

    // Weekday filter
    if (selectedWeekdays.size > 0) {
        const dayName = format(selectedDate, 'eeee').toLowerCase();
        if (!selectedWeekdays.has(dayName)) {
            result = [];
        }
    }

    // Hour filter

    // School days filter
    if (duringSchoolDays) {
        result = result.filter(item => item.schoolDays?.duringSchoolDays);
    }

    // School breaks filter
    if (duringBreaks) {
        result = result.filter(item => item.schoolDays?.duringBreaks);
    }

    // School county filter
    if (selectedSchoolCounty) {
        result = result.filter(item => item.schoolDays?.schoolCountyName === selectedSchoolCounty);
    }

    // Route type filter
    if (selectedRouteType === 'private') {
        result = result.filter(item => item.isPrivateRoute);
    } else if (selectedRouteType === 'public') {
        result = result.filter(item => !item.isPrivateRoute);
    }

    // Month filter
    if (selectedMonths.size > 0) {
        result = result.filter(item => {
            if (item.everyMonth) {
                const monthIndex = getMonth(selectedDate) + 1;
                return item.everyMonth[monthIndex];
            }
            return false; // if everyMonth is not defined, it does not match
        });
    }

    // Time range filter
    if (selectedStartTime && selectedEndTime) {
        result = result.filter(item => {
            if (!item.startTime || !item.endTime) return false;
            // Ensure selected times are valid for comparison
            const start = selectedStartTime;
            const end = selectedEndTime;
            return item.startTime <= end && item.endTime >= start;
        });
    }

    setFilteredData(result);
  }, [selectedDate, selectedCity, data, selectedWeekdays, selectedStartTime, selectedEndTime, duringSchoolDays, duringBreaks, selectedSchoolCounty, selectedRouteType, selectedMonths]);

  const formatTime = (time: string | null) => {
    if (!time) return 'N/A';
    try {
      return format(parse(time, 'HH:mm', new Date()), 'h:mm a');
    } catch (error) {
      console.error(`Invalid time value for formatting: ${time}`, error);
      return 'Invalid Time';
    }
  }

  const handleWeekdayChange = (day: string) => {
    const newSelection = new Set(selectedWeekdays);
    if (newSelection.has(day)) {
      newSelection.delete(day);
    } else {
      newSelection.add(day);
    }
    setSelectedWeekdays(newSelection);
  };

    const handleMonthChange = (month: number) => {
    const newSelection = new Set(selectedMonths);
    if (newSelection.has(month)) {
      newSelection.delete(month);
    } else {
      newSelection.add(month);
    }
    setSelectedMonths(newSelection);
  };


  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Rideshare Event Planner</h1>

      {/* Configuration Bar */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6 space-y-4">
        <div className="flex flex-wrap gap-4 items-center">
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700">Year</label>
              <select id="year-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="date-picker" className="block text-sm font-medium text-gray-700">Date</label>
              <input type="date" id="date-picker" value={format(selectedDate, 'yyyy-MM-dd')} onChange={(e) => setSelectedDate(parse(e.target.value, 'yyyy-MM-dd', new Date()))} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
            </div>
            <div>
              <label htmlFor="city-select" className="block text-sm font-medium text-gray-700">City</label>
              <select id="city-select" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                  <option value="">All Cities</option>
                  {cities.map(city => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
        </div>
        
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Day of Week</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                {weekdays.map(day => (
                    <div key={day} className="flex items-center">
                        <input id={`weekday-${day}`} type="checkbox" checked={selectedWeekdays.has(day)} onChange={() => handleWeekdayChange(day)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                        <label htmlFor={`weekday-${day}`} className="ml-2 block text-sm text-gray-900 capitalize">{day}</label>
                    </div>
                ))}
            </div>
        </div>

        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Month</label>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
                {months.map(month => (
                    <div key={month} className="flex items-center">
                        <input id={`month-${month}`} type="checkbox" checked={selectedMonths.has(month)} onChange={() => handleMonthChange(month)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                        <label htmlFor={`month-${month}`} className="ml-2 block text-sm text-gray-900">{format(new Date(2000, month - 1), 'MMMM')}</label>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex gap-4">
                <div>
                    <label htmlFor="start-time" className="block text-sm font-medium text-gray-700">Start Time</label>
                    <input type="time" id="start-time" value={selectedStartTime} onChange={(e) => setSelectedStartTime(e.target.value)} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
                </div>
                <div>
                    <label htmlFor="end-time" className="block text-sm font-medium text-gray-700">End Time</label>
                    <input type="time" id="end-time" value={selectedEndTime} onChange={(e) => setSelectedEndTime(e.target.value)} className="mt-1 block w-full pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" />
                </div>
            </div>
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">School Schedule</label>
                <div className="flex items-center">
                    <input id="school-days" type="checkbox" checked={duringSchoolDays} onChange={(e) => setDuringSchoolDays(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="school-days" className="ml-2 block text-sm text-gray-900">During School Days</label>
                </div>
                <div className="flex items-center">
                    <input id="school-breaks" type="checkbox" checked={duringBreaks} onChange={(e) => setDuringBreaks(e.target.checked)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                    <label htmlFor="school-breaks" className="ml-2 block text-sm text-gray-900">During Breaks</label>
                </div>
                <div>
                    <label htmlFor="school-county-select" className="block text-sm font-medium text-gray-700 sr-only">School County</label>
                    <select id="school-county-select" value={selectedSchoolCounty} onChange={(e) => setSelectedSchoolCounty(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="">Any County</option>
                        {schoolCounties.map(county => <option key={county} value={county}>{county}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Route Type</label>
                <select value={selectedRouteType} onChange={(e) => setSelectedRouteType(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                    <option value="all">All</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                </select>
            </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Headcount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item, index) => (
              <tr key={index} className={item.isPrivateRoute ? 'border-2 border-red-500' : ''}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(parse(item.startDate, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.startTime && item.endTime ? `${formatTime(item.startTime)} - ${formatTime(item.endTime)}` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{item.locationName}</div>
                    <div className="text-xs text-gray-500">{item.locationAddress}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.cityName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.headCount}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(item.probabilityFor2025.probability * 100).toFixed(0)}%</td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{item.probabilityFor2025.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlannerPageClient;
