import { useState, useEffect, useCallback } from 'react';
import { 
  DesktopIcon, 
  UserListIcon, 
  MegaphoneIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  ArrowClockwiseIcon,
  PhoneIcon,
  ChatCircleTextIcon,
  ArrowRightIcon,
  BellRingingIcon
} from '@phosphor-icons/react';
import { apiFetch } from '../../services/api';
import { useSocket } from '../../hooks/useSocket';

export interface Counter {
  employeeId: string;
  fullName: string;
  role: string;
  activeCounter?: string | null;
  counterNumber: number;
  isOnline: boolean;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  customerName: string;
  phoneNumber: string;
  status: 'WAITING' | 'CALLING' | 'SERVING' | 'SERVED' | 'CANCELLED' | 'NO_SHOW';
  preferredChannel: 'WHATSAPP' | 'SMS';
  isPriority: boolean;
  createdAt: string;
}

export default function StaffDashboard() {
  const socket = useSocket();

  // Active Desk Selection
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>('');
  
  // Active Ticket & Queue States
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [queueTickets, setQueueTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Audio Chime Trigger for Ticket Calling
  const playCallChime = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(() => {});
    } catch {
      // Audio fallback silent catch
    }
  };

  // Fetch available counters for staff assignment
  const fetchCounters = useCallback(async () => {
    try {
      const res = await apiFetch<{ counters: Counter[] }>('/counters');
      const counterList = res?.counters || [];
      setCounters(counterList);

      if (counterList.length > 0 && !selectedCounterId) {
        // Default to first online counter or first available desk
        setSelectedCounterId(counterList[0].employeeId);
      }
    } catch (err) {
      console.error('Failed to load register counters:', err);
    }
  }, [selectedCounterId]);

  // Fetch current ticket at assigned desk + waiting queue list
  const fetchStaffDeskState = useCallback(async () => {
    if (!selectedCounterId) return;

    try {
      setLoading(true);
      const [deskRes, queueRes] = await Promise.all([
        apiFetch<{ ticket: Ticket | null }>(`/staff/counters/${selectedCounterId}/current-ticket`).catch(() => ({ ticket: null })),
        apiFetch<{ tickets: Ticket[] }>(`/staff/counters/${selectedCounterId}/queue`).catch(() => ({ tickets: [] })),
      ]);

      setCurrentTicket(deskRes?.ticket || null);
      setQueueTickets(queueRes?.tickets || []);
    } catch (err) {
      console.error('Failed to load counter queue state:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCounterId]);

  // Initial loads
  useEffect(() => {
    fetchCounters();
  }, [fetchCounters]);

  useEffect(() => {
    fetchStaffDeskState();
  }, [fetchStaffDeskState]);

  // WebSocket real-time queue listener
  useEffect(() => {
    if (!socket || !selectedCounterId) return;

    const handleQueueUpdate = () => {
      fetchStaffDeskState();
    };

    socket.emit('join:counter', { counterId: selectedCounterId });
    socket.on('ticket:updated', handleQueueUpdate);
    socket.on('queue:updated', handleQueueUpdate);

    return () => {
      socket.off('ticket:updated', handleQueueUpdate);
      socket.off('queue:updated', handleQueueUpdate);
    };
  }, [socket, selectedCounterId, fetchStaffDeskState]);

  // Call Next Ticket
  const handleCallNext = async () => {
    if (!selectedCounterId) return;

    try {
      setActionLoading(true);
      const res = await apiFetch<{ ticket: Ticket }>(`/staff/counters/${selectedCounterId}/call-next`, {
        method: 'POST',
      });

      if (res?.ticket) {
        setCurrentTicket(res.ticket);
        playCallChime();
        fetchStaffDeskState();
      } else {
        alert('No waiting tickets in queue.');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to call next ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete Ticket (SERVED)
  const handleCompleteTicket = async () => {
    if (!currentTicket) return;

    try {
      setActionLoading(true);
      await apiFetch(`/staff/tickets/${currentTicket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'SERVED' }),
      });

      setCurrentTicket(null);
      fetchStaffDeskState();
    } catch (err: any) {
      alert(err.message || 'Failed to complete ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark No-Show (NO_SHOW)
  const handleMarkNoShow = async () => {
    if (!currentTicket) return;

    try {
      setActionLoading(true);
      await apiFetch(`/staff/tickets/${currentTicket.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'NO_SHOW' }),
      });

      setCurrentTicket(null);
      fetchStaffDeskState();
    } catch (err: any) {
      alert(err.message || 'Failed to mark no-show.');
    } finally {
      setActionLoading(false);
    }
  };

  // Recall / Re-notify Ticket
  const handleRecallTicket = async () => {
    if (!currentTicket) return;

    try {
      setActionLoading(true);
      await apiFetch(`/staff/tickets/${currentTicket.id}/recall`, {
        method: 'POST',
      });

      playCallChime();
      alert(`Customer ${currentTicket.customerName} re-notified via ${currentTicket.preferredChannel}!`);
    } catch (err: any) {
      alert(err.message || 'Failed to send recall notification.');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedCounter = counters.find((c) => c.employeeId === selectedCounterId);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 space-y-6">
      {/* Top Staff Operations Bar */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
            <span>Counter Staff Workstation</span>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time ticket dispatch & customer calling center
          </p>
        </div>

        {/* Counter Selection Dropdown */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
            <DesktopIcon size={18} className="text-emerald-400" />
            <span className="text-zinc-400 font-medium">Active Desk:</span>
            <select
              value={selectedCounterId}
              onChange={(e) => setSelectedCounterId(e.target.value)}
              className="bg-transparent font-bold text-zinc-100 focus:outline-none cursor-pointer"
            >
              {counters.map((c) => (
                <option key={c.employeeId} value={c.employeeId} className="bg-zinc-900 text-zinc-100">
                  Counter {c.counterNumber} {c.fullName ? `(${c.fullName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchStaffDeskState}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-300 transition-colors cursor-pointer"
            title="Refresh queue"
          >
            <ArrowClockwiseIcon size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Grid Workstation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Ticket Control Center */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Serving Card */}
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 space-y-6 relative overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                <MegaphoneIcon size={18} className="text-emerald-400" />
                <span>Currently Serving</span>
              </div>

              {selectedCounter && (
                <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  DESK #{selectedCounter.counterNumber}
                </span>
              )}
            </div>

            {currentTicket ? (
              <div className="space-y-6">
                {/* Giant Ticket Number Display */}
                <div className="text-center py-4 bg-zinc-950/80 border border-zinc-800/80 rounded-2xl relative">
                  {currentTicket.isPriority && (
                    <span className="absolute top-3 right-3 px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest">
                      VIP Priority Pass
                    </span>
                  )}
                  <p className="text-xs uppercase text-zinc-500 tracking-widest font-mono">Ticket Number</p>
                  <h2 className="text-6xl font-black text-emerald-400 tracking-tight font-mono mt-1">
                    #{currentTicket.ticketNumber}
                  </h2>
                </div>

                {/* Customer Info Card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/60 text-xs">
                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase">Customer Name</p>
                    <p className="font-bold text-zinc-200 mt-0.5 text-sm">{currentTicket.customerName || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase flex items-center gap-1">
                      <PhoneIcon size={12} />
                      <span>Phone Number</span>
                    </p>
                    <p className="font-mono text-zinc-300 mt-0.5">{currentTicket.phoneNumber || 'N/A'}</p>
                  </div>

                  <div>
                    <p className="text-zinc-500 text-[10px] uppercase flex items-center gap-1">
                      <ChatCircleTextIcon size={12} />
                      <span>Channel</span>
                    </p>
                    <p className="font-bold text-emerald-400 mt-0.5 uppercase">{currentTicket.preferredChannel}</p>
                  </div>
                </div>

                {/* Action Buttons Toolbar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <button
                    onClick={handleCompleteTicket}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircleIcon size={18} />
                    <span>Complete Ticket</span>
                  </button>

                  <button
                    onClick={handleRecallTicket}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <BellRingingIcon size={18} className="text-amber-400" />
                    <span>Re-Notify Customer</span>
                  </button>

                  <button
                    onClick={handleMarkNoShow}
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-semibold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <XCircleIcon size={18} />
                    <span>Mark No-Show</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Idle Desk Call Next State */
              <div className="text-center py-12 space-y-4">
                <div className="inline-flex p-4 bg-zinc-800/80 text-zinc-400 rounded-full">
                  <UserListIcon size={40} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-200">Counter Desk Idle</h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    No active ticket currently serving. Call the next customer in queue.
                  </p>
                </div>

                <button
                  onClick={handleCallNext}
                  disabled={actionLoading || queueTickets.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl transition-all cursor-pointer disabled:opacity-40 shadow-lg shadow-emerald-950"
                >
                  <MegaphoneIcon size={20} />
                  <span>Call Next Customer</span>
                  <ArrowRightIcon size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Live Desk Queue */}
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Desk Waiting Queue</h3>
                <p className="text-xs text-zinc-400">Next tickets lined up for Desk #{selectedCounter?.counterNumber || '-'}</p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                {queueTickets.length}
              </span>
            </div>

            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1">
              {queueTickets.length === 0 ? (
                <p className="text-center py-8 text-xs text-zinc-500">Queue is currently empty.</p>
              ) : (
                queueTickets.map((t, idx) => (
                  <div
                    key={t.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
                      t.isPriority
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-zinc-950/80 border-zinc-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-zinc-500 w-4">
                        #{idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-zinc-200 font-mono">
                          {t.ticketNumber}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate max-w-[120px]">
                          {t.customerName || 'Anonymous'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                        t.isPriority ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {t.isPriority ? 'VIP' : 'Standard'}
                      </span>
                      <p className="text-[10px] text-zinc-500 mt-1 flex items-center justify-end gap-1 font-mono">
                        <ClockIcon size={10} />
                        <span>{new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={handleCallNext}
            disabled={actionLoading || queueTickets.length === 0}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <MegaphoneIcon size={16} />
            <span>Call Top Ticket (#{queueTickets[0]?.ticketNumber || '-'})</span>
          </button>
        </div>
      </div>
    </div>
  );
}