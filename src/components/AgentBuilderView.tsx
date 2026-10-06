import React, { useEffect, useState } from 'react';
import {
  Bot,
  Save,
  Plus,
  Trash2,
  Sliders,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { AIAgentConfig, Business, QualificationQuestion } from '../types';
import { api } from '../api';

interface AgentBuilderViewProps {
  business: Business;
}

export const AgentBuilderView: React.FC<AgentBuilderViewProps> = ({ business }) => {
  const [agent, setAgent] = useState<AIAgentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New question form state
  const [newQuestion, setNewQuestion] = useState('');
  const [newField, setNewField] = useState('');

  const fetchAgent = async () => {
    try {
      const res = await api.getAgentConfig();
      setAgent(res);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgent();
  }, []);

  const handleSave = async () => {
    if (!agent) return;
    setSaving(true);
    try {
      const updated = await api.updateAgentConfig(agent);
      setAgent(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save agent configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim() || !agent) return;
    const q: QualificationQuestion = {
      id: `qq_${Date.now()}`,
      question: newQuestion.trim(),
      field: newField.trim() || 'requirement',
      isRequired: false,
    };
    setAgent({
      ...agent,
      qualificationQuestions: [...agent.qualificationQuestions, q],
    });
    setNewQuestion('');
    setNewField('');
  };

  const handleRemoveQuestion = (id: string) => {
    if (!agent) return;
    setAgent({
      ...agent,
      qualificationQuestions: agent.qualificationQuestions.filter(q => q.id !== id),
    });
  };

  if (loading || !agent) {
    return <div className="p-8 text-center text-xs text-slate-600">Loading AI Agent configuration...</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Bot className="w-6 h-6 text-emerald-600" />
            AI Sales Agent Builder
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Configure how PingTopay qualifies leads, handles objections, recommends catalog products, and creates Paystack payment links.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Saved & Deployed!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Deploying Changes...' : 'Save & Update Agent'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Agent Persona & Identity */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Persona & Identity</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Agent Name</label>
            <input
              type="text"
              value={agent.agentName}
              onChange={e => setAgent({ ...agent, agentName: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tone of Voice</label>
            <select
              value={agent.tone}
              onChange={e => setAgent({ ...agent, tone: e.target.value as any })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              <option value="friendly">Friendly & Warm</option>
              <option value="professional">Professional & Formal</option>
              <option value="enthusiastic">Enthusiastic & High Energy</option>
              <option value="consultative">Consultative & Advisory</option>
              <option value="concise">Concise & Direct</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Greeting Message</label>
            <textarea
              rows={3}
              value={agent.greeting}
              onChange={e => setAgent({ ...agent, greeting: e.target.value })}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Card 2: Sales Behaviors */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Autonomous Sales Behaviors</h3>
          </div>

          <div className="space-y-3">
            {[
              { key: 'recommendProducts', label: 'Search & Recommend Products', desc: 'Queries real catalog matching customer inquiry' },
              { key: 'upsellEnabled', label: 'Suggest Premium Upgrades', desc: 'Offers matching accessories or higher tier when suitable' },
              { key: 'objectionHandling', label: 'Handle Common Objections', desc: 'Answers questions about authenticity, delivery speed, and sizing' },
              { key: 'paymentAssistance', label: 'Generate Paystack Payment Links', desc: 'Creates order and sends secure checkout links' },
              { key: 'followUpEnabled', label: 'Re-engagement Ready', desc: 'Prepares conversation for scheduled follow-ups' },
            ].map(item => {
              const checked = (agent.salesBehavior as any)[item.key];
              return (
                <div key={item.key} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.label}</p>
                    <p className="text-[11px] text-slate-600">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={e =>
                      setAgent({
                        ...agent,
                        salesBehavior: { ...agent.salesBehavior, [item.key]: e.target.checked },
                      })
                    }
                    className="w-4 h-4 accent-emerald-600 mt-0.5"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Lead Qualification Questions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Lead Qualification Questions</h3>
            </div>
            <span className="text-[11px] text-slate-600">Asked naturally during conversation</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {agent.qualificationQuestions.map(q => (
              <div key={q.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-slate-900">{q.question}</p>
                  <p className="text-[10px] text-slate-600">Field: {q.field}</p>
                </div>
                <button
                  onClick={() => handleRemoveQuestion(q.id)}
                  className="text-slate-600 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <input
              type="text"
              placeholder="e.g. Which city or state should we deliver to?"
              value={newQuestion}
              onChange={e => setNewQuestion(e.target.value)}
              className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <input
              type="text"
              placeholder="Field name (e.g. location)"
              value={newField}
              onChange={e => setNewField(e.target.value)}
              className="w-48 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
            <button
              onClick={handleAddQuestion}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Card 4: Business Rules & Safety Guardrails */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">Rules & Safety Guardrails</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Max Discount Percentage</label>
              <input
                type="number"
                value={agent.rules.maxDiscountPercent}
                onChange={e =>
                  setAgent({
                    ...agent,
                    rules: { ...agent.rules, maxDiscountPercent: Number(e.target.value) },
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
              <p className="text-[10px] text-slate-600 mt-1">Agent will refuse discounts above this limit</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Hours Start</label>
              <input
                type="text"
                value={agent.rules.businessHoursStart}
                onChange={e =>
                  setAgent({
                    ...agent,
                    rules: { ...agent.rules, businessHoursStart: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Business Hours End</label>
              <input
                type="text"
                value={agent.rules.businessHoursEnd}
                onChange={e =>
                  setAgent({
                    ...agent,
                    rules: { ...agent.rules, businessHoursEnd: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
