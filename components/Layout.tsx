import React, { useState } from 'react';
import { useStore } from '../services/store';
import { UserRole } from '../types';
import { LogOut, Menu, User as UserIcon, CheckCircle, MapPin, Users, X, KeyRound } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const { currentUser, logout, changePassword } = useStore();
  const [showProfile, setShowProfile] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if(newPassword) {
        changePassword(newPassword);
        setMsg("Password updated successfully!");
        setNewPassword('');
        setTimeout(() => setMsg(''), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className={`p-2 rounded-lg ${
             currentUser?.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-600' :
             currentUser?.role === UserRole.MANAGER ? 'bg-blue-100 text-blue-600' :
             'bg-emerald-100 text-emerald-600'
           }`}>
             {currentUser?.role === UserRole.ADMIN ? <Users size={20}/> :
              currentUser?.role === UserRole.MANAGER ? <CheckCircle size={20}/> :
              <MapPin size={20}/>}
           </div>
           <div>
             <h1 className="font-bold text-slate-800 text-lg leading-tight">{title}</h1>
             <p className="text-xs text-slate-500 font-medium">Hello, {currentUser?.name}</p>
           </div>
        </div>
        <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20 p-4">
        {children}
      </main>

      {/* Bottom Nav */}
      <div className="absolute bottom-0 w-full bg-white border-t border-slate-200 py-3 flex justify-around items-center text-slate-400">
        <button className="flex flex-col items-center gap-1 text-slate-800">
          <Menu size={20} />
          <span className="text-[10px] font-semibold">Home</span>
        </button>
        <button 
            onClick={() => setShowProfile(true)}
            className="flex flex-col items-center gap-1 hover:text-blue-600 transition-colors"
        >
          <UserIcon size={20} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
            <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <img src={currentUser?.avatar} alt="Profile" className="w-12 h-12 rounded-full bg-slate-200" />
                        <div>
                            <h3 className="font-bold text-slate-800">{currentUser?.name}</h3>
                            <p className="text-xs text-slate-500">{currentUser?.email}</p>
                            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600">{currentUser?.role}</span>
                        </div>
                    </div>
                    <button onClick={() => setShowProfile(false)} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="border-t border-slate-100 pt-4">
                    <h4 className="font-semibold text-sm text-slate-700 mb-3 flex items-center gap-2">
                        <KeyRound size={16} /> Change Password
                    </h4>
                    <form onSubmit={handleChangePassword} className="space-y-3">
                        <input 
                            type="password" 
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button 
                            type="submit"
                            disabled={!newPassword} 
                            className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
                        >
                            Update Password
                        </button>
                        {msg && <p className="text-green-600 text-xs text-center">{msg}</p>}
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};