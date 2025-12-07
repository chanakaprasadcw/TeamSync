import React, { useState } from 'react';
import { useStore } from '../services/store';
import { UserRole } from '../types';
import { LayoutDashboard, ShieldCheck, Building2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, registerOrganization } = useStore();
  
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register State
  const [orgName, setOrgName] = useState('');
  const [adminName, setAdminName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'LOGIN') {
        const success = await login(email, password);
        if (!success) setError("Invalid email or password.");
    } else {
        if (!orgName || !adminName || !email || !password) {
            setError("All fields are required.");
            setLoading(false);
            return;
        }
        registerOrganization(orgName, adminName, email, password);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center justify-center gap-2">
                <LayoutDashboard className="text-blue-600" />
                TeamSync
            </h1>
            <p className="text-slate-500 mt-2">Workforce Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
            <div className="flex border-b border-slate-100 mb-6">
                <button
                    onClick={() => { setMode('LOGIN'); setError(''); }}
                    className={`flex-1 pb-3 text-sm font-semibold transition-colors ${mode === 'LOGIN' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
                >
                    Login
                </button>
                <button
                    onClick={() => { setMode('REGISTER'); setError(''); }}
                    className={`flex-1 pb-3 text-sm font-semibold transition-colors ${mode === 'REGISTER' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
                >
                    Register Org
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'REGISTER' && (
                    <>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Organization Name</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-3 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    placeholder="Acme Corp"
                                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-900 font-medium placeholder:text-slate-300"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Admin Name</label>
                            <input 
                                type="text" 
                                value={adminName}
                                onChange={(e) => setAdminName(e.target.value)}
                                placeholder="Your Name"
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-900 font-medium placeholder:text-slate-300"
                            />
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-900 font-medium placeholder:text-slate-300"
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm text-slate-900 font-medium placeholder:text-slate-300"
                    />
                </div>
                
                {error && <p className="text-red-500 text-xs text-center bg-red-50 p-2 rounded-lg">{error}</p>}

                <button 
                    type="submit"
                    disabled={loading}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-xl mt-4 hover:bg-slate-800 active:scale-95 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                >
                    {loading ? 'Processing...' : (mode === 'LOGIN' ? 'Sign In' : 'Create Organization')}
                </button>
            </form>
        </div>
        
        {mode === 'LOGIN' && (
             <p className="text-center text-xs text-slate-400 mt-6 max-w-xs mx-auto">
                Demo Credentials:<br/>
                admin@team.com / 123<br/>
                manager@team.com / 123<br/>
                john@team.com / 123
            </p>
        )}
      </div>
    </div>
  );
};