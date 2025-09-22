"use client";

import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import useRole from "@/app/utils/useRole";
import { auth } from "../firebase/firebase.config";
import toast from "react-hot-toast";

const DashboardAccessGuard = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const { role, loading: roleLoading } = useRole(user?.email);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user) {
        router.push("/");
      } else if (
        pathname.startsWith("/dashboard") &&
        role !== "admin" &&
        role !== "moderator"
      ) {
        toast.error("Access denied.");
        router.push("/");
      }
    }
  }, [user, role, loading, roleLoading, pathname, router]);

  if (loading || roleLoading) {
    return (
      <div className="text-center mt-20 text-xl font-semibold">Loading...</div>
    );
  }

  if (
    !user ||
    (pathname.startsWith("/dashboard") &&
      role !== "admin" &&
      role !== "moderator")
  ) {
    return null;
  }

  return children;
};

export default DashboardAccessGuard;
