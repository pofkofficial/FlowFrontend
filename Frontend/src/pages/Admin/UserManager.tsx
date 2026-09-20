import { useState, useEffect } from 'react';
import { UserPlusIcon, KeyIcon, ShieldCheckIcon, UserIcon } from '@phosphor-icons/react';
import { apiFetch } from '../../services/api';

export interface User {
  id: string;
  employeeId: string;
  fullName: string;
  role: 'ADMIN' | 'COUNTER_STAFF';
  createdAt: string;
  activeCounter?: string | null;
}

export function UserManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New User Form State
  const [employeeId, setEmployeeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'COUNTER_STAFF' | 'ADMIN'>('COUNTER_STAFF');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ users: User[] }>('/admin/users');
      setUsers(data?.users || []);
    } catch (err) {
      console.error('Failed to fetch system users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/admin/users', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ employeeId, fullName, password, role }),
      });
      setIsModalOpen(false);
      setEmployeeId('');
      setFullName('');
      setPassword('');
      fetchUsers();
    } catch (err) {
      console.error('Failed to provision user:', err);
    }
  };

  const handleResetPassword = async (userId: string, empId: string) => {
    const newPassword = prompt(`Enter new password for employee ${empId}:`);
    if (!newPassword) return;

    try {
      await apiFetch(`/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ newPassword })
      });
      alert(`Password successfully updated for ${empId}`);
    } catch (err) {
      console.error('Failed to reset password:', err);
    }
  };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">System Users & Accounts</h2>
          <p className="text-xs text-zinc-400">Manage administrator accounts and counter staff provisioning</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-medium text-xs rounded-xl transition-colors cursor-pointer"
        >
          <UserPlusIcon size={16} weight="bold" />
          <span>Provision User</span>
        </button>
      </div>

      {/* User Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800 uppercase tracking-wider">
            <tr>
              <th className="py-3 px-4">Employee ID</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Active Assignment</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-zinc-800/30">
                <td className="py-3.5 px-4 font-mono font-medium text-zinc-200">{u.employeeId}</td>
                <td className="py-3.5 px-4 font-medium">{u.fullName}</td>
                <td className="py-3.5 px-4">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${
                      u.role === 'ADMIN'
                        ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}
                  >
                    {u.role === 'ADMIN' ? <ShieldCheckIcon size={12} /> : <UserIcon size={12} />}
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-zinc-400">
                  {u.activeCounter || 'Unbound'}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleResetPassword(u.id, u.employeeId)}
                    className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                    title="Reset Password"
                  >
                    <KeyIcon size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="text-center py-6 text-zinc-500">
                  No users provisioned in the system.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Provision User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-base font-semibold text-zinc-100">Provision New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Employee ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STF-004"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ama Tutu"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">System Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="COUNTER_STAFF">Counter Staff</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-medium hover:bg-emerald-600"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}