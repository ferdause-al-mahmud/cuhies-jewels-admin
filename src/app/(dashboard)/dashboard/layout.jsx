"use client";

import Sidebar from "@/app/Components/Dashboard/Sidebar/Sidebar";
import withAuth from "@/app/lib/adminRoute";
import { useState, useEffect } from "react";

const DashboardLayout = ({ children }) => {
  const [sidebarWidth, setSidebarWidth] = useState("w-72");

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarWidth("w-0");
      } else {
        setSidebarWidth("w-72");
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 ">
      <Sidebar />

      <div className="lg:pl-72 transition-all duration-300">
        <main className="min-h-screen">
          <div className="pt-16 lg:pt-0">
            <div className="px-4 sm:px-6 py-6">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default withAuth(DashboardLayout);
