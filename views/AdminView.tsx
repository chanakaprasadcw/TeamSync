import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Layout } from '../components/Layout';
import { UserRole } from '../types';
import { Trash2, Shield, Plus, X } from 'lucide-react';

export const AdminView: React.FC = () => {
  const { users, organization, addUser, updateUserRole, deleteUser } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(UserRole.EMPLOYEE);
  const [newManagerId, setNewManagerId] = useState('');

  const managers = users.filter(u => u.role === UserRole.MANAGER);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) return;

    addUser({
        name: newName,
        email: newEmail,
        password: newPassword,
        role: newRole,
        managerId: newRole === UserRole.EMPLOYEE ? newManagerId : undefined,
    });
    setShowAddModal(false);
    // Reset form
    setNewName('');
    setNewEmail('');
    setNewPassword('');
    setNewRole(UserRole.EMPLOYEE);
    setNewManagerId('');
  };

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

      <div className="space-y-4">
        {users.map(user => (
          <div key={user.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
              <div>
                <h4 className="font-bold text-slate-800">{user.name} <span className="text-[10px] text-slate-400 font-normal">({user.role})</span></h4>
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
                        className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 outline-none font-medium"
                    >
                        {Object.values(UserRole).map(role => (
                            <option key={role} value={role}>{role}</option>
                        ))}
                    </select>
                </div>

                {user.role === UserRole.EMPLOYEE && (
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-500">Reports To</label>
                        <select 
                            value={user.managerId || ''}
                            onChange={(e) => updateUserRole(user.id, user.role, e.target.value)}
                            className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-900 outline-none w-32 truncate font-medium"
                        >
                            <option value="">No Manager</option>
                            {managers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>

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
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900"
                    >
                        <option value={UserRole.MANAGER}>Manager</option>
                        <option value={UserRole.EMPLOYEE}>Employee</option>
                    </select>
                </div>
                {newRole === UserRole.EMPLOYEE && (
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Manager</label>
                        <select 
                            value={newManagerId}
                            onChange={(e) => setNewManagerId(e.target.value)}
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900"
                        >
                            <option value="">Select...</option>
                            {managers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                )}
              </div>

              <button 
                type="submit" 
                className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl mt-4 hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-200"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};