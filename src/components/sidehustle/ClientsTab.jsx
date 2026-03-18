import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Users, Briefcase, Mail, Phone, Trash2 } from "lucide-react";

export default function ClientsTab({ clients, onAddClient, onDeleteClient, clientRevenue, currency = 'USD' }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', notes: '' });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleSubmit = () => {
    onAddClient(formData);
    setShowModal(false);
    setFormData({ name: '', email: '', phone: '', company: '', notes: '' });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-white font-semibold">Clients</h3>
          </div>
          <NeonButton onClick={() => setShowModal(true)} variant="purple" size="sm">
            <Plus className="w-4 h-4" />
            Add Client
          </NeonButton>
        </div>

        {clients.length > 0 ? (
          <div className="space-y-3">
            {clients.map(client => {
              const revenue = clientRevenue[client.id] || 0;
              return (
                <NeonCard key={client.id} className="p-4" glowColor="cyan">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{client.name}</p>
                        {client.company && (
                          <p className="text-slate-400 text-sm">{client.company}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => onDeleteClient(client.id)}
                      className="text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {client.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-300">{client.phone}</span>
                      </div>
                    )}
                    {client.notes && (
                      <p className="text-slate-400 text-sm mt-2">{client.notes}</p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-sm">Total Revenue</span>
                      <span className="text-green-400 font-bold">{formatCurrency(revenue)}</span>
                    </div>
                  </div>
                </NeonCard>
              );
            })}
          </div>
        ) : (
          <NeonCard className="p-8 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-white font-medium mb-2">No clients yet</p>
            <p className="text-slate-400 text-sm">Add your first client to start tracking</p>
          </NeonCard>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-slate-300">Client Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Company</Label>
              <Input
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                placeholder="Acme Inc."
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+1234567890"
                  className="bg-slate-800 border-slate-700 text-white mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., TikTok ads, pays monthly"
                className="bg-slate-800 border-slate-700 text-white mt-1"
              />
            </div>

            <NeonButton 
              onClick={handleSubmit}
              disabled={!formData.name}
              className="w-full"
              variant="purple"
            >
              Add Client
            </NeonButton>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}