import React from 'react';
import Navigation from './Navigation';
import MobileNav from './MobileNav';
import BottomNav from './BottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />
      <MobileNav />
      <div className="ml-0 md:ml-80 p-6 pt-16 md:pt-6 pb-20 md:pb-6">
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

export default DashboardLayout;