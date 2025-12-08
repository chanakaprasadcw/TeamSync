import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Layout } from '../components/Layout';
import { generateTaskDescription } from '../services/gemini';
import { UserRole, Task, ROLE_HIERARCHY } from '../types';
import { Plus, Sparkles, Users, Briefcase, X, Clock, MapPin, Trophy } from 'lucide-react';

export const ManagerView: React.FC = () => {
  const { users, currentUser, tasks, createTask, clockIn, clockOut, currentLog } = useStore();
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('ALL');
  const [points, setPoints] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);

  // Time Log State
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Logic: I can see anyone who is below me in the hierarchy
  // AND belongs to my organization
  const mySubordinates = users.filter(u => 
    currentUser && 
    ROLE_HIERARCHY[u.role] > ROLE_HIERARCHY[currentUser.role]
  );

  const myTasks = tasks.filter(t => t.assignedBy === currentUser?.id).sort((a,b) => b.createdAt - a.createdAt);

  const handleAI = async () => {
    if (!title) return;
    setIsGenerating(true);
    const desc = await generateTaskDescription(title, "Corporate Employee");
    setDescription(desc);
    setIsGenerating(false);
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    createTask({
      title,
      description,
      assignedTo,
      points
    });

    setShowModal(false);
    // Reset
    setTitle('');
    setDescription('');
    setAssignedTo('ALL');
    setPoints(50);
  };

  return (
    <Layout title="Team Management">
      
      {/* Time Tracking Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-slate-500 text-sm">Attendance</p>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              {isClockedIn ? 'On Duty' : 'Off Duty'}
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
              {isClockedIn ? <Clock className="rotate-180" /> : <Clock />}
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

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-500 text-white p-4 rounded-2xl shadow-blue-200 shadow-lg">
            <h3 className="text-3xl font-bold">{mySubordinates.length}</h3>
            <p className="text-blue-100 text-sm">Members Below</p>
        </div>
        <div className="bg-white text-slate-800 p-4 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-3xl font-bold">{myTasks.filter(t => t.status === 'COMPLETED').length}</h3>
            <p className="text-slate-400 text-sm">Tasks Done</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800">Active Tasks</h3>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white text-xs px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-slate-700 active:scale-95 transition-all"
        >
          <Plus size={14} /> Assign Task
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-3 pb-20">
        {myTasks.length === 0 && (
            <p className="text-sm text-slate-400 italic">No tasks assigned yet.</p>
        )}
        {myTasks.map(task => {
            const assignee = users.find(u => u.id === task.assignedTo);
            return (
                <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                    <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-slate-800">{task.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                            {task.status}
                        </span>
                    </div>
                    <div className="flex justify-between items-end mt-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <Users size={12} />
                            {task.assignedTo === 'ALL' ? 'Entire Sub-Team' : assignee?.name || 'Unknown'}
                        </div>
                        <div className="font-bold text-slate-700">
                            {task.points} pts
                        </div>
                    </div>
                </div>
            )
        })}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">Assign New Task</h2>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Task Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-900"
                  placeholder="e.g. Site Inspection"
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-slate-500">Description</label>
                    <button 
                        type="button" 
                        onClick={handleAI}
                        disabled={!title || isGenerating}
                        className="text-[10px] flex items-center gap-1 text-purple-600 font-bold hover:text-purple-800 disabled:opacity-50"
                    >
                        <Sparkles size={10} /> {isGenerating ? 'Generating...' : 'AI Write'}
                    </button>
                </div>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all h-24 resize-none text-slate-900"
                  placeholder="Describe the task..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Assign To</label>
                    <select 
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900"
                    >
                        <option value="ALL">All Subordinates</option>
                        {mySubordinates.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.role.replace('_',' ')})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Points</label>
                    <input 
                        type="number"
                        min="10"
                        max="1000"
                        step="10"
                        value={points}
                        onChange={(e) => setPoints(Number(e.target.value))}
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-900"
                    />
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
              >
                Assign Task
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};