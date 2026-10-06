import React from 'react';
import { User, Business, Channel } from '../types';
import { ShieldCheck, LogOut, CheckCircle, AlertCircle, ExternalLink, Bot } from 'lucide-react';

interface NavbarProps {
  user: User;
  business: Business;
  channels: Channel[];
  onLogout: () => void;
  onOpenSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  business,
  channels,
  onLogout,
  onOpenSimulator,
}) => {
  const waChannel = channels.find(c => c.type === 'whatsapp');
  const tgChannel = channels.find(c => c.type === 'telegram');

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Brand & Workspace */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
            P
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-extrabold text-slate-900 text-lg tracking-tight">Ping</span>
              <span className="font-extrabold text-emerald-600 text-lg tracking-tight">Topay</span>
            </div>
            <span className="text-[10px] text-slate-700 font-medium tracking-wide block uppercase">
              Sales Agent AI
            </span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* Business Workspace Label */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-bold text-slate-800">{business.name}</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-md">
            {business.currency} ({business.currencySymbol})
          </span>
        </div>
      </div>

      {/* Integration Badges & Actions */}
      <div className="flex items-center gap-3">
        {/* Channel Status Badges */}
        <div className="hidden md:flex items-center gap-2">
          {/* WhatsApp Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-50 border-slate-200 text-slate-700">
            <span className="font-bold text-emerald-600">WA:</span>
            {waChannel?.status === 'connected' ? (
              <span className="text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-600" /> Connected
              </span>
            ) : (
              <span className="text-slate-700 font-medium">Not Connected</span>
            )}
          </div>

          {/* Telegram Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-50 border-slate-200 text-slate-700">
            <span className="font-bold text-sky-600">TG:</span>
            {tgChannel?.status === 'connected' ? (
              <span className="text-sky-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-sky-600" /> @{tgChannel.telegramConfig?.botUsername || 'Bot'}
              </span>
            ) : (
              <span className="text-slate-700 font-medium">Not Connected</span>
            )}
          </div>

          {/* Paystack Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-50 border-slate-200 text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-700">Paystack:</span>
            {business.isPaystackConnected ? (
              <span className="text-emerald-700">Active</span>
            ) : (
              <span className="text-slate-700">Test Mode</span>
            )}
          </div>
        </div>

        {/* Live Simulator Shortcut */}
        <button
          onClick={onOpenSimulator}
          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
        >
          <Bot className="w-3.5 h-3.5 text-emerald-600" />
          <span>Test AI Bench</span>
        </button>

        {/* User Role & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-900 leading-tight">{user.name}</p>
            <p className="text-[10px] text-slate-700 capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <button
            onClick={onLogout}
            title="Log Out"
            className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
