import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Trash2, Edit2, Search, X, CheckCircle } from 'lucide-react';
import { KnowledgeDocument, KnowledgeCategory, Business } from '../types';
import { api } from '../api';

interface KnowledgeViewProps {
  business: Business;
}

export const KnowledgeView: React.FC<KnowledgeViewProps> = ({ business }) => {
  const [docs, setDocs] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState<KnowledgeDocument | null>(null);

  // Form
  const [category, setCategory] = useState<KnowledgeCategory>('faq');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const fetchDocs = async () => {
    try {
      const list = await api.getKnowledge();
      setDocs(list);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const openCreateModal = () => {
    setEditingDoc(null);
    setCategory('faq');
    setTitle('');
    setContent('');
    setShowModal(true);
  };

  const openEditModal = (d: KnowledgeDocument) => {
    setEditingDoc(d);
    setCategory(d.category);
    setTitle(d.title);
    setContent(d.content);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      if (editingDoc) {
        await api.updateKnowledge(editingDoc.id, { category, title, content });
      } else {
        await api.createKnowledge({ category, title, content });
      }
      setShowModal(false);
      fetchDocs();
    } catch (err: any) {
      alert(err.message || 'Failed to save knowledge document');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this document from AI knowledge?')) return;
    try {
      await api.deleteKnowledge(id);
      fetchDocs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  const filtered = docs.filter(d => {
    if (!search) return true;
    const q = search.toLowerCase();
    return d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q);
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-emerald-600" />
            Business Knowledge & Policies
          </h1>
          <p className="text-xs text-slate-700 mt-1">
            Authorized source of truth. Your AI sales agent will only answer based on these verified facts.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Knowledge Doc</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-600" />
        <input
          type="text"
          placeholder="Search policies or FAQs..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-600">Loading knowledge base...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No knowledge docs added</h3>
          <p className="text-xs text-slate-700 mt-1 mb-4">
            Add delivery policies, payment guidelines, or store FAQs so your AI agent never has to say "I don't know".
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
          >
            Create First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(doc => (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                    doc.category === 'delivery' ? 'bg-purple-100 text-purple-800' :
                    doc.category === 'policy' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {doc.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(doc)}
                      className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 mb-2">{doc.title}</h3>
                <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                  {doc.content}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
                <span>Active in AI context</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {editingDoc ? 'Edit Knowledge Article' : 'New Knowledge Article'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-600 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="faq">Frequently Asked Questions (FAQ)</option>
                  <option value="delivery">Delivery & Logistics Policy</option>
                  <option value="policy">Returns, Refunds & Exchanges</option>
                  <option value="business_info">Store Locations & Contact Info</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Do you offer nationwide delivery in Nigeria?"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Article Content *</label>
                <textarea
                  rows={5}
                  required
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Exact information, delivery pricing, turn-around times, or instructions for customers..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  {editingDoc ? 'Update Knowledge' : 'Save to Knowledge Base'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
