"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";
import toast from "react-hot-toast";
import useRole from "@/app/utils/useRole";
import { auth } from "../firebase/firebase.config";
import Sidebar from "@/app/Components/Dashboard/Sidebar/Sidebar";

const ModeratorRoutes = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const { role, loading: roleLoading } = useRole(user?.email);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !roleLoading) {
      if (!user) {
        router.push("/");
      } else if (role !== "moderator" && role !== "admin") {
        toast.error("You don't have access to this page");
        router.push("/dashboard");
      }
    }
  }, [user, loading, role, roleLoading, router]);

  if (loading || roleLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-2xl font-semibold">
        Loading...
      </div>
    );
  }

  if (role !== "moderator" && role !== "admin") return null;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-100 px-2 py-6 sm:px-10">{children}</div>
    </div>
  );
};

export default ModeratorRoutes;
