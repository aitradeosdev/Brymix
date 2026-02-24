import React from 'react';
import Navigation from './Navigation';
import MobileNav from './MobileNav';
import BottomNav from './BottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen gradient-bg overflow-x-hidden">
      <Navigation />
      <MobileNav />
      <div className="ml-0 md:ml-80 p-4 md:p-6 pt-16 md:pt-6 pb-20 md:pb-6 max-w-full overflow-x-hidden">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default DashboardLayout;