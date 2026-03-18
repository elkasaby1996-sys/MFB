import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Sparkles, Lock, Send } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIGivingCoach({ 
  profile, 
  monthTotal, 
  yearTotal, 
  percentOfIncome 
}) {
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
      const context = `You are a friendly Giving Coach helping someone plan their charitable giving.

Current giving stats:
- Given this month: $${monthTotal}
- Given this year: $${yearTotal}
- Percentage of income: ${percentOfIncome.toFixed(1)}%

User question: ${input}

Provide warm, encouraging guidance on charitable giving, financial planning for giving, and balancing generosity with other goals. Focus on consistency, intentionality, and sustainability. Be supportive and non-judgmental.`;

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
      <NeonCard className="p-8 text-center" glowColor="purple">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Lock className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-white font-bold text-xl mb-2">AI Giving Coach</h3>
        <p className="text-slate-400 mb-4">
          Get personalized guidance on charitable giving
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
          <p className="text-slate-300 text-sm mb-3">Pro+ Features:</p>
          <ul className="text-left text-slate-400 text-sm space-y-2">
            <li>✓ Unlimited AI coaching</li>
            <li>✓ Giving strategy planning</li>
            <li>✓ Balance goals with generosity</li>
            <li>✓ Personalized insights</li>
          </ul>
        </div>
        <Link to={createPageUrl("Settings")}>
          <NeonButton variant="purple" className="w-full">
            Upgrade to Pro+
          </NeonButton>
        </Link>
      </NeonCard>
    );
  }

  return (
    <NeonCard className="p-5 min-h-[400px] flex flex-col" glowColor="purple">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="text-white font-semibold">AI Giving Coach</h3>
      </div>

      <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-400 text-sm mb-4">Your personal giving coach!</p>
            <div className="grid grid-cols-1 gap-2">
              {[
                "How much should I give per month?",
                "Balance giving with my savings goals?",
                "Plan consistent giving throughout the year?",
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

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about giving..."
          className="bg-slate-800 border-slate-700 text-white"
          disabled={loading}
        />
        <NeonButton onClick={handleSend} loading={loading} disabled={!input.trim()}>
          <Send className="w-4 h-4" />
        </NeonButton>
      </div>
    </NeonCard>
  );
}