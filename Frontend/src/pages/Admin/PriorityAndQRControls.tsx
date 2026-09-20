import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  StarIcon, 
  PencilSimpleIcon, 
  MagnifyingGlassIcon, 
  CaretLeftIcon, 
  CaretRightIcon, 
  XIcon, 
  CheckCircleIcon 
} from '@phosphor-icons/react';
import { apiFetch } from '../../services/api';

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

const VALID_STATUSES = ['WAITING', 'CALLING', 'SERVING', 'SERVED', 'CANCELLED', 'NO_SHOW'];
const VALID_CHANNELS = ['WHATSAPP', 'SMS'];
const ITEMS_PER_PAGE = 50;

export function PriorityAndQRControls({ onTicketIssued }: { onTicketIssued: () => void }) {
  // VIP Ticket Form State
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<'WHATSAPP' | 'SMS'>('SMS');

  // Ticket Table State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');

  // Edit Modal State
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editChannel, setEditChannel] = useState<'WHATSAPP' | 'SMS'>('SMS');
  const [editReason, setEditReason] = useState<string>('');
  const [savingOverride, setSavingOverride] = useState(false);

  // Load all tickets from API
  const fetchTickets = useCallback(async () => {
    try {
      setLoadingTickets(true);
      const res = await apiFetch<{ tickets: Ticket[] }>('/admin/tickets');
      setTickets(res?.tickets || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Issue VIP Priority Ticket
  const handleIssuePriorityTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/tickets/priority', {
        method: 'POST',
        body: JSON.stringify({ customerName, phoneNumber, preferredChannel }),
      });
      setCustomerName('');
      setPhoneNumber('');
      onTicketIssued();
      fetchTickets();
      alert('VIP Ticket issued at Position 1');
    } catch (err) {
      console.error('Failed to issue priority ticket:', err);
    }
  };

  // Filter Logic across customerName, phoneNumber, ticketNumber, status, channel
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        ticket.customerName.toLowerCase().includes(q) ||
        ticket.phoneNumber.toLowerCase().includes(q) ||
        ticket.ticketNumber.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'ALL' || ticket.status === statusFilter;
      const matchesChannel = channelFilter === 'ALL' || ticket.preferredChannel === channelFilter;

      return matchesSearch && matchesStatus && matchesChannel;
    });
  }, [tickets, searchQuery, statusFilter, channelFilter]);

  // Pagination Logic (50 per page)
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredTickets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTickets, currentPage]);

  // Open Edit Modal with selected ticket details
  const handleOpenEditModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status);
    setEditName(ticket.customerName);
    setEditPhone(ticket.phoneNumber);
    setEditChannel(ticket.preferredChannel);
    setEditReason('');
  };

  // Submit PATCH Override to /api/v1/admin/tickets/:id/override
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      setSavingOverride(true);
      await apiFetch(`/admin/tickets/${selectedTicket.id}/override`, {
        method: 'PATCH',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          status: editStatus,
          customerName: editName.trim(),
          phoneNumber: editPhone.trim(),
          preferredChannel: editChannel,
          reason: editReason.trim() || undefined,
        }),
      });

      setSelectedTicket(null);
      fetchTickets();
      onTicketIssued();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket override');
    } finally {
      setSavingOverride(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Grid: VIP Issue Card */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 text-amber-400">
          <StarIcon size={20} weight="fill" />
          <h3 className="text-sm font-semibold text-zinc-100">Issue Priority VIP Ticket</h3>
        </div>
        <p className="text-xs text-zinc-400">
          Inserts customer directly at Position 1, incrementing existing wait positions.
        </p>

        <form onSubmit={handleIssuePriorityTicket} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <input
            type="text"
            required
            placeholder="Executive / VIP Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
          />
          <input
            type="text"
            required
            placeholder="Phone Number (+233...)"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
          />
          <select
            value={preferredChannel}
            onChange={(e) => setPreferredChannel(e.target.value as any)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
          >
            <option value="WHATSAPP">WhatsApp</option>
            <option value="SMS">SMS</option>
          </select>

          <button
            type="submit"
            className="py-2 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-medium rounded-xl transition-colors cursor-pointer"
          >
            Issue VIP Priority Ticket
          </button>
        </form>
      </div>

      {/* Ticket List & Administrative Overrides */}
      <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">System Ticket Registry</h3>
            <p className="text-xs text-zinc-400">Manage and override details for all enterprise tickets</p>
          </div>

          <span className="text-xs font-mono text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
            Total: {filteredTickets.length} tickets
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Search Query */}
          <div className="relative">
            <MagnifyingGlassIcon size={16} className="absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by Name, Phone, or Ticket #"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder:text-zinc-600"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
          >
            <option value="ALL">All Statuses</option>
            {VALID_STATUSES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => {
              setChannelFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
          >
            <option value="ALL">All Channels</option>
            {VALID_CHANNELS.map((ch) => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>

        {/* Ticket Data Table */}
        <div className="overflow-x-auto border border-zinc-800/80 rounded-xl">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-3 px-4">Ticket #</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Phone Number</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loadingTickets ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">Loading tickets...</td>
                </tr>
              ) : paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">No tickets found matching filters.</td>
                </tr>
              ) : (
                paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {ticket.ticketNumber}
                      {ticket.isPriority && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          VIP
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-200">{ticket.customerName || 'N/A'}</td>
                    <td className="py-3 px-4 text-zinc-400">{ticket.phoneNumber || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                        {ticket.preferredChannel}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-[10px]">
                      <span className={`px-2 py-0.5 rounded uppercase ${
                        ticket.status === 'WAITING' ? 'bg-amber-500/10 text-amber-400' :
                        ticket.status === 'SERVED' ? 'bg-emerald-500/10 text-emerald-400' :
                        ticket.status === 'CANCELLED' ? 'bg-rose-500/10 text-rose-400' : 'bg-zinc-800 text-zinc-400'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleOpenEditModal(ticket)}
                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors cursor-pointer"
                        title="Override Ticket"
                      >
                        <PencilSimpleIcon size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (50 per page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 text-xs">
            <p className="text-zinc-500">
              Page <span className="text-zinc-200 font-mono">{currentPage}</span> of{' '}
              <span className="text-zinc-200 font-mono">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 cursor-pointer"
              >
                <CaretLeftIcon size={14} />
              </button>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-800 cursor-pointer"
              >
                <CaretRightIcon size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Override Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <XIcon size={18} />
            </button>

            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Override Ticket #{selectedTicket.ticketNumber}
              </h3>
              <p className="text-xs text-zinc-400">Modify administrative ticket properties and status</p>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
                  >
                    {VALID_STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Channel</label>
                  <select
                    value={editChannel}
                    onChange={(e) => setEditChannel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="SMS">SMS</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Override Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. System correction / Manual customer update"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingOverride}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors cursor-pointer font-semibold disabled:opacity-50"
                >
                  <CheckCircleIcon size={16} />
                  <span>{savingOverride ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}