import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Sparkles, Lock, Send } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AICoach({ profile, income, expenses, clients, clientRevenue }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const isPro = profile?.plan_tier === 'pro' || profile?.plan_tier === 'elite';

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const topClient = clients.length > 0 
        ? clients.reduce((top, c) => (clientRevenue[c.id] || 0) > (clientRevenue[top.id] || 0) ? c : top, clients[0])
        : null;

      const context = `You are a Side Hustle Coach helping a freelancer/entrepreneur.

Side Hustle Stats:
- Total Income: $${income}
- Total Expenses: $${expenses}
- Net Profit: $${income - expenses}
- Profit Margin: ${income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0}%
- Number of Clients: ${clients.length}
${topClient ? `- Top Client: ${topClient.name} (Revenue: $${clientRevenue[topClient.id] || 0})` : ''}

User question: ${input}

Provide practical, friendly business coaching advice. Focus on pricing, client management, profitability, and growth strategies. Be encouraging and action-oriented.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: context,
      });

      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      toast.error('Failed to get AI response');
    } finally {
      setLoading(false);
    }
  };

  if (!isPro) {
    return (
      <div className="space-y-4">
        <NeonCard className="p-8 text-center" glowColor="purple">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-white font-bold text-xl mb-2">AI Side Hustle Coach</h3>
          <p className="text-slate-400 mb-4">
            Get personalized business advice and growth strategies
          </p>
          <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
            <p className="text-slate-300 text-sm mb-3">Pro+ Features:</p>
            <ul className="text-left text-slate-400 text-sm space-y-2">
              <li>✓ Unlimited AI coaching</li>
              <li>✓ Client profitability analysis</li>
              <li>✓ Pricing recommendations</li>
              <li>✓ Growth strategies</li>
            </ul>
          </div>
          <Link to={createPageUrl("Settings")}>
            <NeonButton variant="purple" className="w-full">
              Upgrade to Pro+
            </NeonButton>
          </Link>
        </NeonCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NeonCard className="p-5 min-h-[400px] flex flex-col" glowColor="purple">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="text-white font-semibold">AI Side Hustle Coach</h3>
        </div>

        {/* Messages */}
        <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400 text-sm mb-4">Your personal business coach!</p>
              <div className="grid grid-cols-1 gap-2">
                {[
                  "Which client is most profitable?",
                  "How should I price my services?",
                  "How much should I save for taxes?",
                  "Tips for growing my income?",
                ].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="bg-slate-800/50 hover:bg-slate-700 rounded-lg p-3 text-left text-slate-300 text-sm transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`rounded-xl p-3 ${
                  msg.role === 'user'
                    ? 'bg-purple-500/20 ml-8'
                    : 'bg-slate-800/50 mr-8'
                }`}
              >
                <p className="text-white text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))
          )}
          {loading && (
            <div className="bg-slate-800/50 rounded-xl p-3 mr-8">
              <p className="text-slate-400 text-sm">Thinking...</p>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your coach..."
            className="bg-slate-800 border-slate-700 text-white"
            disabled={loading}
          />
          <NeonButton onClick={handleSend} loading={loading} disabled={!input.trim()}>
            <Send className="w-4 h-4" />
          </NeonButton>
        </div>
      </NeonCard>
    </div>
  );
}