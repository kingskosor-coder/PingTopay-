import React, { useEffect, useState } from 'react';
import { Users, Filter, Calendar, MessageSquare, DollarSign, ArrowRight } from 'lucide-react';
import { Lead, LeadStage, Business } from '../types';
import { api } from '../api';

interface CrmLeadsViewProps {
  business: Business;
}

const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: 'new', label: 'New Inquiry', color: 'border-slate-300 bg-slate-50 text-slate-700' },
  { id: 'engaged', label: 'Engaged', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { id: 'qualified', label: 'Qualified', color: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
  { id: 'proposal', label: 'Product Recommended', color: 'border-purple-300 bg-purple-50 text-purple-700' },
  { id: 'payment_pending', label: 'Payment Pending', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { id: 'won', label: 'Closed / Paid', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { id: 'lost', label: 'Lost', color: 'border-rose-300 bg-rose-50 text-rose-700' },
];

export const CrmLeadsView: React.FC<CrmLeadsViewProps> = ({ business }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'board' | 'table'>('board');

  const fetchLeads = async () => {
    try {
      const list = await api.getLeads();
      setLeads(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    try {
      const updated = await api.updateLead(leadId, { leadStage: newStage });
      setLeads(prev => prev.map(l => (l.id === leadId ? updated : l)));
    } catch (err: any) {
      alert(err.message || 'Failed to update stage');
    }
  };

  const currencySymbol = business.currencySymbol || '₦';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-emerald-600" />
            CRM & Sales Pipeline
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Track leads captured automatically from WhatsApp and Telegram conversations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex">
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'board' ? 'bg-slate-900 text-white' : 'text-slate-700'
              }`}
            >
              Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                viewMode === 'table' ? 'bg-slate-900 text-white' : 'text-slate-700'
              }`}
            >
              List View
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-600">Loading pipeline...</div>
      ) : viewMode === 'board' ? (
        /* Kanban Board View */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.leadStage === stage.id);
            return (
              <div key={stage.id} className="w-72 shrink-0 flex flex-col bg-slate-50/70 rounded-2xl border border-slate-200 p-3">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <h3 className="text-xs font-bold text-slate-900">{stage.label}</h3>
                  </div>
                  <span className="text-[10px] font-extrabold bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700">
                    {stageLeads.length}
                  </span>
                </div>

                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {stageLeads.length === 0 ? (
                    <div className="p-6 text-center text-[11px] text-slate-600">No leads in this stage</div>
                  ) : (
                    stageLeads.map(lead => (
                      <div
                        key={lead.id}
                        className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            lead.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                          }`}>
                            {lead.channel}
                          </span>
                          <span className="text-[10px] text-slate-600 font-mono">
                            {lead.contactDetails}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-slate-900">
                          {lead.customerName || 'Prospect'}
                        </h4>

                        {lead.requirement && (
                          <p className="text-[11px] text-slate-700 line-clamp-2">
                            {lead.requirement}
                          </p>
                        )}

                        {lead.productsInterested?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {lead.productsInterested.map((prod, i) => (
                              <span key={i} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                {prod}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Move Stage Dropdown */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-600">Move to:</span>
                          <select
                            value={lead.leadStage}
                            onChange={e => handleStageChange(lead.id, e.target.value as LeadStage)}
                            className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 font-semibold"
                          >
                            {STAGES.map(s => (
                              <option key={s.id} value={s.id}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Channel</th>
                <th className="p-3.5">Stage</th>
                <th className="p-3.5">Interest</th>
                <th className="p-3.5">Last Interaction</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leads.map(lead => (
                <tr key={lead.id} className="hover:bg-slate-50/70">
                  <td className="p-3.5 font-bold text-slate-900">
                    {lead.customerName || lead.contactDetails}
                  </td>
                  <td className="p-3.5 capitalize">{lead.channel}</td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold uppercase text-slate-700">
                      {lead.leadStage}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700">{lead.productsInterested?.join(', ') || 'General Enquiry'}</td>
                  <td className="p-3.5 text-slate-600">{new Date(lead.createdAt).toLocaleDateString()}</td>
                  <td className="p-3.5 text-right">
                    <select
                      value={lead.leadStage}
                      onChange={e => handleStageChange(lead.id, e.target.value as LeadStage)}
                      className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold"
                    >
                      {STAGES.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
