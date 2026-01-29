import React from 'react';
import Navigation from './Navigation';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen gradient-bg">
      <Navigation />
      <div className="ml-80 p-6">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;