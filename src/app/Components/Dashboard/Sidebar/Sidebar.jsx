"use client"; // This is a client-side component
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { FiMenu } from "react-icons/fi"; // Dashboard Icon
import { AiOutlineClose } from "react-icons/ai"; // Close Icon
import { IoLogOutOutline } from "react-icons/io5"; // Logout Icon
import {
  MdPeopleAlt,
  MdAnalytics,
  MdShoppingCart,
  MdAddBox,
  MdInventory,
  MdAssignment,
  MdProductionQuantityLimits,
  MdManageAccounts,
} from "react-icons/md"; // Various Icons
import { useAuthState, useSignOut } from "react-firebase-hooks/auth"; // Firebase sign out hook
import { auth } from "@/app/firebase/firebase.config"; // Import your Firebase config
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import useRole from "@/app/utils/useRole";
import { ActivityIcon, DollarSign } from "lucide-react";
import { FaDollarSign } from "react-icons/fa";

const Sidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null); // To reference the sidebar element
  const [signOut, loading, error] = useSignOut(auth); // Firebase sign out hook
  const router = useRouter();

  const [user, userLoading, userError] = useAuthState(auth);
  const { role, loading: roleLoading } = useRole(user?.email);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleOutsideClick = (e) => {
    if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      const success = await signOut();

      if (success) {
        localStorage.removeItem("firebase_token");

        toast.success("User logged out successfully");
        router.push("/");
      }
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Error logging out. Please try again.");
    }
  };

  useEffect(() => {
    if (sidebarOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    } else {
      document.removeEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [sidebarOpen]);

  return (
    <div className="relative bg-gradient-to-b from-slate-900 to-slate-800">
      <div
        ref={sidebarRef}
        className={`fixed left-0 top-0 z-50 w-72  bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-transform duration-300 transform
                ${
                  sidebarOpen
                    ? "translate-x-0"
                    : "-translate-x-full lg:translate-x-0"
                } lg:translate-x-0 lg:relative lg:z-auto lg:min-h-screen h-screen flex flex-col`}
      >
        {/* Header Section */}
        <div className="flex justify-between items-center p-2 lg:p-6 border-b border-slate-700/50 bg-slate-900/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Dashboard
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Logout Button */}
            <button
              className="group flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all duration-200"
              onClick={handleLogout}
            >
              <IoLogOutOutline className="text-lg text-red-400 group-hover:text-red-300" />
              <span className="hidden sm:block text-sm font-medium text-slate-200 group-hover:text-red-300">
                Logout
              </span>
            </button>
            {/* Close Button for Mobile */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden hover:bg-slate-700 p-2 rounded-lg transition-colors duration-200"
            >
              <AiOutlineClose className="text-xl text-slate-300" />
            </button>
          </div>
        </div>

        {/* Navigation Section - Scrollable */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
          <ul className="space-y-2 pb-6">
            {role === "admin" && (
              <li>
                <Link href="/dashboard/sales-analytics">
                  <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors duration-200">
                      <MdAnalytics className="text-lg text-blue-400" />
                    </div>
                    <span className="font-medium text-slate-200 group-hover:text-white">
                      Sales Analytics
                    </span>
                  </div>
                </Link>
              </li>
            )}

            <li>
              <Link href="/dashboard/all-orders">
                <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                  <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors duration-200">
                    <MdShoppingCart className="text-lg text-green-400" />
                  </div>
                  <span className="font-medium text-slate-200 group-hover:text-white">
                    All Orders
                  </span>
                </div>
              </Link>
            </li>

            <li>
              <Link href="/dashboard/add-product">
                <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                  <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors duration-200">
                    <MdAddBox className="text-lg text-purple-400" />
                  </div>
                  <span className="font-medium text-slate-200 group-hover:text-white">
                    Add Products
                  </span>
                </div>
              </Link>
            </li>

            <li>
              <Link href="/dashboard/all-products">
                <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                  <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors duration-200">
                    <MdInventory className="text-lg text-orange-400" />
                  </div>
                  <span className="font-medium text-slate-200 group-hover:text-white">
                    All Products
                  </span>
                </div>
              </Link>
            </li>

            <li>
              <Link href="/dashboard/moderator-entry">
                <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                  <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors duration-200">
                    <MdAssignment className="text-lg text-indigo-400" />
                  </div>
                  <span className="font-medium text-slate-200 group-hover:text-white">
                    Manual Entry
                  </span>
                </div>
              </Link>
            </li>

            <li>
              <Link href="/dashboard/stock">
                <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                  <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors duration-200">
                    <MdProductionQuantityLimits className="text-lg text-red-400" />
                  </div>
                  <span className="font-medium text-slate-200 group-hover:text-white">
                    Stock
                  </span>
                </div>
              </Link>
            </li>

            {role === "admin" && (
              <>
                <li>
                  <Link href="/dashboard/moderator-track">
                    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                      <div className="p-2 bg-teal-500/20 rounded-lg group-hover:bg-teal-500/30 transition-colors duration-200">
                        <ActivityIcon className="text-lg text-teal-400" />
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-white">
                        Moderator Activity
                      </span>
                    </div>
                  </Link>
                </li>

                <li>
                  <Link href="/dashboard/user-management">
                    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                      <div className="p-2 bg-cyan-500/20 rounded-lg group-hover:bg-cyan-500/30 transition-colors duration-200">
                        <MdPeopleAlt className="text-lg text-cyan-400" />
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-white">
                        User Management
                      </span>
                    </div>
                  </Link>
                </li>

                <li>
                  <Link href="/dashboard/expenses">
                    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                      <div className="p-2 bg-yellow-500/20 rounded-lg group-hover:bg-yellow-500/30 transition-colors duration-200">
                        <DollarSign className="text-lg text-yellow-400" />
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-white">
                        Expense Management
                      </span>
                    </div>
                  </Link>
                </li>

                <li>
                  <Link href="/dashboard/employee-management">
                    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                      <div className="p-2 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors duration-200">
                        <MdManageAccounts className="text-lg text-pink-400" />
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-white">
                        Employee Management
                      </span>
                    </div>
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/product-revenue">
                    <div className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-700/50 transition-all duration-200 hover:translate-x-1">
                      <div className="p-2 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors duration-200">
                        <FaDollarSign className="text-lg text-pink-400" />
                      </div>
                      <span className="font-medium text-slate-200 group-hover:text-white">
                        Gross revenue
                      </span>
                    </div>
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

      {/* Mobile Menu Button */}
      <div
        className={`${
          sidebarOpen && "hidden"
        } w-full  fixed top-0  left-0 z-30 bg-gradient-to-br from-slate-800 to-slate-700 text-white  shadow-lg`}
      >
        <button
          className={` lg:hidden p-3 hover:bg-slate-700 rounded-md ml-5 hover:shadow-xl transition-all duration-200 hover:scale-115`}
          onClick={toggleSidebar}
        >
          <FiMenu className="text-2xl" />
        </button>
      </div>
      {/* <button
        className={`${
          sidebarOpen && "hidden"
        } lg:hidden fixed top-0 w-full left-0 z-30 p-3 bg-gradient-to-br from-slate-800 to-slate-700 text-white  shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
        onClick={toggleSidebar}
      >
        <FiMenu className="text-xl" />
      </button> */}

      <style jsx>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #475569 transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;
