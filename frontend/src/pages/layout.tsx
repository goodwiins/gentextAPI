// components/Layout.js
import React from "react";
import Navbar from "../components/navbar";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div>
      <Navbar />
      <main className="flex-1">{children}</main>
      {/* Add footer or other elements if needed */}
    </div>
  );
};

export default Layout;

