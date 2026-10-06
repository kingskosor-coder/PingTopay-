import React, { useEffect, useState } from 'react';
import { Radio, ShieldCheck, CheckCircle, AlertCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { Channel, Business } from '../types';
import { api } from '../api';

interface ChannelsViewProps {
  business: Business;
  onUpdateBusiness: (b: Business) => void;
}

export const ChannelsView: React.FC<ChannelsViewProps> = ({ business, onUpdateBusiness }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);

  // WhatsApp Form
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waWabaId, setWaWabaId] = useState('');
  const [waPhone, setWaPhone] = useState('');
  const [waSaving, setWaSaving] = useState(false);
  const [waMsg, setWaMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Telegram Form
  const [tgBotToken, setTgBotToken] = useState('');
  const [tgSaving, setTgSaving] = useState(false);
  const [tgMsg, setTgMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Paystack Form
  const [psPublicKey, setPsPublicKey] = useState(business.paystackPublicKey || '');
  const [psSecretKey, setPsSecretKey] = useState(business.paystackSecretKey || '');
  const [psWebhookSecret, setPsWebhookSecret] = useState(business.paystackWebhookSecret || '');
  const [psSaving, setPsSaving] = useState(false);
  const [psMsg, setPsMsg] = useState<{ text: string; error?: boolean } | null>(null);

  // Copy states
  const [copiedWA, setCopiedWA] = useState(false);
  const [copiedTG, setCopiedTG] = useState(false);
  const [copiedPS, setCopiedPS] = useState(false);

  const fetchChannels = async () => {
    try {
      const list = await api.getChannels();
      setChannels(list);
      const wa = list.find(c => c.type === 'whatsapp');
      if (wa?.whatsappConfig) {
        setWaPhoneNumberId(wa.whatsappConfig.phoneNumberId || '');
        setWaAccessToken(wa.whatsappConfig.accessToken || '');
        setWaWabaId(wa.whatsappConfig.wabaId || '');
        setWaPhone(wa.whatsappConfig.phoneNumber || '');
      }
      const tg = list.find(c => c.type === 'telegram');
      if (tg?.telegramConfig) {
        setTgBotToken(tg.telegramConfig.botToken || '');
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaSaving(true);
    setWaMsg(null);
    try {
      const res = await api.configureWhatsApp({
        phoneNumberId: waPhoneNumberId,
        accessToken: waAccessToken,
        wabaId: waWabaId,
        phoneNumber: waPhone,
        verifyToken: 'pingtopay_verify_token_2026',
      });
      if (res.success) {
        setWaMsg({ text: 'WhatsApp Cloud API verified & connected successfully!' });
      } else {
        setWaMsg({ text: res.error || 'Connection failed. Check Phone ID & Token.', error: true });
      }
      fetchChannels();
    } catch (err: any) {
      setWaMsg({ text: err.message || 'Error connecting WhatsApp', error: true });
    } finally {
      setWaSaving(false);
    }
  };

  const handleSaveTelegram = async (e: React.FormEvent) => {
    e.preventDefault();
    setTgSaving(true);
    setTgMsg(null);
    try {
      const res = await api.configureTelegram({ botToken: tgBotToken });
      if (res.success) {
        setTgMsg({ text: res.message });
      } else {
        setTgMsg({ text: 'Invalid Telegram Bot Token', error: true });
      }
      fetchChannels();
    } catch (err: any) {
      setTgMsg({ text: err.message || 'Telegram token test failed', error: true });
    } finally {
      setTgSaving(false);
    }
  };

  const handleSavePaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    setPsSaving(true);
    setPsMsg(null);
    try {
      const res = await api.connectPaystack({
        publicKey: psPublicKey,
        secretKey: psSecretKey,
        webhookSecret: psWebhookSecret,
      });
      setPsMsg({ text: res.message });
      onUpdateBusiness(res.business);
    } catch (err: any) {
      setPsMsg({ text: err.message || 'Paystack verification failed', error: true });
    } finally {
      setPsSaving(false);
    }
  };

  const waChannel = channels.find(c => c.type === 'whatsapp');
  const tgChannel = channels.find(c => c.type === 'telegram');

  const originUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const waWebhookUrl = `${originUrl}/api/webhooks/whatsapp`;
  const tgWebhookUrl = `${originUrl}/api/webhooks/telegram/${business.id}`;
  const psWebhookUrl = `${originUrl}/api/webhooks/paystack`;

  const copyToClipboard = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <Radio className="w-6 h-6 text-emerald-600" />
          Channel & Payment Integrations
        </h1>
        <p className="text-xs text-slate-700 mt-1">
          Authentic configurations for WhatsApp Cloud API, Telegram Bot API, and Paystack Payment Gateway.
        </p>
      </div>

      {/* 1. WhatsApp Cloud API */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              WA
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">WhatsApp Business Cloud API</h3>
              <p className="text-xs text-slate-700">Official Meta Developer Graph API</p>
            </div>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
            waChannel?.status === 'connected'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {waChannel?.status === 'connected' ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {/* Webhook details */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Meta Webhook Callback URL:</span>
            <button
              onClick={() => copyToClipboard(waWebhookUrl, setCopiedWA)}
              className="text-emerald-800 font-bold flex items-center gap-1 hover:underline"
            >
              {copiedWA ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedWA ? 'Copied!' : 'Copy Webhook URL'}
            </button>
          </div>
          <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-200 break-all">
            {waWebhookUrl}
          </p>
          <p className="text-[11px] text-slate-600">
            Verify Token: <code className="font-mono font-bold text-slate-800">pingtopay_verify_token_2026</code>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSaveWhatsApp} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number ID *</label>
              <input
                type="text"
                required
                value={waPhoneNumberId}
                onChange={e => setWaPhoneNumberId(e.target.value)}
                placeholder="e.g. 104829105829102"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">WhatsApp Business Account ID (WABA)</label>
              <input
                type="text"
                value={waWabaId}
                onChange={e => setWaWabaId(e.target.value)}
                placeholder="e.g. 394819205829103"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Permanent Meta Access Token *</label>
            <input
              type="password"
              required
              value={waAccessToken}
              onChange={e => setWaAccessToken(e.target.value)}
              placeholder="EAAG..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
          </div>

          {waMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              waMsg.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {waMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={waSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            {waSaving ? 'Testing Meta Connection...' : 'Verify & Connect WhatsApp'}
          </button>
        </form>
      </div>

      {/* 2. Telegram Bot API */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
              TG
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Telegram Bot API</h3>
              <p className="text-xs text-slate-700">Connect using BotFather token</p>
            </div>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
            tgChannel?.status === 'connected'
              ? 'bg-sky-100 text-sky-800'
              : 'bg-slate-100 text-slate-600'
          }`}>
            {tgChannel?.status === 'connected' ? `@${tgChannel.telegramConfig?.botUsername}` : 'Not Connected'}
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Telegram Webhook Endpoint:</span>
            <button
              onClick={() => copyToClipboard(tgWebhookUrl, setCopiedTG)}
              className="text-sky-800 font-bold flex items-center gap-1 hover:underline"
            >
              {copiedTG ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTG ? 'Copied!' : 'Copy Telegram Webhook'}
            </button>
          </div>
          <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-200 break-all">
            {tgWebhookUrl}
          </p>
        </div>

        <form onSubmit={handleSaveTelegram} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Telegram Bot Token *</label>
            <input
              type="password"
              required
              value={tgBotToken}
              onChange={e => setTgBotToken(e.target.value)}
              placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
            />
            <p className="text-[11px] text-slate-600 mt-1">Obtained from @BotFather on Telegram.</p>
          </div>

          {tgMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              tgMsg.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-sky-50 text-sky-800 border border-sky-200'
            }`}>
              {tgMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={tgSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            {tgSaving ? 'Validating Token...' : 'Verify & Connect Telegram Bot'}
          </button>
        </form>
      </div>

      {/* 3. Paystack Payment Gateway */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold text-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Paystack Payment Gateway</h3>
              <p className="text-xs text-slate-700">Enables cards, bank transfers, and USSD payments</p>
            </div>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
            business.isPaystackConnected
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800'
          }`}>
            {business.isPaystackConnected ? 'Live Verified' : 'Sandbox Mode'}
          </span>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-700">Paystack Webhook URL (Paste into Paystack Dashboard):</span>
            <button
              onClick={() => copyToClipboard(psWebhookUrl, setCopiedPS)}
              className="text-emerald-800 font-bold flex items-center gap-1 hover:underline"
            >
              {copiedPS ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedPS ? 'Copied!' : 'Copy Paystack Webhook'}
            </button>
          </div>
          <p className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-slate-200 break-all">
            {psWebhookUrl}
          </p>
        </div>

        <form onSubmit={handleSavePaystack} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Public Key</label>
              <input
                type="text"
                value={psPublicKey}
                onChange={e => setPsPublicKey(e.target.value)}
                placeholder="pk_live_... or pk_test_..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Secret Key *</label>
              <input
                type="password"
                required
                value={psSecretKey}
                onChange={e => setPsSecretKey(e.target.value)}
                placeholder="sk_live_... or sk_test_..."
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
              />
            </div>
          </div>

          {psMsg && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${
              psMsg.error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}>
              {psMsg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={psSaving}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            {psSaving ? 'Verifying with Paystack...' : 'Verify & Save Paystack Keys'}
          </button>
        </form>
      </div>
    </div>
  );
};
