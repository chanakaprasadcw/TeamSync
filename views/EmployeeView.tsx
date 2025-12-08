import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Layout } from '../components/Layout';
import { MapPin, Clock, Trophy, CheckCircle2, AlertCircle } from 'lucide-react';

export const EmployeeView: React.FC = () => {
  const { currentUser, tasks, clockIn, clockOut, completeTask, currentLog } = useStore();
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter tasks for this user or 'ALL'
  const myTasks = tasks.filter(t => t.assignedTo === currentUser?.id || t.assignedTo === 'ALL');
  const pendingTasks = myTasks.filter(t => t.status === 'PENDING').sort((a, b) => b.createdAt - a.createdAt);
  const completedTasks = myTasks.filter(t => t.status === 'COMPLETED');

  const handleClockAction = () => {
    setLoadingLoc(true);
    setErrorMsg('');
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      setLoadingLoc(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
        if (currentLog && !currentLog.clockOut) {
          clockOut(loc);
        } else {
          clockIn(loc);
        }
        setLoadingLoc(false);
      },
      (err) => {
        setErrorMsg("Unable to retrieve location. Please allow access.");
        setLoadingLoc(false);
      }
    );
  };

  const isClockedIn = currentLog && !currentLog.clockOut;

  return (
    <Layout title="My Dashboard">
      {/* Status Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-slate-500 text-sm">Total Points</p>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              {currentUser?.points} <Trophy className="text-yellow-500" size={24} fill="currentColor" />
            </h2>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${isClockedIn ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
            {isClockedIn ? 'Active' : 'Offline'}
          </div>
        </div>

        <button
          onClick={handleClockAction}
          disabled={loadingLoc}
          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${
            isClockedIn 
              ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-200' 
              : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-200'
          }`}
        >
          {loadingLoc ? (
            <span className="animate-pulse">Locating...</span>
          ) : (
            <>
              {isClockedIn ? <LogOutIcon /> : <Clock />}
              {isClockedIn ? 'Clock Out' : 'Clock In'}
            </>
          )}
        </button>
        
        {errorMsg && <p className="text-red-500 text-xs mt-2 text-center">{errorMsg}</p>}

        {currentLog && (
            <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
                <span>In: {new Date(currentLog.clockIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                {currentLog.locationIn && (
                    <span className="flex items-center gap-1"><MapPin size={10} /> {currentLog.locationIn.lat.toFixed(4)}, {currentLog.locationIn.lng.toFixed(4)}</span>
                )}
            </div>
        )}
      </div>

      {/* Tasks Section */}
      <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
        Today's Tasks <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{pendingTasks.length}</span>
      </h3>

      <div className="space-y-3">
        {pendingTasks.length === 0 && (
            <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
                <CheckCircle2 size={40} className="mx-auto mb-2 opacity-20" />
                <p>All caught up! Great job.</p>
            </div>
        )}

        {pendingTasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <Trophy size={60} />
            </div>
            <div className="flex justify-between items-start relative z-10">
              <div className="flex-1">
                <h4 className="font-bold text-slate-800">{task.title}</h4>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{task.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md flex items-center gap-1">
                    +{task.points} pts
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Assigned: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => completeTask(task.id)}
                className="bg-slate-900 text-white p-2 rounded-lg hover:bg-emerald-600 transition-colors shadow-md"
              >
                <CheckCircle2 size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recently Completed */}
      {completedTasks.length > 0 && (
          <>
            <h3 className="font-bold text-slate-800 text-md mt-8 mb-4 opacity-70">Completed Recently</h3>
            <div className="space-y-2 opacity-60">
                {completedTasks.slice(0, 3).map(task => (
                    <div key={task.id} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center">
                        <span className="text-sm line-through text-slate-500">{task.title}</span>
                        <span className="text-xs font-bold text-emerald-600">+{task.points}</span>
                    </div>
                ))}
            </div>
          </>
      )}
    </Layout>
  );
};

const LogOutIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
);