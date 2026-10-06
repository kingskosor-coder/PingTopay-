import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  Users,
  ShoppingCart,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  PackagePlus,
  Radio,
} from 'lucide-react';
import { Business, AnalyticsData } from '../types';
import { api } from '../api';

interface DashboardViewProps {
  business: Business;
  onNavigate: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ business, onNavigate }) => {
  const [range, setRange] = useState<string>('7d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const res = await api.getAnalytics(range);
      setData(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const currencySymbol = business.currencySymbol || '₦';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales & Operations Dashboard</h1>
          <p className="text-xs text-slate-700 mt-1">
            Real-time analytics for <span className="font-semibold text-slate-900">{business.name}</span> across WhatsApp & Telegram.
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: '7d', label: 'Last 7 Days' },
            { id: '30d', label: '30 Days' },
            { id: 'month', label: 'This Month' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setRange(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                range === btn.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Integration Status Notice */}
      {!business.isPaystackConnected && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900">Paystack is currently in Sandbox Test Mode</p>
              <p className="text-[11px] text-amber-800">
                To collect real customer card and bank transfer payments in {business.currency}, enter your Live Paystack keys in Channels settings.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('channels')}
            className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold shrink-0 transition"
          >
            Connect Live Paystack
          </button>
        </div>
      )}

      {/* Core KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Verified Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {currencySymbol}{loading ? '...' : (data?.revenue || 0).toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-800 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Paystack cryptographically verified</span>
          </div>
        </div>

        {/* Paid Orders */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Paid Orders</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? '...' : data?.paidOrders || 0}
          </p>
          <p className="mt-2 text-[11px] text-slate-700">
            Total Orders Created: <span className="font-semibold text-slate-800">{data?.totalOrders || 0}</span>
          </p>
        </div>

        {/* Qualified CRM Leads */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">CRM Leads Captured</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? '...' : data?.newLeads || 0}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-purple-800 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{data?.conversionRate || '0%'} sales conversion rate</span>
          </div>
        </div>

        {/* Conversations Handled */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">Conversations</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {loading ? '...' : data?.totalConversations || 0}
          </p>
          <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-700">
            <span className="text-emerald-800 font-semibold">WA: {data?.whatsappConversations || 0}</span>
            <span>•</span>
            <span className="text-sky-800 font-semibold">TG: {data?.telegramConversations || 0}</span>
          </div>
        </div>
      </div>

      {/* Secondary Row: Quick Actions & Channel Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Launchpad */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">Quick Actions</h3>
          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('simulator')}
              className="w-full p-3 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl text-left flex items-center justify-between transition cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-emerald-950">Omnichannel Simulator Bench</p>
                <p className="text-[11px] text-emerald-800">Test AI agent response & Paystack payment link generation</p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-700 shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('products')}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center justify-between transition cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">Add Product or Service</p>
                <p className="text-[11px] text-slate-700">Update catalog pricing, variations, and stock</p>
              </div>
              <PackagePlus className="w-4 h-4 text-slate-700 shrink-0" />
            </button>

            <button
              onClick={() => onNavigate('inbox')}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center justify-between transition cursor-pointer"
            >
              <div>
                <p className="text-xs font-bold text-slate-900">Open Unified Inbox</p>
                <p className="text-[11px] text-slate-700">Manage live chats and staff takeover</p>
              </div>
              <MessageSquare className="w-4 h-4 text-slate-700 shrink-0" />
            </button>
          </div>
        </div>

        {/* AI Performance Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">AI Agent Performance</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">Autonomous AI Handled</span>
                <span className="font-bold text-emerald-800">{data?.aiHandled || 0} chats</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${((data?.aiHandled || 0) / Math.max(data?.totalConversations || 1, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700">Human Escalations</span>
                <span className="font-bold text-amber-800">{data?.humanEscalations || 0} chats</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${((data?.humanEscalations || 0) / Math.max(data?.totalConversations || 1, 1)) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-slate-700" />
              <span>Escalations occur when users ask for human staff or request unavailable info.</span>
            </div>
          </div>
        </div>

        {/* Channels Overview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4">Channel Hub</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                  WA
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">WhatsApp Business API</p>
                  <p className="text-[10px] text-slate-700">Meta Cloud Platform</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('channels')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900"
              >
                Configure
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center text-xs font-bold">
                  TG
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Telegram Bot API</p>
                  <p className="text-[10px] text-slate-700">Instant customer bot</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('channels')}
                className="text-xs font-bold text-sky-800 hover:text-sky-900"
              >
                Configure
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
