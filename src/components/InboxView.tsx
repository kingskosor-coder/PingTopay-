import React, { useEffect, useState } from 'react';
import {
  Search,
  Bot,
  User,
  Send,
  UserCheck,
  Tag,
  ShieldCheck,
  Phone,
  Clock,
  CheckCheck,
  AlertCircle,
} from 'lucide-react';
import { Conversation, Message, Business, ChannelType, LeadStage } from '../types';
import { api } from '../api';

interface InboxViewProps {
  business: Business;
}

export const InboxView: React.FC<InboxViewProps> = ({ business }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [filterChannel, setFilterChannel] = useState<'all' | 'whatsapp' | 'telegram'>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'ai' | 'human'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0 && !selectedConv) {
        setSelectedConv(list[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const msgs = await api.getMessages(convId);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      setInternalNotes(selectedConv.internalNotes || '');
    }
  }, [selectedConv?.id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !replyText.trim() || sending) return;

    setSending(true);
    try {
      const newMsg = await api.sendHumanMessage(selectedConv.id, replyText.trim());
      setMessages(prev => [...prev, newMsg]);
      setReplyText('');
      fetchConversations();
    } catch (err: any) {
      alert(err.message || 'Error sending message');
    } finally {
      setSending(false);
    }
  };

  const handleToggleTakeover = async () => {
    if (!selectedConv) return;
    const newStatus = !selectedConv.isHumanHandled;
    try {
      const updated = await api.toggleTakeover(selectedConv.id, newStatus);
      setSelectedConv(updated);
      setConversations(prev => prev.map(c => (c.id === updated.id ? updated : c)));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle handover');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedConv) return;
    try {
      await api.updateConversationNotes(selectedConv.id, { internalNotes });
      alert('Internal staff notes saved');
    } catch (err: any) {
      alert(err.message || 'Failed to save notes');
    }
  };

  const filteredConversations = conversations.filter(c => {
    if (filterChannel !== 'all' && c.channel !== filterChannel) return false;
    if (filterMode === 'ai' && c.isHumanHandled) return false;
    if (filterMode === 'human' && !c.isHumanHandled) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = c.customerName?.toLowerCase().includes(q);
      const matchPhone = c.channelIdentifier.toLowerCase().includes(q);
      const matchMsg = c.lastMessageText?.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchMsg) return false;
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-65px)] flex overflow-hidden bg-white">
      {/* Column 1: Conversations List */}
      <div className="w-80 md:w-96 border-r border-slate-200 flex flex-col shrink-0 bg-slate-50/50">
        {/* Search & Channel Filters */}
        <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-600" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterChannel('all')}
              className={`flex-1 py-1 rounded-lg text-xs font-semibold ${
                filterChannel === 'all' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterChannel('whatsapp')}
              className={`flex-1 py-1 rounded-lg text-xs font-semibold ${
                filterChannel === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              WhatsApp
            </button>
            <button
              onClick={() => setFilterChannel('telegram')}
              className={`flex-1 py-1 rounded-lg text-xs font-semibold ${
                filterChannel === 'telegram' ? 'bg-sky-600 text-white' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Telegram
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-700 pt-1">
            <span>Filter Mode:</span>
            <div className="flex gap-2 font-medium">
              <button
                onClick={() => setFilterMode('all')}
                className={filterMode === 'all' ? 'text-slate-900 font-bold underline' : ''}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('ai')}
                className={filterMode === 'ai' ? 'text-emerald-800 font-bold underline' : ''}
              >
                AI Agent
              </button>
              <button
                onClick={() => setFilterMode('human')}
                className={filterMode === 'human' ? 'text-amber-800 font-bold underline' : ''}
              >
                Human Escalated
              </button>
            </div>
          </div>
        </div>

        {/* Conversation List Items */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-600">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-600">
              No conversations match your filter criteria.
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = selectedConv?.id === conv.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`p-3.5 cursor-pointer transition flex items-start gap-3 ${
                    isSelected ? 'bg-emerald-50/70 border-l-4 border-emerald-600' : 'hover:bg-slate-100/70'
                  }`}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs uppercase">
                      {conv.customerName ? conv.customerName.slice(0, 2) : 'CU'}
                    </div>
                    <span
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-xs ${
                        conv.channel === 'whatsapp' ? 'bg-emerald-600' : 'bg-sky-600'
                      }`}
                    >
                      {conv.channel === 'whatsapp' ? 'W' : 'T'}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {conv.customerName || conv.channelIdentifier}
                      </p>
                      <span className="text-[10px] text-slate-600 shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 truncate mt-0.5">
                      {conv.lastMessageText || 'New conversation'}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      {conv.isHumanHandled ? (
                        <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Human Handover
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Bot className="w-2.5 h-2.5" /> AI Active
                        </span>
                      )}
                      <span className="text-[9px] font-medium uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                        {conv.leadStage}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Column 2: Live Chat Timeline */}
      {selectedConv ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Top Chat Bar */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                {selectedConv.customerName ? selectedConv.customerName.slice(0, 2) : 'CU'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    {selectedConv.customerName || selectedConv.channelIdentifier}
                  </h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    selectedConv.channel === 'whatsapp' ? 'bg-emerald-100 text-emerald-800' : 'bg-sky-100 text-sky-800'
                  }`}>
                    {selectedConv.channel}
                  </span>
                </div>
                <p className="text-xs text-slate-600">{selectedConv.channelIdentifier}</p>
              </div>
            </div>

            {/* Handover Toggle Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleTakeover}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                  selectedConv.isHumanHandled
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{selectedConv.isHumanHandled ? 'Hand back to AI' : 'Take over chat'}</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40">
            {messages.map(msg => {
              const isCust = msg.sender === 'customer';
              const isAi = msg.sender === 'ai';
              const isHuman = msg.sender === 'human';

              return (
                <div key={msg.id} className={`flex flex-col ${isCust ? 'items-start' : 'items-end'}`}>
                  <div className="flex items-center gap-1 text-[10px] text-slate-600 mb-0.5">
                    {isCust ? (
                      <span className="font-semibold text-slate-700">{msg.senderName || 'Customer'}</span>
                    ) : isAi ? (
                      <span className="font-semibold text-emerald-800 flex items-center gap-0.5">
                        <Bot className="w-3 h-3" /> AI Sales Representative
                      </span>
                    ) : (
                      <span className="font-semibold text-slate-800 flex items-center gap-0.5">
                        <User className="w-3 h-3" /> Staff Agent
                      </span>
                    )}
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                      isCust
                        ? 'bg-white border border-slate-200 text-slate-800 shadow-xs'
                        : isAi
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-slate-900 text-white shadow-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Show Paystack order link badge if generated */}
                    {msg.metadata?.paymentLink && (
                      <div className="mt-2 pt-2 border-t border-emerald-700/50">
                        <a
                          href={msg.metadata.paymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-600 px-2 py-1 rounded-lg"
                        >
                          <ShieldCheck className="w-3 h-3" />
                          View Paystack Checkout Page
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply Box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
            <input
              type="text"
              placeholder={selectedConv.isHumanHandled ? 'Type message as human staff...' : 'Type message (will silence AI for this conversation)...'}
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={sending || !replyText.trim()}
              className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-slate-600">
          Select a conversation from the left to view message history.
        </div>
      )}

      {/* Column 3: Customer Profile & CRM Sidebar */}
      {selectedConv && (
        <div className="w-72 border-l border-slate-200 p-4 shrink-0 overflow-y-auto hidden xl:block bg-slate-50/50 space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Customer Profile</h4>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs space-y-2">
              <div>
                <span className="text-[10px] text-slate-600 uppercase font-semibold">Name</span>
                <p className="font-bold text-slate-900">{selectedConv.customerName || 'Anonymous'}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase font-semibold">Channel Contact</span>
                <p className="font-mono text-slate-800">{selectedConv.channelIdentifier}</p>
              </div>
              <div>
                <span className="text-[10px] text-slate-600 uppercase font-semibold">CRM Stage</span>
                <p className="font-bold text-emerald-800 uppercase">{selectedConv.leadStage}</p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Internal Staff Notes</h4>
            <textarea
              rows={4}
              value={internalNotes}
              onChange={e => setInternalNotes(e.target.value)}
              placeholder="Add private staff notes, customer preferences, or order notes..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
            <button
              onClick={handleSaveNotes}
              className="mt-2 w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              Save Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
