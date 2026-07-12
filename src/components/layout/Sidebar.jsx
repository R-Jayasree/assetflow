import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Building2, Package, ArrowLeftRight, Calendar, 
  Wrench, ClipboardCheck, BarChart3, Bell, ChevronLeft 
} from 'lucide-react';
import useAuthStore from '../../store/authStore';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const role = user?.role;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Asset_Manager', 'Department_Head', 'Employee'] },
    { path: '/organization', label: 'Organization', icon: Building2, roles: ['Admin'] },
    { path: '/assets', label: 'Assets', icon: Package, roles: ['Admin', 'Asset_Manager', 'Department_Head', 'Employee'] },
    { path: '/allocations', label: 'Allocations', icon: ArrowLeftRight, roles: ['Admin', 'Asset_Manager', 'Department_Head'] },
    { path: '/bookings', label: 'Bookings', icon: Calendar, roles: ['Admin', 'Asset_Manager', 'Department_Head', 'Employee'] },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench, roles: ['Admin', 'Asset_Manager', 'Department_Head', 'Employee'] },
    { path: '/audits', label: 'Audits', icon: ClipboardCheck, roles: ['Admin', 'Asset_Manager'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'Asset_Manager', 'Department_Head'] },
    { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['Admin', 'Asset_Manager', 'Department_Head', 'Employee'] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(role));

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-16 items-center justify-between px-6 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AF</span>
            </div>
            <span className="text-xl font-bold tracking-tight">AssetFlow</span>
          </div>
          <button onClick={onClose} className="lg:hidden btn-ghost p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                ${isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t p-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Logged in as</p>
            <p className="text-sm font-medium mt-0.5">{role?.replace('_', ' ')}</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
