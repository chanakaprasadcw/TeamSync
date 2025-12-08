import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../services/store';
import { UserRole } from '../types';
import { LogOut, Menu, User as UserIcon, CheckCircle, MapPin, Users, X, KeyRound, Camera, Edit2, Save, Loader2, AlertTriangle } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => {
  const { currentUser, logout, changePassword, updateUserProfile } = useStore();
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');
  
  // Profile Edit State
  const [editName, setEditName] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password Edit State
  const [newPassword, setNewPassword] = useState('');
  const [passMsg, setPassMsg] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showProfile && currentUser) {
      setEditName(currentUser.name);
      setPreviewUrl(currentUser.avatar);
      setNewPassword('');
      setProfileMsg('');
      setPassMsg('');
      setErrorMsg('');
      setEditFile(null);
      setActiveTab('profile');
    }
  }, [showProfile, currentUser]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEditFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    setIsSaving(true);
    setProfileMsg('');
    setErrorMsg('');

    try {
      await updateUserProfile(editName, editFile || undefined);
      setProfileMsg("Profile updated successfully!");
      // Reset file input
      setEditFile(null);
      setTimeout(() => setProfileMsg(''), 3000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to update profile.");
      // Revert preview if failed
      if (currentUser) {
        setPreviewUrl(currentUser.avatar);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if(newPassword) {
        changePassword(newPassword);
        setPassMsg("Password updated successfully!");
        setNewPassword('');
        setTimeout(() => setPassMsg(''), 3000);
    }
  };

  const getRoleIcon = () => {
    switch (currentUser?.role) {
        case UserRole.ADMIN: return <Users size={20}/>;
        case UserRole.MANAGER:
        case UserRole.ASSISTANT_MANAGER:
        case UserRole.TEAM_LEAD:
            return <CheckCircle size={20}/>;
        default: return <MapPin size={20}/>;
    }
  };

  const getRoleColor = () => {
    switch (currentUser?.role) {
        case UserRole.ADMIN: return 'bg-purple-100 text-purple-600';
        case UserRole.MANAGER:
        case UserRole.ASSISTANT_MANAGER:
            return 'bg-blue-100 text-blue-600';
        case UserRole.TEAM_LEAD:
            return 'bg-indigo-100 text-indigo-600';
        default: return 'bg-emerald-100 text-emerald-600';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative">
      {/* Header */}
      <header className="bg-white px-4 py-4 flex items-center justify-between border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
           <div className={`p-2 rounded-lg ${getRoleColor()}`}>
             {getRoleIcon()}
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
      <div className="absolute bottom-0 w-full bg-white border-t border-slate-200 py-3 flex justify-around items-center text-slate-400 z-40">
        <button onClick={() => setShowProfile(false)} className={`flex flex-col items-center gap-1 ${!showProfile ? 'text-slate-800' : ''}`}>
          <Menu size={20} />
          <span className="text-[10px] font-semibold">Home</span>
        </button>
        <button 
            onClick={() => setShowProfile(true)}
            className={`flex flex-col items-center gap-1 transition-colors ${showProfile ? 'text-blue-600' : 'hover:text-blue-600'}`}
        >
          <UserIcon size={20} />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>

      {/* Profile Page Overlay */}
      {showProfile && (
        <div className="absolute inset-0 z-50 bg-slate-50 flex flex-col animate-in slide-in-from-bottom duration-300">
           {/* Profile Header */}
           <div className="bg-white px-6 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm sticky top-0">
             <h2 className="text-lg font-bold text-slate-800">My Profile</h2>
             <button onClick={() => setShowProfile(false)} className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200">
               <X size={20} />
             </button>
           </div>

           <div className="p-6 overflow-y-auto pb-24">
             {/* Avatar Section */}
             <div className="flex flex-col items-center mb-8">
               <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                 <img 
                   src={previewUrl || currentUser?.avatar} 
                   alt="Profile" 
                   className="w-24 h-24 rounded-full bg-slate-200 object-cover border-4 border-white shadow-lg" 
                 />
                 <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <Camera className="text-white" size={24} />
                 </div>
                 <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                   <Edit2 size={12} />
                 </div>
               </div>
               <input 
                 type="file" 
                 ref={fileInputRef} 
                 onChange={handleFileChange} 
                 accept="image/*" 
                 className="hidden" 
               />
               <div className="text-center mt-3">
                 <h3 className="font-bold text-lg text-slate-800">{currentUser?.name}</h3>
                 <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mt-1">{currentUser?.role.replace('_', ' ')}</p>
                 <p className="text-xs text-slate-400">{currentUser?.email}</p>
               </div>
             </div>

             {/* Tabs */}
             <div className="flex p-1 bg-slate-200 rounded-xl mb-6">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'profile' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Edit Details
                </button>
                <button 
                  onClick={() => setActiveTab('password')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'password' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Security
                </button>
             </div>

             {/* Tab Content */}
             {activeTab === 'profile' ? (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-black"
                      placeholder="Your Full Name"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5"/>
                        <span>{errorMsg}</span>
                    </div>
                  )}

                  {profileMsg && (
                     <div className="text-center text-xs font-medium p-3 rounded-xl bg-green-50 text-green-600">
                       {profileMsg}
                     </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={isSaving || !editName.trim()}
                    className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </form>
             ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                   <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3.5 text-slate-400" size={16} />
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-black"
                        placeholder="••••••••"
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2 ml-1">
                      Must be at least 6 characters long. You will be asked to log in again if you change this.
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!newPassword || newPassword.length < 6}
                    className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Password
                  </button>
                  
                  {passMsg && (
                     <div className="text-center text-xs font-medium p-2 rounded-lg bg-green-50 text-green-600">
                       {passMsg}
                     </div>
                  )}
                </form>
             )}

             <div className="mt-8 pt-6 border-t border-slate-200">
               <button onClick={logout} className="w-full py-3 text-red-500 text-sm font-bold bg-red-50 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2">
                 <LogOut size={16} /> Log Out
               </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};