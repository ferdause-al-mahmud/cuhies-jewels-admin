"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Grid, Paper } from "@mui/material";
import ImageManager from "@/app/Components/Dashboard/ImageManeger/ImageManager";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { format, set, subDays } from "date-fns";
import Loader from "@/app/Components/loader/Loader";

const countTotalRevenue = (orders) => {
  return orders.reduce((total, order) => total + order.total, 0);
};

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState(new Date());
  const formattedStartDate = format(startDate, "yyyy-MM-dd");
  const formattedEndDate = format(endDate, "yyyy-MM-dd");
  const [totalSales, setTotalSales] = useState(0);
  const [totalWebSales, setTotalWebSales] = useState(0);
  const [totalManualSales, setTotalManualSales] = useState(0);
  const [overAllDeliveredOrders, setoverAllDeliveredOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalManualOrders, setTotalManualOrders] = useState(0);
  const [totalWebOrders, setTotalWebOrders] = useState(0);
  const [deliveredWebOrdersCount, setDeliveredWebOrdersCount] = useState(0);
  const [deliveredManualOrdersCount, setDeliveredManualOrdersCount] =
    useState(0);
  // Fetch orders from the API when the component mounts
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await axios.get(
          `/api/all-orders?startDate=${formattedStartDate}&endDate=${formattedEndDate}`
        );
        setOrders(response.data.orders || []);
        setTotalSales(response.data.totalDeliveredSales || 0);
        setTotalWebSales(response.data.totalWebSales || 0);
        setTotalManualSales(response.data.totalManualSales || 0);
        setoverAllDeliveredOrders(response.data.deliveredOrders || 0);
        setTotalOrders(response.data.totalOrders || 0);
        setTotalManualOrders(response.data.manualOrdersCount || 0);
        setTotalWebOrders(response.data.webOrdersCount || 0);
        setDeliveredWebOrdersCount(response.data.deliveredWebOrdersCount || 0);
        setDeliveredManualOrdersCount(
          response.data.deliveredManualOrdersCount || 0
        );
        // Access 'orders' key from the response
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrders([]); // Fallback to an empty array if an error occurs
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [formattedStartDate, formattedEndDate]);

  const deliveredOrders = orders.filter(
    (order) => order.status === "delivered"
  );
  const returnedOrders = orders.filter((order) => order.status === "returned");
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const shippedOrders = orders.filter((order) => order.status === "shipped");

  const manualOrder = deliveredOrders.filter(
    (order) => order.type === "manual"
  );

  const allManualOrders = orders.filter((order) => order.type === "manual");
  const allWebOrders = orders.filter((order) => !order.type);
  const allManualReturnedOrders = allManualOrders.filter(
    (order) => order.status === "returned"
  );
  const allWebReturnedOrders = allWebOrders.filter(
    (order) => order.status === "returned"
  );

  const allManualPendingOrders = allManualOrders.filter(
    (order) => order.status === "pending"
  );
  const allWebPendingOrders = allWebOrders.filter(
    (order) => order.status === "pending"
  );

  const allManualShippedOrders = allManualOrders.filter(
    (order) => order.status === "shipped"
  );
  const allWebShippedOrders = allWebOrders.filter(
    (order) => order.status === "shipped"
  );

  const webOrder = deliveredOrders.filter((order) => !order.type);

  const totalDeliveredOrdersCount = overAllDeliveredOrders.length;
  const totalReturnedOrders = returnedOrders.length;
  const totalAllManualReturnedOrders = allManualReturnedOrders.length;
  const totalAllWebReturnedOrders = allWebReturnedOrders.length;
  const totalPendingOrders = pendingOrders.length;
  const totalAllManualPendingOrders = allManualPendingOrders.length;
  const totalAllWebPendingOrders = allWebPendingOrders.length;
  const totalShippedOrders = shippedOrders.length;
  const totalAllManualShippedOrders = allManualShippedOrders.length;
  const totalAllWebShippedOrders = allWebShippedOrders.length;

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

  // Aggregate monthly revenue (for delivered orders only)
  const revenueByMonth = overAllDeliveredOrders?.reduce((acc, order) => {
    const monthYear = formatMonthYear(order.createdAt);
    if (!acc[monthYear]) {
      acc[monthYear] = { month: monthYear, revenue: 0 };
    }
    acc[monthYear].revenue += order?.total_revenue
      ? order.total_revenue
      : order?.total;
    return acc;
  }, {});

  //revenue by month for web order
  const webRevenueByMonth = webOrder.reduce((acc, order) => {
    const monthYear = formatMonthYear(order.createdAt);
    if (!acc[monthYear]) {
      acc[monthYear] = { month: monthYear, revenue: 0 };
    }
    acc[monthYear].revenue += order?.total_revenue
      ? order.total_revenue
      : order?.total;
    return acc;
  }, {});

  //revenue by month for manual order
  const manualRevenueByMonth = manualOrder.reduce((acc, order) => {
    const monthYear = formatMonthYear(order.createdAt);
    if (!acc[monthYear]) {
      acc[monthYear] = { month: monthYear, revenue: 0 };
    }
    acc[monthYear].revenue += order?.total_revenue
      ? order.total_revenue
      : order?.total;
    return acc;
  }, {});

  const currentMonth = formatMonthYear(new Date());
  const monthlyTotalSales = revenueByMonth[currentMonth]?.revenue || 0;
  const manualMonthlyTotalSales =
    manualRevenueByMonth[currentMonth]?.revenue || 0;
  const webMonthlyTotalSales = webRevenueByMonth[currentMonth]?.revenue || 0;

  if (isLoading) {
    return <Loader />;
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
            ৳{totalSales.toFixed(2)}
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
              Manual Order Revenue: ৳{totalManualSales.toFixed(2)}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                opacity: 0.9,
              }}
            >
              Web Order Revenue: ৳{totalWebSales.toFixed(2)}
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
            {totalOrders}
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
              Manual Order: {totalManualOrders}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                opacity: 0.9,
              }}
            >
              Web Order: {totalWebOrders}
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
            {totalDeliveredOrdersCount}
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
              Manual Order: {deliveredManualOrdersCount}
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontSize: { xs: "0.9rem", sm: "1rem" },
                opacity: 0.9,
              }}
            >
              Web Order: {deliveredWebOrdersCount}
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
              <Typography
                variant="h4"
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2.125rem" },
                  fontWeight: 600,
                }}
              >
                ৳{monthlyTotalSales.toFixed(2)}
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
                  Manual Order Revenue: ৳{manualMonthlyTotalSales.toFixed(2)}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Web Order Revenue: ৳{webMonthlyTotalSales.toFixed(2)}
                </Typography>
              </Box>
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
                {deliveredOrders.length}{" "}
                <span className="font-semibold text-sm sm:text-lg">
                  ( BDT {countTotalRevenue(deliveredOrders)} )
                </span>
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
                  Manual Order: {manualOrder.length}{" "}
                  <span className="font-semibold">
                    BDT {countTotalRevenue(manualOrder)}
                  </span>
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Web Order: {webOrder.length}{" "}
                  <span className="font-semibold ">
                    BDT {countTotalRevenue(webOrder)}
                  </span>
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
                {totalPendingOrders}
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
                  Manual Order: {totalAllManualPendingOrders}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Web Order: {totalAllWebPendingOrders}
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
                {totalShippedOrders}
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
                  Manual Order: {totalAllManualShippedOrders}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Web Order: {totalAllWebShippedOrders}
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
                {totalReturnedOrders}
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
                  Manual Order: {totalAllManualReturnedOrders}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                    opacity: 0.9,
                  }}
                >
                  Web Order: {totalAllWebReturnedOrders}
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
                    <th className="border px-4 py-2 text-right">Revenue (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(revenueByMonth)
                    .sort((a, b) => {
                      // Sort by date (newest first)
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
                      </tr>
                    ))}
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
