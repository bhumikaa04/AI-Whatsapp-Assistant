// components/EnhancedConversationDetail.jsx
//
// DESIGN NOTES — Updated with blue/indigo palette matching the main Conversation view
// ─────────────────────────────────────────────────────────────────
// Palette (clean white-blue theme):
//   --canvas   #F8FAFC   page background
//   --surface  #FFFFFF   cards
//   --ink      #1E293B   headings, primary text
//   --muted    #64748B   secondary text
//   --border   #E2E8F0   hairlines
//   --primary  #4F46E5   indigo - primary actions
//   --primary-light #EEF2FF   indigo-50 - backgrounds
//   --blue     #2563EB   FAQ-answered messages
//   --green    #059669   interested/converted tags
//   --red      #DC2626   complaint/fallback messages
//   --purple   #7C3AED   upsell messages
//   --amber    #D97706   new lead tag
//
// Type: "Inter" (UI/body) + "JetBrains Mono" (phone numbers, timestamps)
//
// Add once to index.html <head>:
//   <link rel="preconnect" href="https://fonts.googleapis.com">
//   <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Send, Tag, Edit, Phone,
  Clock, MessageSquare, AlertCircle, BookOpen,
  TrendingUp, X, Check, StickyNote, Bot, User2, Sparkles
} from 'lucide-react';
import API from '../../../services/api';

