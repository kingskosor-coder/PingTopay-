import React, { useEffect, useState } from 'react';
import { Clock, Plus, Trash2, Edit2, Play, Pause, Zap } from 'lucide-react';
import { FollowUpAutomation, Business } from '../types';
import { api } from '../api';

interface AutomationsViewProps {
  business: Business;
}

export const AutomationsView: React.FC<AutomationsViewProps> = ({ business }) => {
  const [automations, setAutomations] = useState<FollowUpAutomation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAutomations = async () => {
    try {
      const list = await api.getAutomations();
      setAutomations(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const handleToggle = async (id: string, current: boolean) => {
    try {
      const updated = await api.updateAutomation(id, { isActive: !current });
      setAutomations(prev => prev.map(a => (a.id === id ? updated : a)));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle automation');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this follow-up automation?')) return;
    try {
      await api.deleteAutomation(id);
      fetchAutomations();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-emerald-600" />
            Follow-Up & Sales Automations
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Re-engage customers on WhatsApp and Telegram who haven't completed their purchase.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-600">Loading automations...</div>
      ) : automations.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No active follow-up sequences</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automations.map(auto => (
            <div
              key={auto.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    Trigger: {auto.trigger.replace(/_/g, ' ')}
                  </span>
                  <button
                    onClick={() => handleToggle(auto.id, auto.isActive)}
                    className={`px-2.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1 ${
                      auto.isActive
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {auto.isActive ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    <span>{auto.isActive ? 'Active' : 'Paused'}</span>
                  </button>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-1">{auto.name}</h3>
                <p className="text-xs text-slate-600 mb-3">Delay: {auto.delayHours} hours after inactivity</p>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-mono">
                  "{auto.messageTemplate}"
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-700">
                <span>Sent: <strong className="text-slate-900">{auto.sentCount}</strong></span>
                <span>Converted: <strong className="text-emerald-800">{auto.convertedCount}</strong></span>
                <button
                  onClick={() => handleDelete(auto.id)}
                  className="p-1 text-slate-600 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
