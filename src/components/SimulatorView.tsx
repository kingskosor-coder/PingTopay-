import React, { useState } from 'react';
import { Bot, Send, ShieldCheck, Sparkles, AlertCircle, CheckCircle2, ShoppingCart, RefreshCw } from 'lucide-react';
import { Business, ChannelType } from '../types';
import { api } from '../api';

interface SimulatorViewProps {
  business: Business;
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ business }) => {
  const [channel, setChannel] = useState<ChannelType>('whatsapp');
  const [customerName, setCustomerName] = useState('Chidi Okafor');
  const [customerIdentifier, setCustomerIdentifier] = useState('+2348031234567');
  const [inputMessage, setInputMessage] = useState('');
  const [chatLog, setChatLog] = useState<{ sender: 'customer' | 'ai'; text: string; time: string; metadata?: any }[]>([
    {
      sender: 'ai',
      text: `Hello! Welcome to ${business.name}. How can I assist you with our products or services today?`,
      time: '12:00 PM',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [latestAnalysis, setLatestAnalysis] = useState<any>(null);

  const quickScenarios = [
    {
      label: '1. Product & Price Inquiry',
      msg: 'Hello, what products or packages do you currently have available and what are their prices?',
    },
    {
      label: '2. Delivery to City',
      msg: 'How much is delivery to Ikeja, Lagos and how long does it take to arrive?',
    },
    {
      label: '3. Purchase Intent & Paystack Link',
      msg: 'I like this! Send me the payment link so I can pay now via bank transfer or card.',
    },
    {
      label: '4. Fake Payment Claim (Security Check)',
      msg: 'I have already transferred the money to your account. Please dispatch immediately.',
    },
    {
      label: '5. Request Human Agent',
      msg: 'Can I speak to a human staff or customer service manager please?',
    },
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userItem = { sender: 'customer' as const, text, time };
    setChatLog(prev => [...prev, userItem]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.sendTestMessage({
        channel,
        customerName,
        customerIdentifier,
        message: text,
      });

      const aiItem = {
        sender: 'ai' as const,
        text: res.aiMessage?.content || 'Thank you! Our staff will get back to you shortly.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        metadata: res.aiMessage?.metadata,
      };

      setChatLog(prev => [...prev, aiItem]);
      setLatestAnalysis({
        intent: res.aiMessage?.metadata?.intent,
        paymentLink: res.aiMessage?.metadata?.paymentLink,
        suggestedProducts: res.aiMessage?.metadata?.suggestedProducts,
        escalated: res.escalated,
      });
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setChatLog([
      {
        sender: 'ai',
        text: `Hello! Welcome to ${business.name}. How can I assist you with our products or services today?`,
        time: '12:00 PM',
      },
    ]);
    setLatestAnalysis(null);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-emerald-600" />
            Omnichannel Simulator Sandbox
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Safely test your AI Agent's sales ability, knowledge grounding, objection handling, and Paystack link generation.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Session</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Quick Scenarios & Customer Config */}
        <div className="space-y-4">
          {/* Channel selector */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-2">Simulate Channel</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { setChannel('whatsapp'); setCustomerIdentifier('+2348031234567'); }}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  channel === 'whatsapp'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => { setChannel('telegram'); setCustomerIdentifier('194820194'); }}
                className={`py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  channel === 'telegram'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>Telegram</span>
              </button>
            </div>
          </div>

          {/* Customer Persona */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Simulated Customer</h4>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Name</label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Identifier (Phone / Telegram ID)</label>
              <input
                type="text"
                value={customerIdentifier}
                onChange={e => setCustomerIdentifier(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          {/* Quick Scenario Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Test Scenarios</h4>
            {quickScenarios.map((sc, i) => (
              <button
                key={i}
                onClick={() => handleSend(sc.msg)}
                disabled={loading}
                className="w-full text-left p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 transition cursor-pointer disabled:opacity-50"
              >
                {sc.label}
              </button>
            ))}
          </div>
        </div>

        {/* Middle & Right Column: Interactive Chat Interface & Analysis */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          {/* Chat Container */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[520px] overflow-hidden">
            {/* Chat Header */}
            <div className={`p-4 text-white flex items-center justify-between ${
              channel === 'whatsapp' ? 'bg-emerald-700' : 'bg-sky-700'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  {channel === 'whatsapp' ? 'WA' : 'TG'}
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">{business.name} Sales AI</h3>
                  <p className="text-[10px] text-white/80">Online 24/7 • Verified Store Representative</p>
                </div>
              </div>

              <span className="text-[10px] font-bold bg-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Interactive Preview
              </span>
            </div>

            {/* Chat Timeline */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {chatLog.map((msg, i) => {
                const isCust = msg.sender === 'customer';
                return (
                  <div key={i} className={`flex flex-col ${isCust ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isCust
                          ? channel === 'whatsapp'
                            ? 'bg-emerald-600 text-white rounded-tr-none'
                            : 'bg-sky-600 text-white rounded-tr-none'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-none'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Paystack Order Link Button */}
                      {msg.metadata?.paymentLink && (
                        <div className="mt-3 pt-2 border-t border-slate-100">
                          <a
                            href={msg.metadata.paymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-xs"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Open Secure Paystack Payment Link</span>
                          </a>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-600 mt-1 px-1">{msg.time}</span>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-slate-700 p-2">
                  <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>AI Agent is analyzing query & searching catalog...</span>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={e => setInputMessage(e.target.value)}
                placeholder="Type customer message..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className={`p-2.5 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs ${
                  channel === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-sky-600 hover:bg-sky-700'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* AI Decision Diagnostics Bar */}
          {latestAnalysis && (
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> AI Decision Diagnostics
                </span>
                <span className="text-[10px] uppercase font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                  Model: gemini-3.8-flash
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400">Classified Intent: </span>
                  <span className="font-mono font-bold text-white capitalize">{latestAnalysis.intent}</span>
                </div>
                <div>
                  <span className="text-slate-400">Escalated to Staff: </span>
                  <span className="font-mono font-bold text-white">{latestAnalysis.escalated ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
