import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChartLineUpIcon,
  DesktopIcon, 
  UsersIcon, 
  StarIcon, 
  ChartBarIcon, 
  ArrowClockwiseIcon,
  ClockIcon,
  CheckCircleIcon,
  UserListIcon,
  QrCodeIcon,
  DownloadSimpleIcon,
  XIcon,
  PlayIcon,
  PauseIcon
} from '@phosphor-icons/react';
import { apiFetch } from '../../services/api';

// Sub-components
import { UserManager } from './UserManager';
import { CounterAdmin, type Counter } from './CounterAdmin';
import { PriorityAndQRControls } from './PriorityAndQRControls';
import { StaffEfficiencyTable } from './StaffEfficiencyTable';

type NavView = 'OVERVIEW' | 'COUNTERS' | 'USERS' | 'PRIORITY_QR' | 'EFFICIENCY';

interface DashboardMetrics {
  waitingCount: number;
  avgWaitTime: string;
  completedToday: number;
  activeCounters: number;
}

const POLLING_INTERVAL_MS = 5000;

export default function AdminDashboard() {
  const [activeView, setActiveView] = useState<NavView>('OVERVIEW');
  const [counters, setCounters] = useState<Counter[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Polling State
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    waitingCount: 0,
    avgWaitTime: '0m',
    completedToday: 0,
    activeCounters: 0,
  });

  interface QRCodeData {
    targetUrl: string;
    pngDataUrl: string;
    svgString: string;
  }

  interface QRCodeResponse {
    message: string;
    data: QRCodeData;
  }

  const [qrData, setQrData] = useState<QRCodeData | null>(null);
  const [isQrLoading, setIsQrLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!showQrModal) {
      setQrData(null);
      return;
    }

    let isMounted = true;
    setIsQrLoading(true);

    const fetchQr = async () => {
      try {
        const response = await apiFetch<QRCodeResponse>('/admin/qr-code');

        if (isMounted) {
          setQrData(response.data || response);
        }
      } catch (err) {
        console.error('Failed to load QR code preview:', err);
      } finally {
        if (isMounted) {
          setIsQrLoading(false);
        }
      }
    };

    fetchQr();

    return () => {
      isMounted = false;
    };
  }, [showQrModal]);

  // Telemetry & Queue data fetcher
  const fetchDashboardData = useCallback(async (showLoadingSpinner = true) => {
    try {
      if (showLoadingSpinner) setLoading(true);

      const [overviewRes, countersRes, ticketsRes] = await Promise.all([
        apiFetch<any>('/admin/analytics/overview'),
        apiFetch<any>('/admin/counters'),
        apiFetch<any>('/admin/tickets'),
      ]);

      if (overviewRes?.analytics) {
        const { statusBreakdown, avgWaitTimeMinutes } = overviewRes.analytics;
        setMetrics({
          waitingCount: statusBreakdown?.WAITING || 0,
          avgWaitTime: avgWaitTimeMinutes ? `${Math.round(avgWaitTimeMinutes)}m` : '0m',
          completedToday: statusBreakdown?.SERVED || 0,
          activeCounters: countersRes?.counters?.filter((c: any) => c.isOnline).length || 0,
        });
      }

      if (countersRes?.counters) {
        setCounters(countersRes.counters);
      }

      if (ticketsRes?.tickets) {
        setTickets(ticketsRes.tickets);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to load dashboard analytics data:', err);
    } finally {
      if (showLoadingSpinner) setLoading(false);
    }
  }, []);

  // Initial Data Fetch
  useEffect(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Polling Interval Setup
  useEffect(() => {
    if (!isAutoRefresh) {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      return;
    }

    pollingTimerRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData(false);
      }
    }, POLLING_INTERVAL_MS);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [isAutoRefresh, fetchDashboardData]);


  // Helper to download general enterprise QR code
  const handleDownloadQr = () => {
    if (!qrData?.pngDataUrl) return;

    const a = document.createElement('a');
    a.href = qrData.pngDataUrl;
    a.download = 'Enterprise-CheckIn-QR.png';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-900/50 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="px-3 py-2">
            <h2 className="text-lg font-bold text-emerald-400 tracking-wider uppercase">Q-Flow Enterprise</h2>
            <p className="text-[11px] text-zinc-500 font-mono mt-0.5">Admin Operations Control</p>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveView('OVERVIEW')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'OVERVIEW'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <ChartLineUpIcon size={18} />
              <span>Overview & Analytics</span>
            </button>

            <button
              onClick={() => setActiveView('COUNTERS')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'COUNTERS'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <DesktopIcon size={18} />
                <span>Register Desks</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                {counters.length}
              </span>
            </button>

            <button
              onClick={() => setActiveView('USERS')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'USERS'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <UsersIcon size={18} />
              <span>User Provisioning</span>
            </button>

            <button
              onClick={() => setActiveView('PRIORITY_QR')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'PRIORITY_QR'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <StarIcon size={18} />
              <span>VIP & Priority Desk</span>
            </button>

            <button
              onClick={() => setActiveView('EFFICIENCY')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeView === 'EFFICIENCY'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
              }`}
            >
              <ChartBarIcon size={18} />
              <span>Staff Efficiency</span>
            </button>
          </nav>
        </div>

        <div className="px-3 py-2 border-t border-zinc-800/80">
          <p className="text-[10px] text-zinc-500">Q-Flow Architecture v1.0</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 space-y-6 overflow-y-auto">
        {/* Top Operational Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
              {activeView === 'OVERVIEW' && 'System Telemetry & Live Overview'}
              {activeView === 'COUNTERS' && 'Register Counter Administration'}
              {activeView === 'USERS' && 'Identity & Staff Access Management'}
              {activeView === 'PRIORITY_QR' && 'VIP Priority & QR Check-in Dispatcher'}
              {activeView === 'EFFICIENCY' && 'Operator Efficiency Metrics'}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Single Enterprise Queue Management Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {/* Auto Refresh Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs">
              <button
                onClick={() => setIsAutoRefresh((prev) => !prev)}
                className={`flex items-center gap-1.5 font-medium cursor-pointer ${
                  isAutoRefresh ? 'text-emerald-400' : 'text-zinc-500'
                }`}
              >
                {isAutoRefresh ? <PauseIcon size={14} /> : <PlayIcon size={14} />}
                <span>Live Polling</span>
              </button>

              {isAutoRefresh && (
                <span className="relative flex h-2 w-2 ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}

              <span className="text-[10px] text-zinc-500 ml-1 font-mono">
                {lastUpdated.toLocaleTimeString()}
              </span>
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchDashboardData(true)}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs rounded-xl transition-colors cursor-pointer"
            >
              <ArrowClockwiseIcon size={14} className={loading ? 'animate-spin' : ''} />
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {/* Dynamic View Panels */}
        {activeView === 'OVERVIEW' && (
          <div className="space-y-6">
            {/* Real-time Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                  <UserListIcon size={24} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Waiting in Queue</p>
                  <p className="text-2xl font-bold text-zinc-100 mt-0.5">{metrics.waitingCount}</p>
                </div>
              </div>

              <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                  <ClockIcon size={24} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Avg. Wait Time</p>
                  <p className="text-2xl font-bold text-zinc-100 mt-0.5">{metrics.avgWaitTime}</p>
                </div>
              </div>

              <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                  <CheckCircleIcon size={24} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Completed Today</p>
                  <p className="text-2xl font-bold text-zinc-100 mt-0.5">{metrics.completedToday}</p>
                </div>
              </div>

              <div className="p-5 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                  <DesktopIcon size={24} />
                </div>
                <div>
                  <p className="text-xs font-medium text-zinc-400">Active Counters</p>
                  <p className="text-2xl font-bold text-zinc-100 mt-0.5">{metrics.activeCounters}</p>
                </div>
              </div>
            </div>

            {/* Single Global Check-In QR Access Card */}
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Enterprise Self-Service Check-In QR</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Display or print the main entrance QR code for instant customer ticket check-ins
                </p>
              </div>

              <button
                onClick={() => setShowQrModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <QrCodeIcon size={16} />
                <span>Generate Check-In QR</span>
              </button>
            </div>

            {/* Recent Live Ticket Stream */}
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-4">
              <h3 className="text-sm font-semibold text-zinc-200">Recent System Tickets</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-zinc-900/80 text-zinc-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                    <tr>
                      <th className="py-3 px-4">Ticket ID</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Issued At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {tickets.slice(0, 5).map((ticket: any) => (
                      <tr key={ticket.id} className="hover:bg-zinc-800/30">
                        <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">{ticket.ticketNumber || ticket.id}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            ticket.isPriority ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {ticket.isPriority ? 'VIP' : 'Standard'}
                          </span>
                        </td>
                        <td className="py-3 px-4 uppercase font-semibold text-[10px] text-zinc-400">{ticket.status}</td>
                        <td className="py-3 px-4 text-zinc-400">{new Date(ticket.joinedAt).toLocaleTimeString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeView === 'COUNTERS' && (
          <CounterAdmin counters={counters} onRefresh={fetchDashboardData} />
        )}

        {activeView === 'USERS' && (
          <UserManager />
        )}

        {activeView === 'PRIORITY_QR' && (
          <PriorityAndQRControls onTicketIssued={fetchDashboardData} />
        )}

        {activeView === 'EFFICIENCY' && (
          <StaffEfficiencyTable />
        )}
      </main>

      {/* Global Check-In QR Code Modal Display & Downloader */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-5 relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <XIcon size={18} />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-zinc-100">
                Check-In QR-Code
              </h3>
              <p className="text-xs text-zinc-400">
                Scan to join queue
              </p>
            </div>

            <div className="flex justify-center items-center p-4 bg-white rounded-xl min-h-[216px]">
              {isQrLoading ? (
                <div className="flex flex-col items-center gap-2 text-zinc-500 text-xs font-mono">
                  <ArrowClockwiseIcon size={20} className="animate-spin text-emerald-600" />
                  <span>Loading QR...</span>
                </div>
              ) : (qrData?.pngDataUrl? (
                <img
                  src={qrData.pngDataUrl}
                  alt="Check-In QR"
                  className="w-48 h-48 object-contain"
                />
              ) : (
                <p className="text-xs text-red-500 font-medium">Failed to load QR code</p>
              ))}
            </div>

            <button
              onClick={handleDownloadQr}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <DownloadSimpleIcon size={16} />
              <span>Download Printable PNG</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}