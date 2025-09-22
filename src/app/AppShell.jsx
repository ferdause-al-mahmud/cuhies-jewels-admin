"use client";

import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import Navbar from "./SharedComponents/Navbar/Navbar";
import Footer from "./SharedComponents/Footer";

export default function AppShell({ children }) {
  const segments = useSelectedLayoutSegments(); // e.g. ["dashboard", "user-management"]
  //   const inDashboard = segments[0] === "dashboard";
  const pathName = usePathname();
  const isDashboard = pathName.includes("dashboard");

  // Public site chrome
  return (
    <>
      <Navbar />
      <main className={`${isDashboard ? "pt-16" : "pt-16 lg:pt-[100.8px]"}`}>
        {children}
      </main>
      <Footer />
    </>
  );
}
