import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Building2, User, Mail, Lock, Sparkles } from 'lucide-react';
import { IndustryType } from '../types';
import { api } from '../api';

const INDUSTRIES: IndustryType[] = [
  'Fashion & Clothing',
  'Real Estate',
  'Hotels & Short Lets',
  'Restaurants & Food',
  'Schools & Education',
  'Clinics & Healthcare',
  'Event Planning',
  'Online Stores / E-commerce',
  'Auto Dealers',
  'Beauty & Personal Care',
  'Electronics',
  'Travel & Tourism',
  'Professional Services',
  'Logistics & Delivery',
  'Fitness & Wellness',
  'Other',
];

interface AuthModalProps {
  onSuccess: (user: any, business: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [industry, setIndustry] = useState<IndustryType>('Fashion & Clothing');
  const [customIndustry, setCustomIndustry] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [location, setLocation] = useState('Lagos, Nigeria');
  const [contactPhone, setContactPhone] = useState('+2348012345678');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await api.register({
          name,
          email,
          password,
          businessName,
          industry,
          customIndustry: industry === 'Other' ? customIndustry : undefined,
          country: 'Nigeria',
          currency,
          location,
          contactPhone,
        });
        onSuccess(res.user, res.business);
      } else {
        const res = await api.login({ email, password });
        onSuccess(res.user, res.business);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const fillPreSeededAdmin = () => {
    setEmail('admin@pingtopay.com');
    setPassword('Admin12345!');
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950 flex flex-col justify-center items-center p-4 py-12">
      {/* Brand Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg shadow-emerald-500/20">
            P
          </div>
          <div className="text-left">
            <span className="text-2xl font-black text-white tracking-tight">Ping</span>
            <span className="text-2xl font-black text-emerald-400 tracking-tight">Topay</span>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
          Turn WhatsApp and Telegram conversations into automated sales for your business.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 p-8 max-w-md w-full">
        {/* Toggle Mode */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
          <button
            onClick={() => { setIsRegister(false); setError(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              !isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsRegister(true); setError(null); }}
            className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              isRegister ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Register Workspace
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bella Afrocentric Designs"
                  value={businessName}
                  onChange={e => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Industry *</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value as IndustryType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white"
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              {industry === 'Other' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enter your business type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Solar inverter installations"
                    value={customIndustry}
                    onChange={e => setCustomIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Currency</label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="NGN">Nigerian Naira (₦)</option>
                    <option value="USD">US Dollar ($)</option>
                    <option value="GHS">Ghana Cedi (GH₵)</option>
                    <option value="KES">Kenyan Shilling (KSh)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location / City</label>
                  <input
                    type="text"
                    placeholder="Lagos, Nigeria"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Folake Adeleke"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              placeholder="owner@business.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create Multi-Tenant Workspace' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Quick Pre-seeded Login Helper */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={fillPreSeededAdmin}
            className="text-[11px] font-semibold text-emerald-800 hover:text-emerald-950 flex items-center justify-center gap-1 mx-auto cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>Use Pre-Seeded Super Admin Credentials</span>
          </button>
        </div>
      </div>
    </div>
  );
};
