"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import {
  FaMoneyBillWave,
  FaShoppingCart,
  FaCoins,
  FaChartLine,
} from "react-icons/fa";
import { MdDateRange, MdRefresh } from "react-icons/md";

// Note: Usually client-side fetches don't need the full domain (process.env.NEXT_PUBLIC_API_URL)
// if calling the same Next.js server. Using a relative path like '/api/profit' is safer and avoids CORS.
const ProfitPage = () => {
  const [dates, setDates] = useState({
    startDate: "",
    endDate: "",
  });

  // Default Stats State
  const [stats, setStats] = useState({
    totalProfit: 0,
    totalRevenue: 0,
    totalCost: 0,
    totalItemsSold: 0,
  });

  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState("All Time"); // "All Time" or "Filtered"

  // 1. Fetch Data Function using FETCH
  const fetchProfit = async (isFiltered = false) => {
    setLoading(true);
    try {
      let url = `/api/admin/profit`; // Relative path

      // If user clicked Filter, append query params
      if (isFiltered && dates.startDate && dates.endDate) {
        const end = new Date(dates.endDate);
        end.setHours(23, 59, 59, 999); // Ensure we get the full end day
        url += `?startDate=${dates.startDate}&endDate=${end.toISOString()}`;
        setViewType(`${dates.startDate} to ${dates.endDate}`);
      } else {
        setViewType("All Time");
      }

      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch profit data");
    } finally {
      setLoading(false);
    }
  };

  // 2. Load "All Time" data initially on mount
  useEffect(() => {
    fetchProfit(false);
  }, []);

  const handleFilterSubmit = () => {
    if (!dates.startDate || !dates.endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    fetchProfit(true);
  };

  const handleReset = () => {
    setDates({ startDate: "", endDate: "" });
    fetchProfit(false);
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 text-gray-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Profit Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Viewing Data:{" "}
            <span className="font-semibold text-blue-600">{viewType}</span>
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            Start Date
          </label>
          <div className="relative">
            <MdDateRange className="absolute left-3 top-3 text-gray-400" />
            <input
              type="date"
              className="border pl-10 p-2 rounded w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dates.startDate}
              onChange={(e) =>
                setDates({ ...dates, startDate: e.target.value })
              }
            />
          </div>
        </div>

        <div className="flex-1 w-full">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
            End Date
          </label>
          <div className="relative">
            <MdDateRange className="absolute left-3 top-3 text-gray-400" />
            <input
              type="date"
              className="border pl-10 p-2 rounded w-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dates.endDate}
              onChange={(e) => setDates({ ...dates, endDate: e.target.value })}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleFilterSubmit}
            disabled={loading}
            className="bg-[#242833] text-white px-6 py-2 rounded shadow hover:bg-black transition-all flex items-center gap-2"
          >
            {loading ? "Loading..." : "Filter"}
          </button>

          <button
            onClick={handleReset}
            disabled={loading}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded shadow hover:bg-gray-300 transition-all flex items-center gap-2"
          >
            <MdRefresh className="text-xl" /> Reset
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Calculating financial data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Revenue
                </p>
                <h3 className="text-2xl font-bold text-gray-800">
                  ৳ {stats.totalRevenue?.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full text-blue-500">
                <FaMoneyBillWave className="text-xl" />
              </div>
            </div>
          </div>

          {/* Total Cost (Buying Price) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-orange-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Buying Cost
                </p>
                <h3 className="text-2xl font-bold text-gray-800">
                  ৳ {stats.totalCost?.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                <FaCoins className="text-xl" />
              </div>
            </div>
          </div>

          {/* Net Profit */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full -mr-4 -mt-4 opacity-50"></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-bold text-green-600 mb-1 uppercase tracking-wide">
                  Net Profit
                </p>
                <h3 className="text-3xl font-extrabold text-green-700">
                  ৳ {stats.totalProfit?.toLocaleString()}
                </h3>
                {stats.totalRevenue > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    Margin:{" "}
                    {((stats.totalProfit / stats.totalRevenue) * 100).toFixed(
                      1
                    )}
                    %
                  </p>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <FaChartLine className="text-xl" />
              </div>
            </div>
          </div>

          {/* Items Sold */}
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-purple-500">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">
                  Total Items Sold
                </p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {stats.totalItemsSold?.toLocaleString()}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-full text-purple-500">
                <FaShoppingCart className="text-xl" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfitPage;
