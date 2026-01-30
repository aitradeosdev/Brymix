import React from 'react';
import Navigation from './Navigation';
import MobileNav from './MobileNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />
      <MobileNav />
      <div className="ml-0 md:ml-80 p-6 pt-16 md:pt-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;