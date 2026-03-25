import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import {
  Search,
  Inbox,
  Calendar,
  Users,
  Building2,
  Activity,
  ArrowUpRight,
  Info,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Send,
  Loader2,
  Zap,
  MoreHorizontal,
  Briefcase,
  PenLine,
  ChevronRight,
  CornerDownLeft,
  Clock,
  LayoutGrid,
  Settings,
  Command
} from 'lucide-react';
import { generateChatResponse } from './lib/ai';

const INITIAL_FEED = [
  {
    id: '1',
    bucket: 'ground-breakers',
    source: 'Y Combinator',
    sourceLogo: 'https://logo.clearbit.com/ycombinator.com',
    time: '10m ago',
    title: 'YC S24 Late Applications Open for AI Startups',
    summary: 'Y Combinator has quietly opened a late application window specifically for foundational AI and agentic workflows. Deadline is in 48 hours.',
    opportunityScore: 94,
    media: {
      type: 'youtube',
      url: 'https://www.youtube.com/embed/0lJKucu6WiQ?si=V-kY-88-p8j71234&controls=0',
    },
    action: {
      id: 'a1',
      type: 'apply',
      target: 'Y Combinator',
      title: 'Draft: YC S24 Late App',
      draft: 'Hi YC Team,\n\nI\'m Luv, building Latents — an OS for professional opportunities. We missed the main deadline because we were heads down shipping our action-layer agent.\n\nWe have 170K distribution and are growing 20% WoW. Would love to submit a late application for S24.\n\nBest,\nLuv',
      cta: 'Submit Application',
      status: 'review',
      contextInsights: [
        "YC prefers concise, metric-driven communication.",
        "Highlighting your 20% WoW growth is highly recommended.",
        "Mentioning your 170K distribution shows strong traction."
      ]
    }
  },
  {
    id: '2',
    bucket: 'network-signals',
    source: 'Sequoia Capital',
    sourceLogo: 'https://logo.clearbit.com/sequoiacap.com',
    time: '1h ago',
    title: 'Roelof Botha is looking for agentic OS startups',
    summary: 'Roelof mentioned on a recent podcast that Sequoia is actively looking to fund startups building the "OS for agents". This perfectly aligns with Latents.',
    opportunityScore: 88,
    action: {
      id: 'a2',
      type: 'email',
      target: 'Sequoia Capital',
      title: 'Draft: Seed Round Intro',
      draft: "Hi Roelof,\n\nI'm building Latents, an OS that automates professional opportunity workflows. We're raising a $2M seed round.\n\nWe've hit $10k MRR in our first month and have strong engagement from early adopters.\n\nWould you be open to a brief chat next week?\n\nBest,\nLuv",
      cta: 'Send Email',
      status: 'review',
      contextInsights: [
        "Sequoia partners value strong early traction signals.",
        "Keep the ask specific and low-friction."
      ]
    }
  },
  {
    id: '3',
    bucket: 'social-listening',
    source: 'Twitter / X',
    sourceLogo: 'https://logo.clearbit.com/x.com',
    time: '2h ago',
    title: 'Trending: #AgenticOS',
    summary: 'The hashtag #AgenticOS is trending among tech founders. It\'s a great time to announce the Latents launch to capitalize on the momentum.',
    opportunityScore: 75,
    action: {
      id: 'a3',
      type: 'social',
      target: 'Twitter / X',
      title: 'Draft: Launch Announcement',
      draft: "Just launched Latents! 🚀\n\nIt's an OS for professional opportunities. We've built an action-layer agent that drafts emails, applies to accelerators, and manages your network.\n\nCheck it out here: [link]",
      cta: 'Post to X',
      status: 'review',
    }
  }
];