export default function EnhancedConversationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingLead, setEditingLead] = useState(false);
  const [leadForm, setLeadForm] = useState({
    intent: '',
    name: '',
    tags: [],
    notes: []
  });
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');

  const tagOptions = ['Interested', 'FAQ-only', 'Hot lead', 'Price-sensitive', 'Technical'];

  useEffect(() => {
    fetchConversationData();
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversationData = async () => {
    setLoading(true);
    try {
      console.log(`🔍 Fetching conversation: /conversations/${id}`);
      const res = await API.get(`/conversations/${id}`);
      console.log('📥 Received conversation data:', res.data);

      setConversation(res.data);
      setMessages(res.data.messages || []);

      const customerData = res.data.customerProfile || {};
      setLeadForm({
        intent: customerData.intent || res.data.metrics?.intent || 'New Lead',
        name: customerData.name || res.data.metrics?.name || 'Anonymous Lead',
        tags: customerData.tags || [],
        notes: customerData.notes || []
      });
    } catch (error) {
      console.error('❌ Error fetching conversation:', error);
      console.error('Error details:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.warn('⚠️ Authentication required. Please log in.');
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;

    try {
      console.log(`📤 Sending reply to: /conversations/${id}/reply`);
      const res = await API.post(`/conversations/${id}/reply`, { text: reply });
      console.log('✅ Reply sent:', res.data);

      setMessages([...messages, res.data]);
      setReply('');

      if (conversation) {
        setConversation({
          ...conversation,
          metrics: { ...conversation.metrics, lastInteraction: new Date() }
        });
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      console.error('Error details:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        alert('Session expired. Please log in again.');
      }
    }
  };

  const updateLeadField = async (field, value) => {
    try {
      setLeadForm(prev => ({ ...prev, [field]: value }));
      console.log(`🔄 Would update ${field} to ${value}`);
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    try {
      setLeadForm(prev => ({
        ...prev,
        notes: [...prev.notes, {
          content: newNote,
          createdBy: 'Admin',
          createdAt: new Date().toISOString()
        }]
      }));
      setNewNote('');
      console.log('📝 Note added locally:', newNote);
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const toggleTag = async (tag) => {
    const newTags = leadForm.tags.includes(tag)
      ? leadForm.tags.filter(t => t !== tag)
      : [...leadForm.tags, tag];
    await updateLeadField('tags', newTags);
  };

  // ---- message type styling helpers --------------------------------

  const messageMeta = (msg) => {
    const isFromUser = msg.sender === 'user';
    if (isFromUser) {
      return { spine: 'bg-[#E2E8F0]', chipText: 'text-[#64748B]', label: 'Customer', Icon: User2 };
    }
    if (msg.messageType === 'faq-response') {
      return { spine: 'bg-[#2563EB]', chipText: 'text-[#2563EB]', label: 'FAQ answer', Icon: BookOpen };
    }
    if (msg.messageType === 'fallback') {
      return { spine: 'bg-[#DC2626]', chipText: 'text-[#DC2626]', label: 'Fallback', Icon: AlertCircle };
    }
    if (msg.isUpsell) {
      return { spine: 'bg-[#7C3AED]', chipText: 'text-[#7C3AED]', label: 'Upsell', Icon: TrendingUp };
    }
    return { spine: 'bg-[#4F46E5]', chipText: 'text-[#4F46E5]', label: 'Assistant', Icon: Bot };
  };

  const formatPhone = (phone) => {
    if (!phone) return 'Unknown';
    const cleaned = phone.replace(/^\+/, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const initials = (name) => {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    return parts.slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  };

  // Intent badge styles matching Conversation.jsx
  const getIntentBadgeStyle = (intent) => {
    switch (intent) {
      case "Interested":
      case "Converted":
        return "bg-green-100 text-green-800 border border-green-200";
      case "Product Inquiry":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "Complaint":
        return "bg-red-100 text-red-800 border border-red-200";
      case "Spam":
        return "bg-gray-200 text-gray-700 border border-gray-300";
      default:
        return "bg-purple-100 text-purple-800 border border-purple-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 bg-[#F8FAFC]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#4F46E5]"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-[#F8FAFC] font-[Inter]">
        <AlertCircle className="w-10 h-10 text-[#64748B] mb-3" />
        <h2 className="text-lg font-semibold text-[#1E293B]">Conversation not found</h2>
        <p className="text-[#64748B] text-sm mt-1">It may have been deleted, or the link is incorrect.</p>
        <button
          onClick={() => navigate('/dashboard/conversations')}
          className="mt-4 text-sm font-medium text-[#4F46E5] hover:text-[#4338CA] flex items-center"
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to conversations
        </button>
      </div>
    );
  }

  const metrics = conversation.metrics || {};

  return (
    <div className="flex h-[calc(100vh-100px)] bg-[#F8FAFC] font-[Inter]">

      {/* ============ LEFT — CASE FILE CARD ============ */}
      <div className="w-80 flex flex-col bg-white m-4 mr-0 rounded-2xl border border-[#E2E8F0] overflow-hidden relative">

        {/* folded tab accent - changed to indigo */}
        <div className="absolute top-0 right-0 w-10 h-10 bg-[#4F46E5]" style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }} />

        <div className="px-5 pt-5">
          <button
            onClick={() => navigate('/dashboard/conversations')}
            className="flex items-center text-[11px] tracking-wide uppercase font-medium text-[#64748B] hover:text-[#1E293B] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Conversations
          </button>
        </div>

        {/* Identity */}
        <div className="px-5 pt-4 pb-5 border-b border-[#E2E8F0]">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-11 w-11 rounded-full bg-[#4F46E5] text-white flex items-center justify-center text-sm font-semibold shrink-0">
                {initials(metrics.name)}
              </div>
              <div>
                <h2 className="font-semibold text-[19px] leading-tight text-[#1E293B]">{metrics.name || 'Anonymous Lead'}</h2>
                <div className="flex items-center text-[#64748B] text-xs mt-1 font-[JetBrains_Mono]">
                  <Phone className="w-3 h-3 mr-1.5" />
                  {formatPhone(conversation.customerPhone)}
                </div>
              </div>
            </div>
            <button
              onClick={() => setEditingLead(!editingLead)}
              className={`p-1.5 rounded-md transition-colors ${editingLead ? 'bg-[#4F46E5] text-white' : 'hover:bg-[#F8FAFC] text-[#64748B]'}`}
              title={editingLead ? 'Done editing' : 'Edit lead'}
            >
              {editingLead ? <Check className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-[#64748B] mb-1.5">Intent</div>
            {editingLead ? (
              <select
                value={leadForm.intent}
                onChange={(e) => updateLeadField('intent', e.target.value)}
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 text-sm text-[#1E293B] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]"
              >
                {['New Lead', 'Interested', 'Product Inquiry', 'Support Request', 'Complaint', 'Converted', 'Cold Lead', 'Spam'].map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getIntentBadgeStyle(metrics.intent)}`}>
                {metrics.intent || 'New Lead'}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 divide-x divide-[#E2E8F0] border-b border-[#E2E8F0]">
          <div className="px-5 py-3.5">
            <div className="text-[10px] uppercase tracking-wider text-[#64748B]">Messages</div>
            <div className="font-[JetBrains_Mono] text-lg mt-0.5 text-[#1E293B]">{messages.length}</div>
          </div>
          <div className="px-5 py-3.5">
            <div className="text-[10px] uppercase tracking-wider text-[#64748B]">Lifetime</div>
            <div className="font-[JetBrains_Mono] text-lg mt-0.5 text-[#1E293B]">{metrics.totalMessages || messages.length}</div>
          </div>
          <div className="px-5 py-3.5 col-span-2 border-t border-[#E2E8F0]">
            <div className="text-[10px] uppercase tracking-wider text-[#64748B] flex items-center">
              <Clock className="w-3 h-3 mr-1" /> Last active
            </div>
            <div className="font-[JetBrains_Mono] text-sm mt-0.5 text-[#1E293B]">
              {metrics.lastInteraction
                ? new Date(metrics.lastInteraction).toLocaleString([], {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                : 'Recent'}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="px-5 py-5 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] uppercase tracking-wider text-[#64748B] font-medium flex items-center">
              <Tag className="w-3.5 h-3.5 mr-1.5" /> Tags
            </h3>
            {editingLead && (
              <select
                value={newTag}
                onChange={(e) => {
                  if (e.target.value) { toggleTag(e.target.value); setNewTag(''); }
                }}
                className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-md px-2 py-1 text-[#1E293B] outline-none focus:border-[#4F46E5]"
              >
                <option value="">+ Add</option>
                {tagOptions.map(tag => <option key={tag} value={tag}>{tag}</option>)}
              </select>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {leadForm.tags.map(tag => (
              <div
                key={tag}
                className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  tag === 'Hot lead' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                }`}
              >
                {tag}
                {editingLead && (
                  <button onClick={() => toggleTag(tag)} className="ml-1.5 opacity-60 hover:opacity-100">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {leadForm.tags.length === 0 && !editingLead && (
              <span className="text-[#94A3B8] text-xs">No tags yet</span>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="px-5 py-5 flex-1 overflow-y-auto flex flex-col min-h-0">
          <h3 className="text-[11px] uppercase tracking-wider text-[#64748B] font-medium flex items-center mb-3">
            <StickyNote className="w-3.5 h-3.5 mr-1.5" /> Notes
          </h3>
          <div className="space-y-2 mb-4 overflow-y-auto flex-1 min-h-0">
            {leadForm.notes.map((note, index) => (
              <div key={index} className="flex bg-[#F8FAFC] rounded-lg overflow-hidden">
                <div className="w-1 bg-[#4F46E5] shrink-0" />
                <div className="p-3 text-sm">
                  <div className="text-[#1E293B] leading-snug">{note.content}</div>
                  <div className="text-[10px] text-[#64748B] mt-1.5 font-[JetBrains_Mono]">
                    {note.createdAt ? new Date(note.createdAt).toLocaleDateString() : 'Recent'} · {note.createdBy || 'Admin'}
                  </div>
                </div>
              </div>
            ))}
            {leadForm.notes.length === 0 && (
              <div className="text-[#94A3B8] text-xs text-center py-6">Nothing logged yet.</div>
            )}
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Log a note about this lead…"
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-2.5 text-sm text-[#1E293B] placeholder:text-[#94A3B8] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5] resize-none"
            rows="2"
          />
          <button
            onClick={addNote}
            disabled={!newNote.trim()}
            className="w-full mt-2 bg-[#4F46E5] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#4338CA] disabled:opacity-40 transition-colors"
          >
            Add note
          </button>
        </div>
      </div>

      {/* ============ MAIN — CHAT ============ */}
      <div className="flex-1 flex flex-col m-4">

        <div className="bg-white rounded-2xl border border-[#E2E8F0] flex-1 flex flex-col overflow-hidden">

          {/* Chat header */}
          <div className="border-b border-[#E2E8F0] px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[18px] text-[#1E293B]">{metrics.name || 'Anonymous'}</h3>
              <p className="text-xs text-[#64748B] font-[JetBrains_Mono] mt-0.5">{formatPhone(conversation.customerPhone)}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-wider text-[#64748B] flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mr-1.5"></span>
                WhatsApp
              </span>
              <div className="bg-indigo-50 text-indigo-700 rounded-lg px-2.5 py-1 flex items-center text-[10px] font-semibold">
                <Sparkles className="w-3 h-3 mr-1" /> AI Active
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-[#F8FAFC]">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#64748B]">
                <MessageSquare className="w-10 h-10 mb-3 text-[#E2E8F0]" />
                <p className="text-sm font-medium text-[#1E293B]">No messages yet</p>
                <p className="text-xs mt-1">Send the first message below to start the conversation.</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isFromUser = msg.sender === 'user';
                const meta = messageMeta(msg);
                return (
                  <div key={idx} className={`flex ${isFromUser ? '' : 'flex-row-reverse'} items-start gap-3`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${isFromUser ? 'bg-[#F1F5F9]' : 'bg-[#EEF2FF]'}`}>
                      <meta.Icon className={`w-3.5 h-3.5 ${meta.chipText}`} />
                    </div>
                    <div className="max-w-[64%] flex flex-col">
                      <div className={`flex items-center gap-2 mb-1 text-[10px] uppercase tracking-wide font-semibold ${meta.chipText} ${isFromUser ? '' : 'justify-end'}`}>
                        {meta.label}
                        {msg.timestamp && (
                          <span className="text-[#94A3B8] font-[JetBrains_Mono] font-normal normal-case tracking-normal">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="flex">
                        <div className={`w-[3px] rounded-full mr-2 self-stretch ${meta.spine}`} style={{ order: isFromUser ? 0 : 2 }} />
                        <p className={`text-sm text-[#1E293B] whitespace-pre-wrap leading-relaxed rounded-xl px-3.5 py-2.5 ${
                          isFromUser ? 'bg-[#F1F5F9]' : 'bg-[#EEF2FF]'
                        }`}>
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply input */}
          <form onSubmit={handleSend} className="border-t border-[#E2E8F0] p-4 bg-white">
            <div className="flex gap-2">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply…"
                className="flex-1 border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#4F46E5]/20 focus:border-[#4F46E5] transition-shadow bg-[#F8FAFC]"
                autoFocus
              />
              <button
                type="submit"
                className="bg-[#4F46E5] text-white p-3 rounded-xl hover:bg-[#4338CA] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!reply.trim()}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-[11px] text-[#94A3B8]">
              Press Enter to send · delivered over WhatsApp
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}