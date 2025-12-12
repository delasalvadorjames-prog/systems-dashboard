import React, { useState } from 'react';

interface SidebarProps {
  role: 'teacher' | 'admin';
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ role, activeTab, onTabChange, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false); // Default closed on mobile
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const teacherMenuItems = [
    { label: 'Home', tab: 'home' },
    { label: 'Attendance', tab: 'attendance' },
    { label: 'Teaching Load', tab: 'teaching_load' },
    { label: 'Salary', tab: 'salary' },
    { label: 'Messages', tab: 'messages' },
    { label: 'Settings', tab: 'settings' },
  ];

  const adminMenuItems = [
    { label: 'Dashboard', tab: 'dashboard' },
    { label: 'Verify Attendance', tab: 'verify' },
    { label: 'Compute Salary', tab: 'compute' },
    { label: 'Manage Teachers', tab: 'teachers' },
    { label: 'Teaching Load', tab: 'teaching_load' },
    { label: 'Reports', tab: 'reports' },
    { label: 'Messages', tab: 'messages' },
    { label: 'Settings', tab: 'settings' },
  ];

  const menuItems = role === 'teacher' ? teacherMenuItems : adminMenuItems;

  const handleTabClick = (tab: string) => {
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button - Visible on md and below */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-sky-700 text-white rounded-lg hover:bg-sky-800 transition"
        title={isMobileOpen ? 'Close menu' : 'Open menu'}
      >
        {isMobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      } fixed md:relative md:z-auto z-40 ${isOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-sky-700 via-sky-800 to-sky-900 h-screen text-white transition-all duration-500 flex flex-col shadow-2xl hover:shadow-sky-500/50`}>
        {/* Header with Profile Info */}
        <div className="p-3 md:p-4 border-b border-stone-600/30 bg-gradient-to-r from-sky-600/20 to-transparent">
          {isOpen ? (
            <div>
              <h1 className="text-base md:text-lg font-bold bg-gradient-to-r from-sky-300 to-sky-950 bg-clip-text text-transparent">
                {role === 'teacher' ? '👨‍🏫 Teacher' : '👩‍💼 Admin'}
              </h1>
              <p className="text-xs text-red-300 mt-2 font-medium">{role === 'teacher' ? 'Dashboard' : 'Management Panel'}</p>
            </div>
          ) : (
            <div className="flex justify-center animate-bounce">
              <span className="text-xl md:text-2xl">{role === 'teacher' ? '👨‍🏫' : '👩‍💼'}</span>
            </div>
          )}
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-3 md:p-4 space-y-1 md:space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                handleTabClick(item.tab);
                setIsMobileOpen(false); // Close mobile menu after selection
              }}
              className={`w-full flex items-center space-x-3 p-2 md:p-3 rounded-lg md:rounded-xl transition-all duration-300 text-left transform hover:scale-105 ${
                activeTab === item.tab
                  ? 'bg-gradient-to-r from-sky-500 to-sky-600 font-semibold shadow-lg shadow-sky-500/50 scale-105'
                  : 'hover:bg-sky-600/50 hover:shadow-md'
              }`}
              title={!isOpen ? item.label : ''}
              style={{
                animation: `slideInLeft 0.6s ease-out ${index * 0.05}s both`
              }}
            >
              <span className="text-lg md:text-xl flex-shrink-0"></span>
              {isOpen && <span className="flex-1 text-xs md:text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer - Settings and Logout */}
        <div className="border-t border-sky-600/30 p-3 md:p-4 space-y-2 bg-gradient-to-t from-sky-900/50 to-transparent">
          {isOpen && (
            <div className="text-xs text-sky-300 mb-3 px-2">
              <p className="font-semibold">{role === 'teacher' ? 'Teacher Portal' : 'Admin Portal'}</p>
            </div>
          )}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 p-2 md:p-3 bg-gradient-to-r from-yellow-500 to-sky-700 hover:from-sky-500 hover:to-yellow-600 rounded-lg transition font-semibold text-xs md:text-sm shadow-lg hover:shadow-red-500/50 transform hover:scale-105"
            title="Logout"
          >
            {isOpen && <span>Logout</span>}
          </button>
        </div>

        {/* Toggle Button - Hidden on Mobile */}
        <div className="hidden md:block p-2 border-t border-blue-600/30">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full p-2 hover:bg-blue-600/50 rounded-lg transition flex justify-center transform hover:scale-110"
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? '◀' : '▶'}
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;