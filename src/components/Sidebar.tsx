import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Bot,
  Package,
  BookOpen,
  Users,
  ShoppingCart,
  Radio,
  Clock,
  UserPlus,
  Server,
  TestTube,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'inbox'
  | 'agent'
  | 'products'
  | 'knowledge'
  | 'leads'
  | 'orders'
  | 'channels'
  | 'automations'
  | 'team'
  | 'simulator'
  | 'architecture';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  unreadCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unreadCount = 0,
}) => {
  const menuItems: { id: TabType; label: string; icon: any; badge?: number }[] = [
    { id: 'dashboard', label: 'Sales Dashboard', icon: LayoutDashboard },
    { id: 'inbox', label: 'Unified Inbox', icon: Inbox, badge: unreadCount },
    { id: 'agent', label: 'AI Agent Builder', icon: Bot },
    { id: 'products', label: 'Product Catalogue', icon: Package },
    { id: 'knowledge', label: 'Knowledge & Policies', icon: BookOpen },
    { id: 'leads', label: 'CRM & Pipeline', icon: Users },
    { id: 'orders', label: 'Orders & Payments', icon: ShoppingCart },
    { id: 'channels', label: 'WhatsApp & Telegram', icon: Radio },
    { id: 'automations', label: 'Follow-Up Automations', icon: Clock },
    { id: 'simulator', label: 'Omnichannel Sandbox', icon: TestTube },
    { id: 'team', label: 'Team & Roles', icon: UserPlus },
    { id: 'architecture', label: 'AWS & Contract', icon: Server },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
      <div className="p-4 flex-1 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-300">
          Core Operations
        </div>

        {menuItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}

        <div className="pt-4 px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-300">
          Commerce & CRM
        </div>

        {menuItems.slice(5, 9).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}

        <div className="pt-4 px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-300">
          Developer & Admin
        </div>

        {menuItems.slice(9).map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Branding Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-xs text-slate-400">
        <p className="font-semibold text-slate-200">PingTopay v1.0 Production</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Optimized for African SMEs</p>
      </div>
    </aside>
  );
};
