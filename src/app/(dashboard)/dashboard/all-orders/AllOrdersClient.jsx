"use client";
import { useEffect, useState } from "react";
import OrdersTable from "@/app/Components/Dashboard/OrdersTable/OrdersTable";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/app/firebase/firebase.config";

const AllOrdersClient = ({ searchParams }) => {
  const [loading, setLoading] = useState(true);
  const [ordersData, setOrdersData] = useState({
    orders: [],
    totalPages: 1,
    currentPage: 1,
  });

  const fetchOrders = async () => {
    try {
      const token = await auth.currentUser?.getIdToken();

      const queryParams = new URLSearchParams({
        page: searchParams?.page || "1",
        limit: "10",
        status: searchParams?.status || "all",
        type: searchParams?.type || "",
        startDate: searchParams?.startDate || "",
        endDate: searchParams?.endDate || "",
        search: searchParams?.search || "",
      });

      const res = await fetch(`/api/orders?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();
      setLoading(false);
      setOrdersData({
        orders: data.orders,
        totalPages: data.totalPages,
        currentPage: data.currentPage,
      });
    } catch (err) {
      console.error("Error fetching orders:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [searchParams]);

  return (
    <OrdersTable
      loading={loading}
      orders={ordersData.orders}
      totalPages={ordersData.totalPages}
      currentPage={ordersData.currentPage}
    />
  );
};

export default AllOrdersClient;
