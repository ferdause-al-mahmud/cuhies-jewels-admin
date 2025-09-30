"use client";
import { useState } from "react";

const SuccessRateModal = ({ phoneNumber }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rateData, setRateData] = useState(null);
  const [loading, setLoading] = useState(false);
  const checkSuccessRate = async (phone) => {
    setLoading(true);
    try {
      const response = await fetch("/api/pathao-success", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const result = await response.json();
      const customer = result?.data?.customer;

      const delivered = customer?.successful_delivery || 0;
      const processed = customer?.total_delivery || 0;

      const successRate = processed > 0 ? (delivered / processed) * 100 : 0;

      setRateData({
        successRate: successRate.toFixed(2), // optional: round to 2 decimals
        delivered: delivered,
        processed: processed,
        returned: processed - delivered,
      });

      setIsOpen(true);
    } catch (error) {
      console.error("Error checking success rate:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSuccessRateColor = (rate) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressBarColor = (rate) => {
    if (rate >= 80) return "bg-green-500";
    if (rate >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div>
      <button
        onClick={() => checkSuccessRate(phoneNumber)}
        disabled={loading}
        className={`
    bg-gradient-to-r from-blue-500 to-blue-600 
    hover:from-blue-600 hover:to-blue-700 
    text-white w-full px-2 mt-2 py-1 rounded-lg font-medium
    shadow-lg hover:shadow-xl transition-all duration-200
    transform hover:scale-105 active:scale-95
    disabled:opacity-50 disabled:cursor-not-allowed
    flex items-center gap-2
  `}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Checking...
          </>
        ) : (
          <>Check Success Rate</>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-200 animate-in fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Success Rate Analysis</h2>
                  <p className="text-orange-100 text-sm mt-1">
                    Customer delivery performance
                  </p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-orange-200 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-2 transition-all duration-200"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Main Success Rate Display */}
              <div className="text-center mb-6">
                <div
                  className={`text-6xl font-bold mb-2 ${getSuccessRateColor(
                    rateData?.successRate
                  )}`}
                >
                  {rateData?.successRate}%
                </div>
                <div className="text-gray-600 text-lg">Success Rate</div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Delivery Performance
                  </span>
                  <span
                    className={`text-sm font-bold ${getSuccessRateColor(
                      rateData?.successRate
                    )}`}
                  >
                    {rateData?.successRate}%
                  </span>
                </div>
                <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-3 ${getProgressBarColor(
                      rateData?.successRate
                    )} rounded-full transition-all duration-1000 ease-out`}
                    style={{ width: `${rateData?.successRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    {rateData?.processed}
                  </div>
                  <div className="text-sm text-blue-800 font-medium">
                    Total Orders
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    {rateData?.delivered}
                  </div>
                  <div className="text-sm text-green-800 font-medium">
                    Delivered
                  </div>
                </div>

                <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-center">
                  <div className="text-2xl font-bold text-red-600 mb-1">
                    {rateData?.returned}
                  </div>
                  <div className="text-sm text-red-800 font-medium">
                    Returned
                  </div>
                </div>
              </div>

              {/* Performance Indicator */}
              <div className="mt-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        rateData?.successRate >= 80
                          ? "bg-green-500"
                          : rateData?.successRate >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-sm font-medium text-gray-700">
                      {rateData?.successRate >= 80
                        ? "Excellent Performance"
                        : rateData?.successRate >= 60
                        ? "Good Performance"
                        : "Needs Improvement"}
                    </span>
                  </div>
                  <span
                    className={`text-sm font-bold ${getSuccessRateColor(
                      rateData?.successRate
                    )}`}
                  >
                    {rateData?.successRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessRateModal;