const IconButton = ({ icon: Icon, onClick, className = '' }) => (
  <button 
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors ${className}`}
  >
    <Icon size={16} />
  </button>
);

const NavItem = ({ icon: Icon, label, active, badge }) => (
  <div className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all duration-200 ${
    active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
  }`}>
    <div className="flex items-center gap-3">
      <Icon size={16} className={active ? 'text-white' : 'text-gray-400'} />
      <span className="text-[13px] font-medium tracking-wide">{label}</span>
    </div>
    {badge > 0 && (
      <span className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
        active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
      }`}>
        {badge}
      </span>
    )}
  </div>
);

export default function Home() {
  const [items, setItems] = useState(INITIAL_FEED);
  const [selectedId, setSelectedId] = useState(INITIAL_FEED[0].id);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'model', content: "I'm monitoring your network. I've drafted 3 new actions based on recent signals." }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);

  // Search State for Feed
  const [searchQuery, setSearchQuery] = useState('');
  const [isFetchingFeed, setIsFetchingFeed] = useState(false);

  const selectedItem = items.find(i => i.id === selectedId);

  const handleUpdateDraft = (newDraft) => {
    setItems(prev => prev.map(item => 
      item.id === selectedId 
        ? { ...item, action: { ...item.action, draft: newDraft } } 
        : item
    ));
  };

  const handleRewrite = async (instruction) => {
    if (!selectedItem) return;
    setIsRewriting(true);
    try {
      const prompt = `Rewrite the following draft according to this instruction: "${instruction}".\n\nDraft:\n${selectedItem.action.draft}\n\nReturn ONLY the rewritten text, nothing else.`;
      const response = await generateChatResponse(prompt, { isFast: true });
      handleUpdateDraft(response.trim());
    } catch (error) {
      console.error("Rewrite failed:", error);
    } finally {
      setIsRewriting(false);
    }
  };

  const handleExecute = () => {
    if (!selectedItem) return;
    setItems(prev => prev.map(item => 
      item.id === selectedId 
        ? { ...item, action: { ...item.action, status: 'done' } } 
        : item
    ));
    
    // Auto-select next pending item
    const nextItem = items.find(i => i.id !== selectedId && i.action.status !== 'done');
    if (nextItem) {
      setTimeout(() => setSelectedId(nextItem.id), 300); // slight delay for animation
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatLoading(true);
    try {
      const response = await generateChatResponse(userMsg);
      setMessages(prev => [...prev, { role: 'model', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "Error processing request." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleFeedSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim() || isFetchingFeed) return;
    setIsFetchingFeed(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/feed?query=${encodeURIComponent(searchQuery)}&page=1`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const data = await response.json();
      
      // Transform incoming FeedItems to the UI Format 
      if (data.items && data.items.length > 0) {
        const newFeed = data.items.map(resItem => ({
          id: resItem.id,
          bucket: resItem.bucket.toLowerCase().replace(' ', '-'),
          source: 'Web Search', // We'd dynamically map real sources if possible
          sourceLogo: 'https://logo.clearbit.com/news.ycombinator.com', 
          time: 'Just now', // Could parse from published_at
          title: resItem.title,
          summary: `Automatically cached from query: ${resItem.search_query}`,
          opportunityScore: Math.floor(Math.random() * 20) + 75,
          action: {
            id: `a-${resItem.id}`,
            type: 'social',
            target: 'Web Source',
            title: `Read Article`,
            draft: `Reviewing insights about: ${resItem.title}\n\nURL: ${resItem.url}`,
            cta: 'Mark Read',
            status: 'review'
          }
        }));
        setItems(newFeed);
        if (newFeed.length > 0) setSelectedId(newFeed[0].id);
      } else {
        alert("No results found for that query.");
      }
    } catch (err) {
      console.error("Failed to fetch feed:", err);
      alert("Error fetching feed. Check console.");
    } finally {
      setIsFetchingFeed(false);
    }
  };

  const pendingCount = items.filter(i => i.action.status !== 'done').length;

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans antialiased overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      
      {/* PANE 1: Navigation Sidebar (Ultra-clean, dense) */}
      <aside className="w-[240px] bg-[#F9FAFB] border-r border-gray-200/60 flex flex-col shrink-0 z-10">
        {/* User / Workspace Header */}
        <div className="h-14 flex items-center px-4 border-b border-gray-200/60">
          <div className="flex items-center gap-2.5 w-full cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-gray-800 to-black flex items-center justify-center shadow-sm">
              <Zap size={12} className="text-white fill-white" />
            </div>
            <span className="font-semibold text-[14px] tracking-tight">Latents OS</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="p-3 flex-1 overflow-y-auto">
          <div className="space-y-0.5 mb-6">
            <NavItem icon={Inbox} label="Inbox" active={true} badge={pendingCount} />
            <NavItem icon={Search} label="Search" />
            <NavItem icon={Calendar} label="Schedule" />
          </div>

          <div className="mb-6">
            <h4 className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Network</h4>
            <div className="space-y-0.5">
              <NavItem icon={Users} label="People" />
              <NavItem icon={Building2} label="Companies" />
              <NavItem icon={Activity} label="Signals" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200/60">
          <div className="flex items-center gap-3 px-3 py-2 text-gray-500 hover:text-gray-900 cursor-pointer rounded-md hover:bg-gray-100 transition-colors">
            <Settings size={16} />
            <span className="text-[13px] font-medium">Settings</span>
          </div>
        </div>
      </aside>

      {/* PANE 2: The Twitter-like Feed (Infinite Scroll) */}
      <main className="flex-1 overflow-y-auto bg-[#F4F5F7] relative">
        <div className="max-w-2xl mx-auto py-10 px-6 space-y-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Opportunities Feed</h1>
            <p className="text-gray-500 text-[14px] mt-1">Your personalized stream of actionable signals.</p>
            
            <form onSubmit={handleFeedSearch} className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask for custom feed signals (e.g. space x)"
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
                />
              </div>
              <button 
                type="submit" 
                disabled={isFetchingFeed}
                className="bg-gray-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
              >
                {isFetchingFeed ? <Loader2 size={16} className="animate-spin" /> : "Fetch"}
              </button>
            </form>
          </div>

          <AnimatePresence initial={false}>
            {items.map((item) => {
              const isSelected = item.id === selectedId;
              const isDone = item.action.status === 'done';

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => setSelectedId(item.id)}
                  className={`bg-white rounded-2xl p-6 border transition-all duration-200 cursor-pointer ${
                    isSelected ? 'border-blue-500 shadow-md ring-1 ring-blue-500/20' : 'border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300'
                  } ${isDone ? 'opacity-60 grayscale' : ''}`}
                >
                  {/* Feed Card Content */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img src={item.sourceLogo} alt="" className="w-10 h-10 rounded-full border border-gray-100 object-contain p-1" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[15px] text-gray-900">{item.source}</span>
                          <span className="text-[13px] text-gray-400 font-mono">{item.time}</span>
                        </div>
                        <span className="text-[11px] font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 inline-block">
                          {item.bucket.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[12px] font-mono font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                      <ArrowUpRight size={12} />
                      Score: {item.opportunityScore}
                    </div>
                  </div>

                  <h3 className="text-[18px] font-semibold text-gray-900 mb-2 leading-snug">{item.title}</h3>
                  <p className="text-[15px] text-gray-600 leading-relaxed mb-4">{item.summary}</p>

                  {item.media && item.media.type === 'youtube' && (
                    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-gray-200 mb-4">
                      <iframe
                        title="Embedded media"
                        src={item.media.url}
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                        <Zap size={12} className="text-white fill-white" />
                      </div>
                      <span className="text-[14px] font-medium text-gray-700">Latents drafted an action</span>
                    </div>
                    <button
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                        isSelected ? 'bg-blue-50 text-blue-700' : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {isSelected ? 'Reviewing Draft →' : 'Review Draft'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </main>

      {/* PANE 3: Action Center Detail (Right Sidebar) */}
      <aside className="w-[480px] bg-white border-l border-gray-200/60 flex flex-col shrink-0 relative shadow-2xl z-20">
        {selectedItem ? (
          <>
            {/* Detail Header */}
            <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200/60 shrink-0 bg-white">
              <div className="flex items-center gap-2 text-[14px] text-gray-500 font-medium">
                <span className="text-gray-900 font-semibold">Action Center</span>
                <ChevronRight size={14} className="text-gray-300" />
                <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{selectedItem.action.target}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsChatOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-[12px] font-medium transition-colors"
                >
                  <MessageSquare size={14} />
                  Ask Agent
                </button>
              </div>
            </header>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-6 space-y-6">

                {/* Target Insights */}
                {selectedItem.action.contextInsights && (
                  <div className="space-y-3">
                    <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Info size={12} /> Agent Insights
                    </h4>
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                      <ul className="space-y-2">
                        {selectedItem.action.contextInsights.map((insight, idx) => (
                          <li key={idx} className="text-[13px] text-blue-900/80 flex items-start gap-2.5 leading-relaxed">
                            <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0" />
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* The Execution Draft */}
                <div className="space-y-3 pb-24">
                  <h4 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <PenLine size={12} /> {selectedItem.action.title}
                  </h4>

                  <div className="relative group">
                    {isRewriting && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center z-10 border border-transparent">
                        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-100">
                          <Loader2 size={14} className="text-blue-500 animate-spin" />
                          <span className="text-[13px] font-medium text-gray-600">Rewriting...</span>
                        </div>
                      </div>
                    )}

                    <textarea
                      className="w-full min-h-[400px] bg-[#F9FAFB] text-[15px] text-gray-900 leading-relaxed resize-none p-6 rounded-xl border border-gray-200/80 shadow-inner focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/30 transition-all"
                      value={selectedItem.action.draft}
                      onChange={(e) => handleUpdateDraft(e.target.value)}
                      spellCheck={false}
                      disabled={selectedItem.action.status === 'done' || isRewriting}
                    />

                    {/* AI Quick Actions (Inside Editor Bottom) */}
                    {selectedItem.action.status !== 'done' && (
                      <div className="absolute bottom-4 left-6 right-6 flex flex-wrap gap-2 opacity-0 group-focus-within:opacity-100 hover:opacity-100 transition-opacity duration-200">
                        <button onClick={() => handleRewrite("Make it punchier and more concise")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-full text-[12px] font-medium transition-colors border border-gray-200 shadow-sm">
                          <Sparkles size={12} className="text-purple-500" /> Punchier
                        </button>
                        <button onClick={() => handleRewrite("Add traction metrics")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-full text-[12px] font-medium transition-colors border border-gray-200 shadow-sm">
                          <Sparkles size={12} className="text-purple-500" /> Metrics
                        </button>
                        <button onClick={() => handleRewrite("Improve professional tone")} className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 rounded-full text-[12px] font-medium transition-colors border border-gray-200 shadow-sm">
                          <Sparkles size={12} className="text-purple-500" /> Pro tone
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Fixed Bottom Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200/60 flex items-center justify-between z-20">
              <div className="flex items-center gap-2">
                <span className="text-[12px] text-gray-400 font-mono">
                  Last edited just now
                </span>
              </div>

              {selectedItem.action.status === 'done' ? (
                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-md text-[13px] font-medium border border-emerald-100/50">
                  <CheckCircle2 size={16} />
                  Executed Successfully
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExecute}
                    className="bg-[#0F172A] hover:bg-black text-white px-6 py-2.5 rounded-lg text-[14px] font-medium transition-all shadow-md flex items-center gap-2 active:scale-[0.98]"
                  >
                    {selectedItem.action.cta}
                    <div className="flex items-center gap-0.5 ml-1 opacity-50">
                      <Command size={12} />
                      <CornerDownLeft size={12} />
                    </div>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center border border-gray-100">
              <CheckCircle2 size={24} className="text-gray-300" />
            </div>
            <p className="text-[14px] font-medium">Inbox Zero. All actions executed.</p>
          </div>
        )}
      </aside>

      {/* Floating Chat Panel (Overlay) */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-6 right-[504px] w-[360px] bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-200/60 overflow-hidden flex flex-col z-50"
            style={{ height: '480px' }}
          >
            <div className="h-12 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Zap size={10} className="text-white fill-white" />
                </div>
                <span className="font-semibold text-[13px] text-gray-900">Agent</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-gray-900 transition-colors">
                <ChevronRight size={16} className="rotate-90" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-sm' 
                      : 'bg-[#F9FAFB] border border-gray-100 text-gray-900 rounded-bl-sm'
                  }`}>
                    <Markdown className="prose prose-sm max-w-none dark:prose-invert">
                      {msg.content}
                    </Markdown>
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[#F9FAFB] border border-gray-100 rounded-xl rounded-bl-sm px-4 py-3">
                    <Loader2 size={14} className="text-gray-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-gray-100 bg-white">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask agent to draft..."
                  className="w-full bg-[#F9FAFB] border border-gray-200/60 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg pl-3 pr-10 py-2 text-[13px] outline-none transition-all"
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="absolute right-1.5 w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-md disabled:opacity-50 disabled:bg-gray-300 transition-colors"
                >
                  <Send size={12} className="ml-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
