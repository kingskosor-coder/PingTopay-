import React, { useState } from 'react';
import {
  Building2,
  MessageSquare,
  Package,
  BookOpen,
  Bot,
  CreditCard,
  TestTube2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Business, IndustryType } from '../types';
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

interface OnboardingWizardProps {
  business: Business;
  onComplete: () => void;
  onUpdateBusiness: (b: Business) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  business,
  onComplete,
  onUpdateBusiness,
}) => {
  const [step, setStep] = useState<number>(business.onboardingStep || 1);
  const [loading, setLoading] = useState(false);

  // Step 1: Business Info Form
  const [name, setName] = useState(business.name);
  const [description, setDescription] = useState(business.description || '');
  const [industry, setIndustry] = useState<IndustryType>(business.industry || 'Fashion & Clothing');
  const [customIndustry, setCustomIndustry] = useState(business.customIndustry || '');
  const [country, setCountry] = useState(business.country || 'Nigeria');
  const [currency, setCurrency] = useState(business.currency || 'NGN');
  const [location, setLocation] = useState(business.location || 'Lagos, Nigeria');
  const [contactPhone, setContactPhone] = useState(business.contactPhone || '+2348000000000');
  const [website, setWebsite] = useState(business.website || '');
  const [businessHours, setBusinessHours] = useState(business.businessHours || '08:00 - 18:00 (WAT)');

  // Step 2: Channels
  const [selectedChannels, setSelectedChannels] = useState<{ whatsapp: boolean; telegram: boolean }>({
    whatsapp: true,
    telegram: true,
  });

  // Step 5: Agent
  const [agentName, setAgentName] = useState(`${business.name} Sales Rep`);
  const [agentTone, setAgentTone] = useState<'professional' | 'friendly' | 'enthusiastic' | 'concise' | 'consultative'>('friendly');
  const [agentGreeting, setAgentGreeting] = useState(`Hello! Welcome to ${business.name}. How can I help you find the right product or service today?`);

  // Step 6: Paystack
  const [paystackPk, setPaystackPk] = useState(business.paystackPublicKey || '');
  const [paystackSk, setPaystackSk] = useState(business.paystackSecretKey || '');
  const [paystackStatus, setPaystackStatus] = useState<string | null>(null);

  // Step 7: Test Bench
  const [testInput, setTestInput] = useState('Hi, what products do you have and how much is delivery to Ikeja?');
  const [testOutput, setTestOutput] = useState<any>(null);
  const [testing, setTesting] = useState(false);

  const handleSaveBusinessInfo = async () => {
    setLoading(true);
    try {
      const updated = await api.updateBusiness({
        name,
        description,
        industry,
        customIndustry: industry === 'Other' ? customIndustry : undefined,
        country,
        currency,
        currencySymbol: currency === 'NGN' ? '₦' : currency === 'USD' ? '$' : currency === 'GHS' ? 'GH₵' : currency === 'KES' ? 'KSh' : '₦',
        location,
        contactPhone,
        website,
        businessHours,
        onboardingStep: 2,
      });
      onUpdateBusiness(updated);
      setStep(2);
    } catch (err: any) {
      alert(err.message || 'Error saving business info');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadIndustryCatalog = async () => {
    setLoading(true);
    try {
      await api.seedIndustryProducts();
      alert(`Loaded starter ${industry} catalog! You can edit items anytime.`);
      setStep(4);
    } catch (err: any) {
      alert(err.message || 'Failed to seed products');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKnowledge = async () => {
    setLoading(true);
    try {
      await api.createKnowledge({
        category: 'delivery',
        title: 'Delivery & Shipping Policy',
        content: `Standard delivery across ${location || 'Nigeria'} takes 24 to 48 hours. Express same-day delivery available for central areas.`,
      });
      await api.createKnowledge({
        category: 'policy',
        title: 'Payment and Return Policy',
        content: `All payments are securely processed through Paystack. 7-day return/exchange window for items in original condition.`,
      });
      setStep(5);
    } catch (err: any) {
      alert(err.message || 'Error saving knowledge');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAgent = async () => {
    setLoading(true);
    try {
      await api.updateAgentConfig({
        agentName,
        tone: agentTone,
        greeting: agentGreeting,
        isActive: true,
      });
      setStep(6);
    } catch (err: any) {
      alert(err.message || 'Error saving AI agent config');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPaystack = async () => {
    if (!paystackSk) {
      setPaystackStatus('Skipping credentials for now (Sandbox Mode). You can add live keys later.');
      setStep(7);
      return;
    }
    setLoading(true);
    try {
      const res = await api.connectPaystack({
        publicKey: paystackPk,
        secretKey: paystackSk,
      });
      setPaystackStatus(res.message);
      onUpdateBusiness(res.business);
      setStep(7);
    } catch (err: any) {
      setPaystackStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunLiveTest = async () => {
    setTesting(true);
    try {
      const res = await api.sendTestMessage({
        channel: 'whatsapp',
        customerName: 'Amina Bello (Lagos)',
        customerIdentifier: '+2348099887766',
        message: testInput,
      });
      setTestOutput(res);
    } catch (err: any) {
      alert(err.message || 'Test message failed');
    } finally {
      setTesting(false);
    }
  };

  const handleFinishActivation = async () => {
    setLoading(true);
    try {
      const updated = await api.updateBusiness({
        onboardingCompleted: true,
        onboardingStep: 8,
      });
      await api.updateAgentConfig({ isActive: true });
      onUpdateBusiness(updated);
      onComplete();
    } catch (err: any) {
      alert(err.message || 'Error activating agent');
    } finally {
      setLoading(false);
    }
  };

  const stepsList = [
    { num: 1, label: 'Business Info', icon: Building2 },
    { num: 2, label: 'Channels', icon: MessageSquare },
    { num: 3, label: 'Products', icon: Package },
    { num: 4, label: 'Knowledge', icon: BookOpen },
    { num: 5, label: 'AI Agent', icon: Bot },
    { num: 6, label: 'Paystack', icon: CreditCard },
    { num: 7, label: 'Live Test', icon: TestTube2 },
    { num: 8, label: 'Activate', icon: CheckCircle },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Wizard Progress Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Welcome to PingTopay Setup Wizard</h1>
            <p className="text-xs text-slate-700">Follow the 8 quick steps to launch your autonomous 24/7 AI sales representative.</p>
          </div>
          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Step {step} of 8
          </span>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {stepsList.map(s => {
            const Icon = s.icon;
            const isDone = s.num < step;
            const isCurrent = s.num === step;
            return (
              <div key={s.num} className="text-center group">
                <div
                  className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center text-xs font-bold transition ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-slate-900 text-white ring-2 ring-emerald-500'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <p className="text-[10px] font-medium text-slate-700 mt-1 truncate">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        {/* Step 1: Business Information */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Step 1 — Business Information</h2>
              <p className="text-xs text-slate-700">Tell us about your business so PingTopay can personalize your sales representative.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Industry *</label>
                <select
                  value={industry}
                  onChange={e => setIndustry(e.target.value as IndustryType)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {INDUSTRIES.map(ind => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>

              {industry === 'Other' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Enter your business type *</label>
                  <input
                    type="text"
                    placeholder="e.g. Solar Energy Installations & Inverter Supply"
                    value={customIndustry}
                    onChange={e => setCustomIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does your business sell or provide?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Operating Currency</label>
                <select
                  value={currency}
                  onChange={e => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                >
                  <option value="NGN">Nigerian Naira (₦)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="GHS">Ghanaian Cedi (GH₵)</option>
                  <option value="KES">Kenyan Shilling (KSh)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Location / City</label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Lekki Phase 1, Lagos"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp / Contact Phone</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Website (Optional)</label>
                <input
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Business Hours</label>
                <input
                  type="text"
                  value={businessHours}
                  onChange={e => setBusinessHours(e.target.value)}
                  placeholder="08:00 - 18:00 (WAT)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveBusinessInfo}
                disabled={loading || !name}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition"
              >
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Choose Messaging Channel */}
        {step === 2 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Step 2 — Choose Messaging Channel</h2>
              <p className="text-xs text-slate-700">Select which channels you want PingTopay to automate sales on. You can connect one or both.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div
                onClick={() => setSelectedChannels(prev => ({ ...prev, whatsapp: !prev.whatsapp }))}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition ${
                  selectedChannels.whatsapp
                    ? 'border-emerald-500 bg-emerald-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                    WA
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedChannels.whatsapp}
                    readOnly
                    className="w-4 h-4 accent-emerald-600"
                  />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">WhatsApp Business Platform</h3>
                <p className="text-xs text-slate-700 mt-1">
                  Connect official Meta Cloud API to respond to customer DMs, send product catalogs, and generate instant payment links.
                </p>
                <div className="mt-3 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Meta Webhook Ready
                </div>
              </div>

              <div
                onClick={() => setSelectedChannels(prev => ({ ...prev, telegram: !prev.telegram }))}
                className={`p-5 rounded-2xl border-2 cursor-pointer transition ${
                  selectedChannels.telegram
                    ? 'border-sky-500 bg-sky-50/40 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                    TG
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedChannels.telegram}
                    readOnly
                    className="w-4 h-4 accent-sky-600"
                  />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Telegram Bot</h3>
                <p className="text-xs text-slate-700 mt-1">
                  Connect your business Telegram bot via BotFather token to capture customer leads and close sales on Telegram.
                </p>
                <div className="mt-3 text-[11px] text-sky-800 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Telegram Bot API Ready
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 text-xs text-slate-700">
              <span className="font-bold text-slate-900">Note:</span> Real webhook URLs and API token entry forms are available in your <strong>Channels Settings</strong> tab. You can test customer interactions right now using our built-in simulator!
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2"
              >
                <span>Continue to Products</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Configure Products / Services */}
        {step === 3 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Step 3 — Configure Products & Services</h2>
              <p className="text-xs text-slate-700">PingTopay uses your authorized catalogue as its strict source of truth. It will never hallucinate or invent prices.</p>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-emerald-900 text-sm">Quick Start: Seed {industry} Starter Catalog</h4>
                  <p className="text-xs text-emerald-800 mt-1">
                    We can automatically seed your catalogue with real African SME {industry} template products and pricing (in {business.currency}). You can modify prices, photos, and descriptions anytime.
                  </p>
                  <button
                    onClick={handleLoadIndustryCatalog}
                    disabled={loading}
                    className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    {loading ? 'Seeding...' : `Load ${industry} Template Products`}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-sm flex items-center gap-2"
              >
                <span>Skip to Knowledge Base</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Configure Knowledge */}
        {step === 4 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Step 4 — Business Knowledge & FAQs</h2>
              <p className="text-xs text-slate-700">Add delivery policies, payment guidelines, and FAQs so your AI agent can answer customer inquiries accurately.</p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Delivery</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Standard Delivery Timeline</h4>
                <p className="text-xs text-slate-700 mt-1">Delivery takes 24-48 hours within Lagos and 3-5 days nationwide across Nigeria.</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[10px] font-bold uppercase text-sky-700 bg-sky-100 px-2 py-0.5 rounded">Payment & Refund</span>
                <h4 className="font-bold text-slate-900 text-sm mt-1">Paystack Security & Return Guarantee</h4>
                <p className="text-xs text-slate-700 mt-1">Payments are made through secure Paystack payment links. 7 days exchange window for undamaged items.</p>
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSaveKnowledge}
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2"
              >
                <span>Save Knowledge & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Configure AI Agent */}
        {step === 5 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Step 5 — Configure AI Sales Agent</h2>
              <p className="text-xs text-slate-700">Define your agent's persona, tone, greeting, and objection handling style.</p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Agent Representative Name</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sales Tone</label>
                <select
                  value={agentTone}
                  onChange={e => setAgentTone(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="friendly">Friendly & Warm (Recommended for retail/fashion)</option>
                  <option value="professional">Professional & Formal (Recommended for real estate/corporate)</option>
                  <option value="enthusiastic">Enthusiastic & High-Energy</option>
                  <option value="consultative">Consultative & Advisory (Recommended for healthcare/services)</option>
                  <option value="concise">Concise & Direct</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Greeting Message</label>
                <textarea
                  rows={2}
                  value={agentGreeting}
                  onChange={e => setAgentGreeting(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(4)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSaveAgent}
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2"
              >
                <span>Save Agent & Connect Paystack</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Connect Paystack */}
        {step === 6 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Step 6 — Connect Paystack Payment Gateway</h2>
              <p className="text-xs text-slate-700">
                PingTopay generates real Paystack payment links and verifies payments cryptographically. We never falsely mark orders as paid without authentic Paystack confirmation.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Paystack Public Key</label>
                <input
                  type="text"
                  placeholder="pk_test_... or pk_live_..."
                  value={paystackPk}
                  onChange={e => setPaystackPk(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Paystack Secret Key</label>
                <input
                  type="password"
                  placeholder="sk_test_... or sk_live_..."
                  value={paystackSk}
                  onChange={e => setPaystackSk(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <p className="text-[11px] text-slate-700 mt-1">
                  Stored securely on backend server. Never exposed to browser or client bundles.
                </p>
              </div>

              {paystackStatus && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  paystackStatus.includes('Error')
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                }`}>
                  {paystackStatus}
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={() => setStep(5)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleVerifyPaystack}
                disabled={loading}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm"
              >
                <span>{paystackSk ? 'Verify & Test Paystack' : 'Skip / Test Later'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 7: Live Channel Test */}
        {step === 7 && (
          <div>
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900">Step 7 — Test Your AI Sales Agent</h2>
              <p className="text-xs text-slate-700">Test how your agent responds to product questions, handles pricing, and generates Paystack payment requests.</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Customer Test Message</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testInput}
                  onChange={e => setTestInput(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                <button
                  onClick={handleRunLiveTest}
                  disabled={testing || !testInput}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {testing ? 'Analyzing...' : 'Send Message'}
                </button>
              </div>
            </div>

            {testOutput && (
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-6 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-700">AI Intent Identified:</span>
                  <span className="text-xs font-semibold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                    {testOutput.aiMessage?.metadata?.intent || 'product_inquiry'}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-semibold text-slate-700 block mb-1">AI Agent Response:</span>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-sm text-slate-800 whitespace-pre-wrap">
                    {testOutput.aiMessage?.content}
                  </div>
                </div>

                {testOutput.aiMessage?.metadata?.paymentLink && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                    <span className="font-bold">Generated Paystack Payment Link:</span>
                    <a
                      href={testOutput.aiMessage.metadata.paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block underline font-mono mt-0.5 text-emerald-700 break-all"
                    >
                      {testOutput.aiMessage.metadata.paymentLink}
                    </a>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <button
                onClick={() => setStep(6)}
                className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(8)}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center gap-2"
              >
                <span>Proceed to Activation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 8: Activate Agent */}
        {step === 8 && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ready to Activate PingTopay!</h2>
            <p className="text-slate-700 text-sm max-w-md mx-auto mb-6">
              Your business workspace for <strong>{business.name}</strong> is completely configured. Your AI sales representative will now autonomously handle inquiries, qualify leads, and close sales.
            </p>

            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left max-w-md mx-auto mb-8 text-xs text-slate-700 space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Industry template & catalog synced ({business.industry})</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Knowledge base & delivery rules loaded</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>AI Agent & Paystack payment integration ready</span>
              </div>
            </div>

            <button
              onClick={handleFinishActivation}
              disabled={loading}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-extrabold text-base shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 mx-auto cursor-pointer"
            >
              <span>{loading ? 'Activating...' : 'Activate Agent & Open Dashboard'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
