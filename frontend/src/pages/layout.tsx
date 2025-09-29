// components/Layout.js
import React from "react";
import EnhancedNavbar from "@/components/navigation/EnhancedNavbar";
import { Footer } from "@/components";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <EnhancedNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;

