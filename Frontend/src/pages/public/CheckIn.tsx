import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom'
import { 
  QrCodeIcon, 
  UserIcon, 
  PhoneIcon, 
  ChatCircleTextIcon, 
  CheckCircleIcon, 
  ArrowRightIcon,
} from '@phosphor-icons/react';
import { apiFetch } from '../../services/api';

interface IssuedTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  phoneNumber: string;
  preferredChannel: 'WHATSAPP' | 'SMS';
  status: string;
  estimatedWaitMinutes?: number;
  aheadCount?: number;
}

export default function CheckIn() {
  const navigate = useNavigate();
 

  // Form inputs
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<'WHATSAPP' | 'SMS'>('WHATSAPP');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [issuedTicket, setIssuedTicket] = useState<IssuedTicket | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmitCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || !phoneNumber.trim()) {
      setErrorMessage('Please provide your name and phone number.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        preferredChannel,
      };

      const response = await apiFetch<{ ticket: IssuedTicket }>('/tickets/check-in', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      });

      if (response?.ticket) {
        setIssuedTicket(response.ticket);
      } else {
        throw new Error('Ticket generation response was invalid.');
      }
    } catch (err: any) {
      console.error('Check-in failed:', err);
      setErrorMessage(err.message || 'Check-in failed. Please try again or ask counter staff.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between p-4 sm:p-6 font-sans">
      {/* Top Header */}
      <header className="max-w-md w-full mx-auto pt-4 flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
            <QrCodeIcon size={22} weight="bold" />
          </div>
          <div>
            <h1 className="text-base font-bold text-zinc-100 tracking-tight">Enterprise Self Check-In</h1>
            <p className="text-[11px] text-zinc-400">Join queue & receive instant updates</p>
          </div>
        </div>
      </header>

      {/* Main Content Form / Confirmation State */}
      <main className="max-w-md w-full mx-auto my-auto py-6">
        {issuedTicket ? (
          /* Confirmation Pass Screen */
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-center space-y-6 shadow-2xl">
            <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full">
              <CheckCircleIcon size={36} weight="fill" />
            </div>

            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                You are checked in
              </span>
              <h2 className="text-4xl font-extrabold tracking-tight text-white font-mono mt-3">
                #{issuedTicket.ticketNumber}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Customer: <span className="text-zinc-200 font-semibold">{issuedTicket.customerName}</span>
              </p>
            </div>

            {/* Estimated Wait Stats */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-2xl">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Est. Wait Time</p>
                <p className="text-lg font-bold text-emerald-400 mt-0.5">
                  ~{issuedTicket.estimatedWaitMinutes || 10} mins
                </p>
              </div>
              <div className="border-l border-zinc-800 pl-3">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Notification Channel</p>
                <p className="text-xs font-bold text-zinc-200 mt-1 uppercase">
                  {issuedTicket.preferredChannel}
                </p>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed px-2">
              We have sent your ticket updates to <span className="text-zinc-200 font-mono">{issuedTicket.phoneNumber}</span>. 
              Keep an eye on your mobile device for desk calling alerts.
            </p>

            <button
              onClick={() => navigate(`/ticket/${issuedTicket.id}`)}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-950"
            >
              <span>Track Live Status Page</span>
              <ArrowRightIcon size={16} />
            </button>
          </div>
        ) : (
          /* Check-In Submission Form */
          <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
            <div>
              <h2 className="text-lg font-bold text-zinc-100">Welcome! Grab your pass</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Fill in your contact info to receive real-time updates when your number is called.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmitCheckIn} className="space-y-4 text-xs">
              {/* Full Name */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5 flex items-center gap-1.5">
                  <UserIcon size={14} className="text-emerald-400" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ama Mensah"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5 flex items-center gap-1.5">
                  <PhoneIcon size={14} className="text-emerald-400" />
                  <span>Phone Number</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+233 20 000 0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Notification Channel */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1.5 flex items-center gap-1.5">
                  <ChatCircleTextIcon size={14} className="text-emerald-400" />
                  <span>Preferred Notification Channel</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPreferredChannel('WHATSAPP')}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                      preferredChannel === 'WHATSAPP'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferredChannel('SMS')}
                    className={`py-3 px-3 rounded-xl border text-center transition-all cursor-pointer font-medium ${
                      preferredChannel === 'SMS'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    SMS Direct
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950"
              >
                {submitting ? (
                  <span>Generating Digital Pass...</span>
                ) : (
                  <>
                    <span>Confirm & Get Ticket</span>
                    <ArrowRightIcon size={16} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-md w-full mx-auto pb-4 text-center">
        <p className="text-[10px] text-zinc-600 font-mono">
          Q-Flow Automated Queue System &bull; Single Enterprise Portal
        </p>
      </footer>
    </div>
  );
}