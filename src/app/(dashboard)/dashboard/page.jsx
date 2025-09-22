"use client";
import Loader from "@/app/Components/loader/Loader";
import { auth } from "@/app/firebase/firebase.config";
import useRole from "@/app/utils/useRole";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

const DashboardPage = () => {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const { role, loading: roleLoading } = useRole(user?.email);

  useEffect(() => {
    // Redirect to the Sales Analytics Page when visiting the dashboard
    if (role === "moderator") {
      router.push("/dashboard/all-orders");
    } else if (role === "admin") {
      router.push("/dashboard/sales-analytics");
    }
  }, [router, role, loading, roleLoading]);

  if (loading || roleLoading) {
    return <Loader />;
  }

  return null; // You can return a loading spinner here if you want
};

export default DashboardPage;
