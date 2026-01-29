import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Key, 
  BarChart3, 
  Settings, 
  LogOut,
  User,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/api-keys', icon: Key, label: 'API Keys' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/docs', icon: FileText, label: 'Documentation' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="glass-nav fixed left-6 top-6 bottom-6 w-64 z-40">
      <div className="p-6">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold gradient-text">Brymix</h1>
          <p className="text-white/60 text-sm">Challenge Checker</p>
        </div>

        {/* User Info */}
        <div className="glass p-4 rounded-xl mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 glass rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">{state.user?.name}</p>
              <p className="text-white/60 text-xs">{state.user?.company}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                    ? 'glass bg-white/20 text-white' 
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-red-500/20 transition-all duration-200 w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navigation;