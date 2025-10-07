// components/Layout.js
import React from "react";
import EnhancedNavbar from "@/components/navigation/EnhancedNavbar";
import Footer from "@/components/Footer";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Skip Navigation Links */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        Skip to main content
      </a>
      
      <header role="banner">
        <EnhancedNavbar />
      </header>
      
      <main 
        id="main-content" 
        role="main" 
        className="flex-1"
        tabIndex={-1}
      >
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;

