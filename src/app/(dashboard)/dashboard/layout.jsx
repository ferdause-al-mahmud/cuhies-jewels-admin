"use client";

import Sidebar from "@/app/Components/Dashboard/Sidebar/Sidebar";
import withAuth from "@/app/lib/adminRoute";

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 bg-gray-100  px-4 pt-4 pb-6 sm:px-6  mt-10 lg:mt-0">
        {children}
      </div>
    </div>
  );
};

export default withAuth(DashboardLayout);
