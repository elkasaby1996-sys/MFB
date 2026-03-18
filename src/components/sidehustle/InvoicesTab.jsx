import React, { useState } from 'react';
import NeonCard from '@/components/ui/NeonCard';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import IOSPicker from '@/components/ui/IOSPicker';
import { Plus, FileText, AlertCircle, CheckCircle, Clock, Send } from "lucide-react";
import { format } from 'date-fns';
import MobileDatePicker from '@/components/ui/MobileDatePicker';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'slate', icon: FileText },
  sent: { label: 'Sent', color: 'blue', icon: Send },
  paid: { label: 'Paid', color: 'green', icon: CheckCircle },
  overdue: { label: 'Overdue', color: 'red', icon: AlertCircle },
};

export default function InvoicesTab({ 
  invoices, 
  clients, 
  onAddInvoice, 
  onMarkPaid,
  currency = 'USD' 
}) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    amount: '',
    issue_date: format(new Date(), 'yyyy-MM-dd'),
    due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    notes: '',
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const handleSubmit = () => {
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    onAddInvoice({
      ...formData,
      invoice_number: invoiceNumber,
      amount: parseFloat(formData.amount),
      status: 'draft',
      currency,
    });
    setShowModal(false);
    setFormData({
      client_id: '',
      amount: '',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      due_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      notes: '',
    });
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Invoices</h3>
          <NeonButton onClick={() => setShowModal(true)} variant="purple" size="sm">
            <Plus className="w-4 h-4" />
            Create Invoice
          </NeonButton>
        </div>

        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map(invoice => {
              const client = clients.find(c => c.id === invoice.client_id);
              const statusInfo = STATUS_CONFIG[invoice.status];
              const Icon = statusInfo.icon;
              
              return (
                <NeonCard key={invoice.id} className="p-4" glowColor={statusInfo.color}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-semibold">{invoice.invoice_number}</p>
                        <span className={`px-2 py-0.5 rounded-full text-xs bg-${statusInfo.color}-500/20 text-${statusInfo.color}-400 flex items-center gap-1`}>
                          <Icon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">{client?.name || 'Unknown Client'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-lg">{formatCurrency(invoice.amount)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <p className="text-slate-500 text-xs">Issue Date</p>
                      <p className="text-slate-300">{format(new Date(invoice.issue_date), 'MMM d, yyyy')}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs">Due Date</p>
                      <p className="text-slate-300">{format(new Date(invoice.due_date), 'MMM d, yyyy')}</p>
                    </div>
                  </div>

                  {invoice.notes && (
                    <p className="text-slate-400 text-sm mb-3">{invoice.notes}</p>
                  )}

                  {invoice.status !== 'paid' && (
                    <NeonButton 
                      onClick={() => onMarkPaid(invoice)}
                      variant="secondary"
                      size="sm"
                      className="w-full"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as Paid
                    </NeonButton>
                  )}
                </NeonCard>
              );
            })}
          </div>
        ) : (
          <NeonCard className="p-8 text-center">
            <p className="text-4xl mb-3">📄</p>
            <p className="text-white font-medium mb-2">No invoices yet</p>
            <p className="text-slate-400 text-sm">Create your first invoice to get paid</p>
          </NeonCard>
        )}
      </div>

      <Sheet open={showModal} onOpenChange={setShowModal}>
        <SheetContent side="bottom" hideClose className="bg-slate-950 border-slate-800 rounded-t-3xl flex flex-col" style={{ paddingBottom: 0 }}>
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-4">
            <div className="w-10 h-1 bg-slate-700 rounded-full" />
          </div>

          <div className="px-5 pb-4">
            <h3 className="text-white text-lg font-semibold">Create Invoice</h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-4">
            <div>
              <Label className="text-slate-300">Client *</Label>
              <IOSPicker
                value={formData.client_id}
                onValueChange={(v) => setFormData(prev => ({ ...prev, client_id: v }))}
                title="Select Client"
                placeholder="Select client"
                options={clients.map(c => ({ value: c.id, label: c.name, icon: '👤' }))}
                triggerClassName="mt-1"
              />
            </div>

            <div>
              <Label className="text-slate-300">Amount *</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="1000"
                className="bg-slate-800 border-slate-700 text-white mt-1 h-14"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-slate-300">Issue Date</Label>
                <MobileDatePicker
                  value={formData.issue_date}
                  onChange={(v) => setFormData(prev => ({ ...prev, issue_date: v }))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-slate-300">Due Date</Label>
                <MobileDatePicker
                  value={formData.due_date}
                  onChange={(v) => setFormData(prev => ({ ...prev, due_date: v }))}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-300">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Service description..."
                className="bg-slate-800 border-slate-700 text-white mt-1 min-h-[80px]"
              />
            </div>

            <div className="h-2" />
          </div>

          <div className="flex-shrink-0 border-t border-slate-800 bg-slate-950 px-5 py-4" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
            <NeonButton
              onClick={handleSubmit}
              disabled={!formData.client_id || !formData.amount}
              className="w-full min-h-[52px] text-base font-semibold"
              variant="purple"
            >
              Create Invoice
            </NeonButton>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}