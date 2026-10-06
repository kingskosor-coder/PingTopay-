import React, { useEffect, useState } from 'react';
import { Server, ShieldCheck, Copy, Check, Terminal, FileCode, Layers, Database } from 'lucide-react';
import { api } from '../api';

export const AdminAndTerraformView: React.FC = () => {
  const [contractData, setContractData] = useState<any>(null);
  const [adminOverview, setAdminOverview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'contract' | 'terraform' | 'tenants'>('contract');
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    api.getSystemContract().then(setContractData).catch(console.error);
    api.getAdminOverview().then(setAdminOverview).catch(console.error);
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Server className="w-6 h-6 text-emerald-600" />
            Builder Output Contract & AWS Infrastructure
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Production specifications, multi-tenant isolation guarantees, and AWS Terraform IaC deployment templates.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
          <button
            onClick={() => setActiveTab('contract')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'contract' ? 'bg-slate-900 text-white' : 'text-slate-700'
            }`}
          >
            Builder Contract & MVP
          </button>
          <button
            onClick={() => setActiveTab('terraform')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'terraform' ? 'bg-slate-900 text-white' : 'text-slate-700'
            }`}
          >
            AWS Terraform IaC
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'tenants' ? 'bg-slate-900 text-white' : 'text-slate-700'
            }`}
          >
            Platform Tenants ({adminOverview?.totalTenants || 0})
          </button>
        </div>
      </div>

      {activeTab === 'contract' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-base">Builder Output Contract — PingTopay</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-emerald-700">
                  Strict Multi-Tenancy Architecture
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Every resource (channels, products, knowledge articles, AI configurations, leads, conversations, messages, orders, automations, and audit logs) is strictly bound to a tenant <code className="font-mono text-emerald-800">businessId</code>. No cross-business data leakage is possible.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-sky-700">
                  Omnichannel WhatsApp & Telegram
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Real Meta WhatsApp Cloud API webhooks with cryptographic subscription validation and Telegram Bot API webhook listeners. Real statuses displayed: Not Connected, Connecting, Connected, and Error.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-purple-700">
                  AI Sales Engine (Zero Hallucination)
                </span>
                <p className="text-slate-700 leading-relaxed">
                  Powered by <code className="font-mono font-bold text-purple-800">@google/genai</code> running on server-side with <code className="font-mono">gemini-3.8-flash</code>. Strict grounding restricts answers to the active catalogue. If information is missing, the AI escalates to human staff.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-900 uppercase text-[10px] tracking-wider text-amber-700">
                  Paystack Payment Security
                </span>
                <p className="text-slate-700 leading-relaxed">
                  The AI agent never trusts customer claims like "I have paid" or "Here is my slip". Payments are verified cryptographically via Paystack HMAC SHA-512 webhooks and API verification endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'terraform' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">Terraform AWS Production Infrastructure (main.tf)</h3>
              </div>
              <button
                onClick={() => copyCode(contractData?.terraform?.mainTf || '')}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-1"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied to Clipboard!' : 'Copy main.tf'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-96 leading-relaxed">
              {contractData?.terraform?.mainTf}
            </pre>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
              <p className="font-bold text-slate-900">AWS Deployment Instructions:</p>
              <ol className="list-decimal list-inside text-slate-700 space-y-1 font-mono text-[11px]">
                <li>cd infrastructure</li>
                <li>terraform init</li>
                <li>terraform plan -var="ecr_repository_url=&lt;YOUR_ECR_URL&gt;"</li>
                <li>terraform apply -auto-approve</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tenants' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Platform Tenant Workspaces</h3>
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
            {adminOverview?.businesses?.map((b: any) => (
              <div key={b.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                <div>
                  <p className="font-bold text-slate-900">{b.name}</p>
                  <p className="text-[11px] text-slate-600">{b.industry} • {b.location} • {b.currency}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.isPaystackConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {b.isPaystackConnected ? 'Paystack Active' : 'Paystack Sandbox'}
                  </span>
                  <span className="text-[10px] font-medium text-slate-700 font-mono">
                    ID: {b.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
