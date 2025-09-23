'use client';

import { useState, useEffect } from 'react';

interface PlannerData {
  Date: string;
  'Holiday Only': boolean;
  'Time Range': string;
  'Location Name': string;
  'Location Address': string;
  'City Name': string;
  Coordinate: {
    lat: number;
    lng: number;
  };
  'Probability for 2025': {
    probability: number;
    detail: string;
    statisticsreasoning: string;
  };
}

const PlannerPage = () => {
  const [data, setData] = useState<PlannerData[]>([]);
  const [filteredData, setFilteredData] = useState<PlannerData[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [timeRanges, setTimeRanges] = useState<string[]>([]);

  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('');

  useEffect(() => {
    // This is a placeholder for fetching the list of available months.
    // In a real app, you might scan the /public/planner-data directory.
    const availableMonths = ['2025-09']; // Hardcoded for now
    setMonths(availableMonths);
    if (availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0]);
    }
  }, []);

  useEffect(() => {
    if (!selectedMonth) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`/planner-data/${selectedMonth}.json`);
        const jsonData: PlannerData[] = await response.json();
        setData(jsonData);
        setFilteredData(jsonData);

        // Populate filter dropdowns
        const uniqueCities = [...new Set(jsonData.map(item => item['City Name']))];
        const uniqueTimeRanges = [...new Set(jsonData.map(item => item['Time Range']))];
        setCities(uniqueCities);
        setTimeRanges(uniqueTimeRanges);

      } catch (error) {
        console.error('Error fetching planner data:', error);
        setData([]);
        setFilteredData([]);
      }
    };

    fetchData();
  }, [selectedMonth]);

  useEffect(() => {
    let result = data;

    if (selectedCity) {
        result = result.filter(item => item['City Name'] === selectedCity);
    }

    if (selectedTimeRange) {
        result = result.filter(item => item['Time Range'] === selectedTimeRange);
    }

    setFilteredData(result);
  }, [selectedCity, selectedTimeRange, data]);


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Monthly Rideshare Planner</h1>

      {/* Configuration Bar */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6 flex space-x-4 items-center">
         <div>
            <label htmlFor="month-select" className="block text-sm font-medium text-gray-700">Month</label>
            <select 
                id="month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
                {months.map(month => <option key={month} value={month}>{month}</option>)}
            </select>
         </div>
         <div>
            <label htmlFor="city-select" className="block text-sm font-medium text-gray-700">City</label>
            <select 
                id="city-select"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
                <option value="">All Cities</option>
                {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
         </div>
         <div>
            <label htmlFor="time-range-select" className="block text-sm font-medium text-gray-700">Time Range</label>
            <select 
                id="time-range-select"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
            >
                <option value="">All Time Ranges</option>
                {timeRanges.map(range => <option key={range} value={range}>{range}</option>)}
            </select>
         </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Range</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.map((item, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Date}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item['Time Range']}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{item['Location Name']}</div>
                    <div className="text-xs text-gray-500">{item['Location Address']}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item['City Name']}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(item['Probability for 2025'].probability * 100).toFixed(0)}%</td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">{item['Probability for 2025'].detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlannerPage;
