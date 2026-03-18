import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { motion } from 'framer-motion';
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNetworkStatus } from '@/components/providers/NetworkStatusProvider';

export default function AIReceiptAnalyzer({ receipts, profile, onClose }) {
  const { isOnline } = useNetworkStatus();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hey Finance Bro! 👽 I can analyze your receipts and answer questions about your spending patterns. What would you like to know?"
    }
  ]);
  const [input, setInput] = useState('');

  const quickQuestions = [
    "How much did I spend on groceries this month?",
    "Which store do I visit most often?",
    "Show me all my coffee purchases this year",
    "Compare my spending at Carrefour vs other stores"
  ];

  const analyzeMutation = useMutation({
    mutationFn: async (question) => {
      // Prepare receipt data for context
      const receiptContext = receipts.map(r => ({
        merchant: r.merchant_name,
        amount: r.total_amount_base,
        currency: profile?.currency,
        category: r.category,
        date: r.date,
        tags: r.tags,
        items: r.items_json ? JSON.parse(r.items_json) : null
      }));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a friendly alien AI financial assistant called "Finance Bro" helping analyze receipt data.

User's receipts data:
${JSON.stringify(receiptContext, null, 2)}

User question: ${question}

Analyze the receipts and provide helpful insights. Be conversational, use emojis, and speak like a cool alien bro who's really good with money. Include specific numbers and examples from the data.`,
      });

      return response;
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response
      }]);
    },
    onError: () => {
      toast.error('Failed to analyze receipts');
    },
  });

  const handleSend = () => {
    if (!input.trim()) return;
    
    if (!isOnline) {
      toast.error("You're offline. Connect to the internet to use AI analysis.");
      return;
    }
    
    const userMessage = input.trim();
    setMessages(prev => [...prev, {
      role: 'user',
      content: userMessage
    }]);
    setInput('');
    
    analyzeMutation.mutate(userMessage);
  };

  const handleQuickQuestion = (question) => {
    if (!isOnline) {
      toast.error("You're offline. Connect to the internet to use AI analysis.");
      return;
    }
    
    setMessages(prev => [...prev, {
      role: 'user',
      content: question
    }]);
    analyzeMutation.mutate(question);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl h-[90vh] flex flex-col"
      >
        <NeonCard className="flex-1 flex flex-col" glowColor="purple">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">AI Receipt Analyzer</h3>
                <p className="text-slate-400 text-sm">Analyzing {receipts.length} receipts</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'
                      : 'bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {analyzeMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-slate-800 p-3 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  <span className="text-slate-400 text-sm">Analyzing your receipts...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="p-4 border-t border-slate-700 space-y-2">
              <p className="text-slate-400 text-xs mb-2">Quick questions:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(q)}
                    className="text-left p-2 text-xs bg-slate-800/50 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-700 space-y-2">
            <div className="flex gap-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about your receipts..."
                className="flex-1 bg-slate-800/50"
                disabled={!isOnline || analyzeMutation.isPending}
              />
              <NeonButton
                onClick={handleSend}
                variant="purple"
                size="icon"
                disabled={!isOnline || !input.trim() || analyzeMutation.isPending}
              >
                <Send className="w-5 h-5" />
              </NeonButton>
            </div>
            {!isOnline && (
              <p className="text-orange-400 text-xs mt-2 text-center">
                You're offline. AI analysis requires an internet connection.
              </p>
            )}
          </div>
        </NeonCard>
      </motion.div>
    </div>
  );
}