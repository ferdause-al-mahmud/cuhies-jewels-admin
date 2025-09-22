"use client";

import { useEffect, useState, useCallback } from "react";
import ManualEntryTable from "@/app/Components/Dashboard/ManualEntryTable/ManualEntryTable";
import { auth } from "@/app/firebase/firebase.config";
import Loader from "@/app/Components/loader/Loader";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const ModeratorEntryClient = ({ searchParams }) => {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const page = Number.parseInt(searchParams?.page || "1");
  const limit = 10;
  const status = searchParams?.status || "all";
  const phone = searchParams?.phone || "";

  // 🔑 Define fetcher function
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);

      const token = await auth.currentUser?.getIdToken();

      const queryParams = new URLSearchParams();
      queryParams.append("page", page);
      queryParams.append("limit", limit);
      queryParams.append("type", "manual");
      if (phone) queryParams.append("phone", phone);
      if (status !== "all") queryParams.append("status", status);

      const apiUrlWithParams = `${apiUrl}/api/orders?${queryParams.toString()}`;

      const res = await fetch(apiUrlWithParams, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Failed to fetch orders");

      const data = await res.json();

      // Filter out cancelled orders
      const filteredOrders = data.orders.filter(
        (order) => order.status !== "cancelled"
      );

      setOrders(filteredOrders);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  }, [page, limit, status, phone]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div>
      {loading ? (
        <Loader />
      ) : (
        <ManualEntryTable
          orders={orders}
          totalPages={totalPages}
          currentPage={currentPage}
          refetchOrders={fetchOrders} // 🔑 pass function down
        />
      )}
    </div>
  );
};

export default ModeratorEntryClient;
