"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Grid, Paper, CircularProgress } from "@mui/material";
import ImageManager from "@/app/Components/Dashboard/ImageManeger/ImageManager";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, subDays } from "date-fns";

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());

  // Aggregated data from API
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    manualOrdersCount: 0,
    webOrdersCount: 0,
    totalDeliveredSales: 0,
    totalWebSales: 0,
    totalManualSales: 0,
    deliveredOrdersCount: 0,
    deliveredManualOrdersCount: 0,
    deliveredWebOrdersCount: 0,
    pendingOrdersCount: 0,
    manualPendingOrdersCount: 0,
    webPendingOrdersCount: 0,
    shippedOrdersCount: 0,
    manualShippedOrdersCount: 0,
    webShippedOrdersCount: 0,
    returnedOrdersCount: 0,
    manualReturnedOrdersCount: 0,
    webReturnedOrdersCount: 0,
    revenueByMonth: {},
  });

  const formattedStartDate = format(startDate, "yyyy-MM-dd");
  const formattedEndDate = format(endDate, "yyyy-MM-dd");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `/api/all-orders?startDate=${formattedStartDate}&endDate=${formattedEndDate}&page=1&limit=1`
        );

        setDashboardData({
          totalOrders: response.data.totalOrders || 0,
          manualOrdersCount: response.data.manualOrdersCount || 0,
          webOrdersCount: response.data.webOrdersCount || 0,
          totalDeliveredSales: response.data.totalDeliveredSales || 0,
          totalWebSales: response.data.totalWebSales || 0,
          totalManualSales: response.data.totalManualSales || 0,
          deliveredOrdersCount: response.data.deliveredOrdersCount || 0,
          deliveredManualOrdersCount:
            response.data.deliveredManualOrdersCount || 0,
          deliveredWebOrdersCount: response.data.deliveredWebOrdersCount || 0,
          pendingOrdersCount: response.data.pendingOrdersCount || 0,
          manualPendingOrdersCount: response.data.manualPendingOrdersCount || 0,
          webPendingOrdersCount: response.data.webPendingOrdersCount || 0,
          shippedOrdersCount: response.data.shippedOrdersCount || 0,
          manualShippedOrdersCount: response.data.manualShippedOrdersCount || 0,
          webShippedOrdersCount: response.data.webShippedOrdersCount || 0,
          returnedOrdersCount: response.data.returnedOrdersCount || 0,
          manualReturnedOrdersCount:
            response.data.manualReturnedOrdersCount || 0,
          webReturnedOrdersCount: response.data.webReturnedOrdersCount || 0,
          revenueByMonth: response.data.revenueByMonth || {},
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [formattedStartDate, formattedEndDate]);

  const formatMonthYear = (date) => {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const d = new Date(date);
    return `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  };

  const currentMonth = Object.values(dashboardData.revenueByMonth)?.[0];
  // Assuming sorted newest first (Sep 2025, Aug 2025, etc.)

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={{ xs: 2, sm: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          marginBottom: { xs: 3, sm: 6 },
          fontSize: { xs: "1.75rem", sm: "2.125rem" },
        }}
      >
        Sales Analytics
      </Typography>
      <div className="flex gap-4 mb-6">
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />
          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            sx={{
              flex: 1,
              "& .MuiOutlinedInput-root": {
                borderRadius: 1.5,
              },
            }}
          />
        </LocalizationProvider>
      </div>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(1, 1fr)",
            md: "repeat(3, 1fr)",
          },
          gap: { xs: 2, sm: 3 },
          width: "100%",
        }}
      >
        <Paper
          elevation={4}
          sx={{
            padding: { xs: 2, sm: 3 },
            marginBottom: { md: 2 },
            width: "100%",
            background: "linear-gradient(135deg, #82ca9d 0%, #4caf50 100%)",
            color: "#fff",
            borderRadius: 2,
            transition:
              "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: 500,
              opacity: 0.9,
            }}
          >
            Total Sales (Delivered)
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", sm: "2.125rem" },
              fontWeight: 600,
            }}
          >
            ৳{dashboardData.totalDeliveredSales.toFixed(2)}
          </Typography>

          <Box
            sx={{
              pt: 1,
              mt: 1,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                opacity: 0.9,
              }}
            >
              Manual Order Revenue: ৳{dashboardData.totalManualSales.toFixed(2)}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                opacity: 0.9,
              }}
            >
              Web Order Revenue: ৳{dashboardData.totalWebSales.toFixed(2)}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={4}
          sx={{
            padding: { xs: 2, sm: 3 },
            marginBottom: { md: 2 },
            width: "100%",
            background: "linear-gradient(135deg, #29b6f6 0%, #0288d1 100%)",
            color: "#fff",
            borderRadius: 2,
            transition:
              "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: 500,
              opacity: 0.9,
            }}
          >
            Total Orders
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", sm: "2.125rem" },
              fontWeight: 600,
            }}
          >
            {dashboardData.totalOrders}
          </Typography>

          <Box
            sx={{
              pt: 1,
              mt: 1,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                opacity: 0.9,
              }}
            >
              Manual Order: {dashboardData.manualOrdersCount}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                opacity: 0.9,
              }}
            >
              Web Order: {dashboardData.webOrdersCount}
            </Typography>
          </Box>
        </Paper>

        <Paper
          elevation={4}
          sx={{
            marginBottom: { xs: 2 },
            width: "100%",
            padding: { xs: 2, sm: 3 },
            background: "linear-gradient(135deg, #ffb74d 0%, #f57c00 100%)",
            color: "#fff",
            borderRadius: 2,
            transition:
              "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
            "&:hover": {
              transform: "translateY(-4px)",
              boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontSize: { xs: "1rem", sm: "1.25rem" },
              fontWeight: 500,
              opacity: 0.9,
            }}
          >
            Total Delivered Orders
          </Typography>
          <Typography
            variant="h4"
            sx={{
              fontSize: { xs: "1.5rem", sm: "2.125rem" },
              fontWeight: 600,
            }}
          >
            {dashboardData.deliveredOrdersCount}
          </Typography>

          <Box
            sx={{
              pt: 1,
              mt: 1,
              borderTop: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                opacity: 0.9,
              }}
            >
              Manual Order: {dashboardData.deliveredManualOrdersCount}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                opacity: 0.9,
              }}
            >
              Web Order: {dashboardData.deliveredWebOrdersCount}
            </Typography>
          </Box>
        </Paper>
      </Box>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: { xs: 2, sm: 3 },
              width: "100%",
            }}
          >
            <Paper
              elevation={4}
              sx={{
                padding: { xs: 2, sm: 3 },
                background: "linear-gradient(135deg, #3f51b5 0%, #283593 100%)",
                color: "#fff",
                borderRadius: 2,
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  fontWeight: 500,
                  opacity: 0.9,
                }}
              >
                This Month&apos;s Sales (Delivered)
              </Typography>

              {currentMonth ? (
                <>
                  <Typography
                    variant="h4"
                    sx={{
                      fontSize: { xs: "1.5rem", sm: "2.125rem" },
                      fontWeight: 600,
                    }}
                  >
                    ৳{currentMonth.revenue.toFixed(2)}
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: "0.9rem", sm: "1rem" },
                      opacity: 0.8,
                    }}
                  >
                    Manual: ৳{currentMonth.manualSales.toFixed(2)} <br /> Web: ৳
                    {currentMonth.webSales.toFixed(2)}
                  </Typography>
                </>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, opacity: 0.7 }}
                >
                  No sales data available
                </Typography>
              )}
            </Paper>

            <Paper
              elevation={4}
              sx={{
                padding: { xs: 2, sm: 3 },
                background: "linear-gradient(135deg, #ffb74d 0%, #f57c00 100%)",
                color: "#fff",
                borderRadius: 2,
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  fontWeight: 500,
                  opacity: 0.9,
                }}
              >
                Delivered Orders (Date Wise)
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2.125rem" },
                  fontWeight: 600,
                }}
              >
                {dashboardData.deliveredOrdersCount}
              </Typography>

              <Box
                sx={{
                  pt: 1,
                  mt: 1,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Manual Order: {dashboardData.deliveredManualOrdersCount}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Web Order: {dashboardData.deliveredWebOrdersCount}
                </Typography>
              </Box>
            </Paper>

            <Paper
              elevation={4}
              sx={{
                padding: { xs: 2, sm: 3 },
                background: "linear-gradient(135deg, #9c27b0 0%, #6a1b9a 100%)",
                color: "#fff",
                borderRadius: 2,
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  fontWeight: 500,
                  opacity: 0.9,
                }}
              >
                Pending Orders (Date Wise)
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2.125rem" },
                  fontWeight: 600,
                }}
              >
                {dashboardData.pendingOrdersCount}
              </Typography>

              <Box
                sx={{
                  pt: 1,
                  mt: 1,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Manual Order: {dashboardData.manualPendingOrdersCount}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Web Order: {dashboardData.webPendingOrdersCount}
                </Typography>
              </Box>
            </Paper>

            <Paper
              elevation={4}
              sx={{
                padding: { xs: 2, sm: 3 },
                background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)",
                color: "#fff",
                borderRadius: 2,
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  fontWeight: 500,
                  opacity: 0.9,
                }}
              >
                Shipped Orders (Date Wise)
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2.125rem" },
                  fontWeight: 600,
                }}
              >
                {dashboardData.shippedOrdersCount}
              </Typography>

              <Box
                sx={{
                  pt: 1,
                  mt: 1,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Manual Order: {dashboardData.manualShippedOrdersCount}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Web Order: {dashboardData.webShippedOrdersCount}
                </Typography>
              </Box>
            </Paper>

            <Paper
              elevation={4}
              sx={{
                padding: { xs: 2, sm: 3 },
                background: "linear-gradient(135deg, #ff7043 0%, #e64a19 100%)",
                color: "#fff",
                borderRadius: 2,
                transition:
                  "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
                },
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontSize: { xs: "1rem", sm: "1.25rem" },
                  fontWeight: 500,
                  opacity: 0.9,
                }}
              >
                Returned Orders (Date Wise)
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2.125rem" },
                  fontWeight: 600,
                }}
              >
                {dashboardData.returnedOrdersCount}
              </Typography>

              <Box
                sx={{
                  pt: 1,
                  mt: 1,
                  borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Manual Order: {dashboardData.manualReturnedOrdersCount}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Web Order: {dashboardData.webReturnedOrdersCount}
                </Typography>
              </Box>
            </Paper>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              padding: { xs: 2, sm: 3 },
              bgcolor: "white",
            }}
          >
            <Typography
              variant="h6"
              gutterBottom
              sx={{
                fontSize: { xs: "1rem", sm: "1.25rem" },
                marginBottom: 2,
              }}
            >
              Monthly Revenue Breakdown
            </Typography>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50">
                    <th className="border px-4 py-2 text-left">Month</th>
                    <th className="border px-4 py-2 text-right">
                      Total Revenue (৳)
                    </th>
                    <th className="border px-4 py-2 text-right">
                      Manual Sales (৳)
                    </th>
                    <th className="border px-4 py-2 text-right">
                      Web Sales (৳)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(dashboardData.revenueByMonth).length > 0 ? (
                    Object.values(dashboardData.revenueByMonth)
                      .sort((a, b) => {
                        const dateA = new Date(a.month);
                        const dateB = new Date(b.month);
                        return dateB - dateA;
                      })
                      .map((data) => (
                        <tr key={data.month} className="hover:bg-gray-50">
                          <td className="border px-4 py-2">{data.month}</td>
                          <td className="border px-4 py-2 text-right">
                            {data.revenue.toFixed(2)}
                          </td>
                          <td className="border px-4 py-2 text-right">
                            {data.manualSales.toFixed(2)}
                          </td>
                          <td className="border px-4 py-2 text-right">
                            {data.webSales.toFixed(2)}
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td
                        colSpan="4"
                        className="border px-4 py-2 text-center text-gray-500"
                      >
                        No revenue data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Paper>
        </Grid>
      </Grid>
      <ImageManager />
    </Box>
  );
};

export default Dashboard;
