import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Layout } from '../components/Layout';
import { UserRole, ROLE_HIERARCHY } from '../types';
import { Trash2, Shield, Plus, X, Mail, Loader2, CheckCircle2 } from 'lucide-react';

export const AdminView: React.FC = () => {
  const { users, organization, addUser, updateUserRole, deleteUser } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.ENGINEER);
  const [newManagerId, setNewManagerId] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter potential managers based on the selected new role
  // A manager must have a lower hierarchy number (higher rank) than the new user
  const availableManagers = users.filter(u => 
    ROLE_HIERARCHY[u.role] < ROLE_HIERARCHY[newRole]
  );

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    setIsSubmitting(true);
    
    await addUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        managerId: newManagerId || undefined,
    });
    
    setIsSubmitting(false);
    setShowAddModal(false);
    
    setSuccessToast(`Invitation sent to ${newEmail}`);
    setTimeout(() => setSuccessToast(''), 4000);

    // Reset form
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole(UserRole.ENGINEER);
    setNewManagerId('');
  };

  const roleOptions = Object.values(UserRole).filter(r => r !== UserRole.ADMIN);

  return (
    <Layout title={organization?.name || "Admin Panel"}>
      <div className="bg-purple-600 text-white p-6 rounded-2xl shadow-lg shadow-purple-200 mb-6 relative overflow-hidden">
        <Shield className="absolute -right-4 -bottom-4 text-purple-500 opacity-50 w-32 h-32" />
        <h2 className="text-2xl font-bold relative z-10">{organization?.name}</h2>
        <p className="text-purple-100 text-sm relative z-10">Admin Control Center</p>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">Team Members</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-slate-700 active:scale-95 transition-all"
        >
          <Plus size={14} /> Add User
        </button>
      </div>

      <div className="space-y-4 pb-20">
        {users.map(user => (
          <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
              <div>
                <h4 className="font-bold text-slate-800">{user.name}</h4>
                <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">{user.role.replace('_', ' ')}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
              <div className="ml-auto">
                <button 
                  onClick={() => deleteUser(user.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                >
                    <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-2 bg-slate-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500">Role</label>
                    <select 
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as UserRole, user.managerId)}
                        className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 outline-none font-medium max-w-[150px]"
                    >
                        {Object.values(UserRole).map(role => (
                            <option key={role} value={role}>{role.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>

                {user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER && (
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-500">Reports To</label>
                        <select 
                            value={user.managerId || ''}
                            onChange={(e) => updateUserRole(user.id, user.role, e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 outline-none w-32 truncate font-medium"
                        >
                            <option value="">No Manager</option>
                            {users
                                .filter(u => ROLE_HIERARCHY[u.role] < ROLE_HIERARCHY[user.role])
                                .map(m => (
                                <option key={m.id} value={m.id}>{m.name} ({m.role.replace('_',' ')})</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>

      {/* Success Toast */}
      {successToast && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in z-[100]">
              <CheckCircle2 size={18} className="text-green-400" />
              <span className="text-xs font-semibold">{successToast}</span>
          </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Add Team Member</h2>
                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>
            
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                <input 
                  type="email" 
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Password</label>
                <input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Role</label>
                    <select 
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900"
                    >
                        {roleOptions.map(r => (
                            <option key={r} value={r}>{r.replace('_', ' ')}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Reports To</label>
                    <select 
                        value={newManagerId}
                        onChange={(e) => setNewManagerId(e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900"
                        disabled={availableManagers.length === 0}
                    >
                        <option value="">{availableManagers.length === 0 ? 'No higher rank avail.' : 'Select Manager...'}</option>
                        {availableManagers.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.role.replace('_',' ')})</option>
                        ))}
                    </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl mt-4 hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                    <>
                        <Loader2 size={18} className="animate-spin" /> Sending Invite...
                    </>
                ) : (
                    <>
                        <Mail size={18} /> Send Invitation
                    </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};