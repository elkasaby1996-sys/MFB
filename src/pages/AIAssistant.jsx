import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { usePremium } from '@/components/providers/PremiumProvider';
import SubPageHeader from '@/components/layout/SubPageHeader';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import AlienAvatar from '@/components/ui/AlienAvatar';
import { Input } from "@/components/ui/input";
import { Send, Sparkles, Loader2, Lock, MessageSquare, Plus, Trash2, Camera, X } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { format, startOfMonth, endOfMonth } from 'date-fns';


const QUICK_QUESTIONS = [
  { text: "How can I save more?", icon: "💰" },
  { text: "Analyze my spending", icon: "📊" },
  { text: "Budget tips", icon: "📋" },
  { text: "Reduce expenses", icon: "✂️" },
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [showConversations, setShowConversations] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [attachedImage, setAttachedImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: () => base44.entities.UserProfile.list(),
  });
  const profile = profiles?.[0];

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => base44.entities.Transaction.list('-date', 100),
  });

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => base44.entities.Budget.list(),
  });

  const { data: savingsGoals = [] } = useQuery({
    queryKey: ['savingsGoals'],
    queryFn: () => base44.entities.SavingsGoal.list(),
  });

  // Load conversations list on mount
  useEffect(() => {
    if (!profile) return;
    
    const convsData = localStorage.getItem(`ai_conversations_${profile.id}`);
    const convsList = convsData ? JSON.parse(convsData) : [];
    setConversations(convsList);
    
    // Load most recent conversation
    if (convsList.length > 0) {
      const mostRecent = convsList[0];
      setConversationId(mostRecent.id);
      const savedMessages = localStorage.getItem(`ai_messages_${mostRecent.id}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  }, [profile]);

  // Save messages and update conversations list
  useEffect(() => {
    if (messages.length > 0 && profile) {
      const convId = conversationId || `conv_${Date.now()}`;
      
      if (!conversationId) {
        setConversationId(convId);
      }
      
      // Save messages
      localStorage.setItem(`ai_messages_${convId}`, JSON.stringify(messages));
      
      // Update conversations list
      const convsData = localStorage.getItem(`ai_conversations_${profile.id}`);
      let convsList = convsData ? JSON.parse(convsData) : [];
      
      const existingIndex = convsList.findIndex(c => c.id === convId);
      const firstUserMessage = messages.find(m => m.role === 'user')?.content || 'New Chat';
      const preview = firstUserMessage.substring(0, 50);
      
      const convData = {
        id: convId,
        title: preview,
        date: new Date().toISOString(),
        messageCount: messages.length
      };
      
      if (existingIndex >= 0) {
        convsList[existingIndex] = convData;
      } else {
        convsList.unshift(convData);
      }
      
      // Keep only last 50 conversations
      convsList = convsList.slice(0, 50);
      
      localStorage.setItem(`ai_conversations_${profile.id}`, JSON.stringify(convsList));
      setConversations(convsList);
    }
  }, [messages, profile, conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { currentTier } = usePremium();

  // Helper: returns message count for the current month only
  const getMonthlyCount = (profile) => {
    const now = new Date();
    const resetDate = profile?.ai_messages_reset_month
      ? new Date(profile.ai_messages_reset_month)
      : null;
    const isCurrentMonth = resetDate &&
      resetDate.getMonth() === now.getMonth() &&
      resetDate.getFullYear() === now.getFullYear();
    return isCurrentMonth ? (profile?.ai_messages_used ?? 0) : 0;
  };

  // Enforce AI message limits per calendar month
  const AI_LIMITS = { free: 5, pro: 30, elite: 50 };
  const currentMonth = format(new Date(), 'yyyy-MM');
  const messagesUsed = getMonthlyCount(profile);
  const messageLimit = AI_LIMITS[currentTier] ?? 5;
  const canSendMessage = messagesUsed < messageLimit;

  // Prepare context for AI
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  
  const thisMonthTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date >= monthStart && date <= monthEnd;
  });

  const totalIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalExpenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const categorySpending = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const currency = profile?.currency || 'USD';

  const handleCameraCapture = async () => {
    // Request camera permission and open camera
    try {
      // Check if running in native app
      if (window.webkit?.messageHandlers?.camera) {
        // iOS native camera
        window.webkit.messageHandlers.camera.postMessage({
          action: 'capture',
          callback: 'handleCameraImage'
        });
      } else if (window.Android?.openCamera) {
        // Android native camera
        window.Android.openCamera();
      } else {
        // Web fallback - use file input with camera attribute
        fileInputRef.current?.click();
      }
    } catch (error) {
      console.error('Camera error:', error);
    }
  };

  const handleImageSelect = async (file) => {
    if (!file) return;
    
    setUploadingImage(true);
    try {
      // Upload image to get URL
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAttachedImage(file_url);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    }
    setUploadingImage(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageSelect(file);
    }
  };

  const sendMessage = async (messageText) => {
    if ((!messageText.trim() && !attachedImage) || isLoading) return;

    // Block send if limit reached
    const used = getMonthlyCount(profile);
    if (used >= messageLimit) {
      // canSendMessage is already false — UI shows the limit modal
      return;
    }

    const userMessage = { 
      role: 'user', 
      content: messageText || 'Analyze this image',
      image: attachedImage 
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    const imageUrl = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    try {
      const context = `You are the built-in financial coach inside MyFinanceBro. You are a precise product feature, not a chatbot.

STRICT RULES:
- Answer ONLY the exact question asked. Do not expand scope.
- Use ONLY the data provided below. Never invent, assume, or extrapolate.
- If asked about expenses only, do NOT discuss income.
- If asked for a specific period, use only that period's data.
- If data is insufficient, say "I only have [X] of tracked data for this." then answer with what's available.
- Never say: "if the trend holds", "likely similar", "based on assumptions".
- Do NOT start with: "Certainly", "Absolutely", "Great question", "Let's analyze".
- Do NOT add disclaimers unless the user asks for investment, tax, or legal advice.

RESPONSE FORMAT:
- 1 short summary sentence
- 3–5 bullets max
- 1 next-step sentence only if genuinely useful

For spending/budget/income analysis:
What I'm seeing: [one sentence]
What stands out:
- [bullet]
- [bullet]
Most useful next step: [one sentence]

TONE: Concise. Calm. Factual. Sound like a smart product feature.

USER DATA:
- Name: ${profile?.name || 'User'}
- Currency: ${currency}
- Financial Goal: ${profile?.financial_goal || 'not set'}
- This month's income: ${currency} ${totalIncome}
- This month's expenses: ${currency} ${totalExpenses}
- This month's net: ${currency} ${totalIncome - totalExpenses}
- Spending by category this month: ${JSON.stringify(categorySpending)}
- Budgets set: ${budgets.map(b => `${b.category}: ${b.amount}`).join(', ') || 'none'}
- Savings goals: ${savingsGoals.map(g => `${g.name}: ${g.current_amount}/${g.target_amount}`).join(', ') || 'none'}

USER QUESTION: ${messageText}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: context,
        file_urls: imageUrl ? [imageUrl] : undefined,
      });

      const aiMessage = { role: 'assistant', content: response };
      setMessages(prev => [...prev, aiMessage]);

      // Increment counter after successful send
      if (profile) {
        const now = new Date();
        await base44.entities.UserProfile.update(profile.id, {
          ai_messages_used: used + 1,
          ai_messages_reset_month: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        });
      }
    } catch (error) {
      console.error('AI Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "I apologize, but I'm experiencing technical difficulties. Please try again." 
      }]);
    }

    setIsLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const createNewChat = () => {
    setMessages([]);
    setConversationId(null);
    setShowConversations(false);
  };

  const loadConversation = (convId) => {
    const savedMessages = localStorage.getItem(`ai_messages_${convId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
      setConversationId(convId);
      setShowConversations(false);
    }
  };

  const deleteConversation = (convId) => {
    if (!profile) return;
    
    // Remove messages
    localStorage.removeItem(`ai_messages_${convId}`);
    
    // Update conversations list
    const convsData = localStorage.getItem(`ai_conversations_${profile.id}`);
    let convsList = convsData ? JSON.parse(convsData) : [];
    convsList = convsList.filter(c => c.id !== convId);
    localStorage.setItem(`ai_conversations_${profile.id}`, JSON.stringify(convsList));
    setConversations(convsList);
    
    // If deleting current conversation, create new chat
    if (convId === conversationId) {
      createNewChat();
    }
  };

  const clearCurrentChat = () => {
    if (conversationId && profile) {
      deleteConversation(conversationId);
    } else {
      setMessages([]);
    }
  };

  return (
    <div className="app-screen overflow-hidden flex flex-col bg-slate-950">
      <SubPageHeader title="AI Bro" />
      {/* Scrollable Messages Area - with padding for input bar + bottom nav */}
      <main className="flex-1 overflow-y-auto bg-slate-950" style={{ paddingBottom: 'calc(180px + var(--safe-bottom))' }}>
        <div className="px-4 safe-x">
          <div className="max-w-lg mx-auto space-y-3 py-3">
          
          {/* Header */}
          <div className="flex items-center justify-between gap-3 pb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
              <span className="text-white font-medium text-sm truncate">AI Financial Advisor</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-400 whitespace-nowrap">
                <span>{messagesUsed}/{messageLimit} messages</span>
              </div>
              <button
                onClick={() => setShowConversations(!showConversations)}
                className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 active:bg-slate-700 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
              {messages.length > 0 && (
                <button
                    onClick={clearCurrentChat}
                    className="p-1.5 rounded-lg bg-slate-800/50 text-red-400 active:bg-slate-700 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
              )}
            </div>
          </div>

          {/* Conversations Drawer */}
          <AnimatePresence>
            {showConversations && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-3"
              >
                <NeonCard className="p-4" glowColor="purple">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold text-sm">Chat History</h3>
                    <button
                      onClick={createNewChat}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg text-xs font-medium active:bg-cyan-500/30 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      New Chat
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {conversations.length === 0 ? (
                      <p className="text-slate-400 text-xs text-center py-4">No chat history yet</p>
                    ) : (
                      conversations.map((conv) => (
                        <div
                          key={conv.id}
                          className={`flex items-start gap-2 p-2.5 rounded-lg transition-all ${
                            conv.id === conversationId
                              ? 'bg-cyan-500/20 border border-cyan-500/30'
                              : 'bg-slate-800/50 active:bg-slate-700'
                          }`}
                        >
                          <button
                            onClick={() => loadConversation(conv.id)}
                            className="flex-1 text-left min-w-0"
                          >
                            <p className="text-white text-xs font-medium truncate">{conv.title}</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">
                              {format(new Date(conv.date), 'MMM d, h:mm a')} • {conv.messageCount} messages
                            </p>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this conversation?')) {
                                deleteConversation(conv.id);
                              }
                            }}
                            className="p-1.5 text-red-400 active:text-red-300 transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </NeonCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Messages */}
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="mb-4">
                <AlienAvatar avatarId={profile?.avatar || "green-suit"} size="lg" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Welcome, {profile?.name?.split(' ')[0] || 'User'}! 👋
              </h2>
              <p className="text-slate-400 text-sm mb-6 max-w-xs">
                I'm your AI Financial Advisor. Ask me anything about budgeting, saving, investing, or managing your finances.
              </p>
              
              <div className="grid grid-cols-2 gap-2 w-full">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q.text)}
                    className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-left text-sm text-white active:bg-slate-700 active:scale-[0.98] transition-all duration-200"
                  >
                    <span className="text-base">{q.icon}</span>
                    <span className="text-xs leading-tight">{q.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2.5 pb-3">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className={`flex gap-2.5 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 mt-0.5">
                        <AlienAvatar avatarId={profile?.avatar} size="sm" showGlow={false} />
                      </div>
                    )}
                    <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                      message.role === 'user' 
                        ? 'bg-cyan-500 text-white' 
                        : 'bg-slate-800/80 text-white'
                    }`}>
                      {message.image && (
                        <img 
                          src={message.image} 
                          alt="Uploaded" 
                          className="rounded-lg mb-2 max-w-full"
                        />
                      )}
                      {message.role === 'assistant' ? (
                        <ReactMarkdown 
                          className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:my-1 [&_p]:leading-relaxed text-sm"
                          components={{
                            p: ({ children }) => <p className="text-sm leading-relaxed">{children}</p>,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex gap-2.5 justify-start"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <AlienAvatar avatarId={profile?.avatar} size="sm" showGlow={false} />
                  </div>
                  <div className="bg-slate-800/80 rounded-2xl px-3.5 py-2 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span className="text-slate-400 text-sm">Thinking...</span>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

            </div>
          </div>
      </main>
      
      {/* Fixed Input Bar */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-800/50 bg-slate-900/95 backdrop-blur-xl z-40 safe-bottom safe-x keyboard-docked transition-[bottom] duration-200" style={{ paddingBottom: 'var(--safe-bottom)' }}>
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          {!canSendMessage ? (
            <div className="py-4 text-center">
              <Lock className="w-6 h-6 text-amber-400 mx-auto mb-2" />
              <p className="text-white font-medium text-sm">
                You've used all {messageLimit} AI messages for this month
              </p>
              <p className="text-slate-400 text-xs mb-3 mt-1">
                {currentTier === 'free' && 'Upgrade to Pro for 30 messages/month'}
                {currentTier === 'pro' && 'Upgrade to Elite for 50 messages/month'}
                {currentTier === 'elite' && `Your limit resets on ${format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), 'MMM d, yyyy')}`}
              </p>
              {currentTier !== 'elite' && (
                <NeonButton 
                  variant="purple" 
                  size="sm"
                  onClick={() => {
                    if (window.webkit?.messageHandlers?.iap) {
                      window.webkit.messageHandlers.iap.postMessage({ action: 'manageSubscription' });
                    } else if (window.Android?.manageSubscription) {
                      window.Android.manageSubscription('{}');
                    } else {
                      alert('Subscription management is only available in the mobile app');
                    }
                  }}
                >
                  {currentTier === 'free' ? 'Upgrade to Pro' : 'Upgrade to Elite'}
                </NeonButton>
              )}
            </div>
          ) : (
            <div className="py-3">
              {/* Usage bar */}
              {(() => {
                const pct = messageLimit > 0 ? (messagesUsed / messageLimit) * 100 : 0;
                const barColor = pct < 70 ? 'bg-green-500' : pct < 90 ? 'bg-yellow-400' : 'bg-red-500';
                return (
                  <div className="mb-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-500">{messagesUsed}/{messageLimit} messages used this month</span>
                    </div>
                    <div className="h-1 w-full bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })()}
              {attachedImage && (
                <div className="mb-2 relative inline-block">
                  <img 
                    src={attachedImage} 
                    alt="Preview" 
                    className="h-20 rounded-lg border border-slate-700"
                  />
                  <button
                    onClick={() => setAttachedImage(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
              {(() => {
                const isLimitReached = getMonthlyCount(profile) >= messageLimit;
                return (
                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleCameraCapture}
                      disabled={uploadingImage || isLoading}
                      className="h-12 w-12 flex-shrink-0 rounded-full bg-slate-800/80 border border-slate-700/50 text-cyan-400 active:bg-slate-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </button>
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Ask your financial advisor..."
                      className="flex-1 bg-slate-800/80 border-slate-700/50 text-white h-12 rounded-full px-4 text-base"
                      disabled={isLoading || isLimitReached}
                    />
                    <button
                      type="submit"
                      disabled={isLimitReached || (!input.trim() && !attachedImage) || isLoading}
                      onClick={isLimitReached ? (e) => e.preventDefault() : undefined}
                      className="h-12 w-12 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-[0_0_20px_rgba(0,255,255,0.3)] active:brightness-90 active:scale-95 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : isLimitReached ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                );
              })()}
            </div>
          )}
          
          {/* Disclaimer */}
          <div className="pb-3 pt-0">
            <button
              onClick={() => setShowDisclaimer(true)}
              className="w-full text-[10px] text-slate-500 text-center leading-tight underline underline-offset-2 active:opacity-70 transition-opacity"
            >
              AI disclaimer · tap to read
            </button>
          </div>

          {/* Disclaimer Modal */}
          {showDisclaimer && (
            <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={() => setShowDisclaimer(false)}>
              <div
                className="bg-slate-900 border border-slate-700 rounded-t-2xl w-full max-w-lg p-6 pb-[calc(2.5rem+var(--safe-bottom))] safe-x"
                onClick={e => e.stopPropagation()}
              >
                <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-5" />
                <h3 className="text-white font-semibold text-base mb-3">AI Disclaimer</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  This AI provides general information based on your tracked data. It does not provide financial, investment, legal, or tax advice, and important decisions should be independently verified.
                </p>
                <button
                  onClick={() => setShowDisclaimer(false)}
                  className="mt-5 w-full py-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium active:bg-slate-700 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
