import React, { useState, useEffect } from 'react';
import { Trophy, Star, ArrowLeft, ShieldBan, UserCircle2, Search, Calendar, ChevronDown, Check, Delete, Plus, X, ChevronRight, Settings, Minus } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'leaderboard' | 'submit' | 'admin' | 'my-stats';

type Employee = { id: string, name: string, totalReviews: number, currentWeekCount?: number, currentMonthCount?: number, previousWeekCount?: number, nextPayout?: number, todayCount?: number };
type Review = { id: string, employeeId: string, employeeName: string, customerName: string, rating: number, comment: string, status: string, createdAt: string };

const TABS: {id: Tab, label: string}[] = [
  { id: 'leaderboard', label: 'Google Reviews' },
  { id: 'submit', label: 'Transfer' },
  { id: 'my-stats', label: 'Income' },
  { id: 'admin', label: 'Admin' }
];

function PinAuthModal({ onSuccess, onCancel }: { onSuccess: () => void, onCancel: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleNumPad = (key: string | number) => {
    if (error) setError(false);
    if (key === 'X') {
       setPin(pin.slice(0, -1));
    } else if (key === '.' || String(key) === '.') {
      // Do nothing
    } else if (pin.length < 4) {
       const newPin = pin + key;
       setPin(newPin);
       
       if (newPin.length === 4) {
          if (newPin === '1247') {
             // Success
             localStorage.setItem('admin_auth_expiry', (Date.now() + 30 * 60 * 1000).toString());
             onSuccess();
          } else {
             // Failure
             setError(true);
             setTimeout(() => {
               setPin('');
               setError(false);
             }, 600);
          }
       }
    }
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.98 }} 
        className="bg-white rounded-[28px] w-full max-w-[260px] relative flex flex-col p-6 shadow-xl border border-gray-100/50"
      >
        <button 
          onClick={onCancel} 
          className="absolute right-3 top-3 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 z-10"
          aria-label="Close"
        >
          <X size={18} strokeWidth={2.5} />
        </button>

        <div className="flex flex-col items-center">
          <div className="text-[#F57830] mb-2 opacity-90">
             <ShieldBan size={20} strokeWidth={2.5} />
          </div>
          
          <h2 className="text-[14px] font-bold text-gray-900 mb-6 tracking-tight">Security Code</h2>

          <motion.div 
            animate={error ? { x: [-4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex gap-3 justify-center items-center mb-8"
          >
            {[0, 1, 2, 3].map(i => (
              <div 
                key={i} 
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300", 
                  pin.length > i 
                    ? (error ? "bg-red-500 scale-110" : "bg-[#F57830] scale-110") 
                    : "bg-gray-100 border border-gray-200/50"
                )}
              />
            ))}
          </motion.div>

          <div className="w-full grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, 'X'].map((key, idx) => {
              if (key === '') return <div key={idx} />;
              return (
                <button 
                  key={idx}
                  onClick={() => handleNumPad(key)}
                  className={cn(
                    "h-10 flex items-center justify-center font-bold text-lg rounded-xl transition-all active:scale-90",
                    key === 'X' 
                      ? "text-gray-300 hover:text-gray-500" 
                      : "text-gray-700 hover:bg-gray-50/80 active:bg-gray-100/50"
                  )}
                >
                  {key === 'X' ? <Delete size={18} strokeWidth={2.5} /> : key}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function QuickReviewModal({ onClose }: { onClose: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({ customerName: '', employeeId: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/employees/stats').then(r => r.json()).then(setEmployees).catch(() => {});
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use the backend mock if possible
    fetch('/api/reviews', { 
      method: 'POST', 
      body: JSON.stringify({...formData, rating: 5, comment: 'Quick assigned review from admin modal', status: 'pending'}) 
    }).finally(() => {
      setSubmitted(true);
      setTimeout(onClose, 2000);
    });
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-[28px] shadow-2xl p-6 w-full max-w-sm relative">
        <button onClick={onClose} className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
          <X size={18} />
        </button>
        
        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <div className="w-[64px] h-[64px] bg-green-50 text-green-500 rounded-[20px] flex items-center justify-center mb-4 shadow-sm">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-[18px] font-semibold text-gray-900 mb-1">Review Assigned</h3>
            <p className="text-[14px] text-gray-500 font-medium">Successfully recorded.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col">
            <h3 className="text-[18px] font-semibold text-gray-900 mb-1">Assign Review</h3>
            <p className="text-[14px] text-gray-500 font-medium mb-6">Quick record for an upcoming review.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[13px] font-semibold text-gray-900 ml-1 mb-1.5 block">Customer Name</label>
                <input required type="text" placeholder="John Doe" value={formData.customerName} onChange={e=>setFormData({...formData, customerName: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-[16px] px-4 py-3.5 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 ring-orange-100 transition-shadow" />
              </div>

              <div>
                <label className="text-[13px] font-semibold text-gray-900 ml-1 mb-1.5 block">Assign To Staff</label>
                <div className="relative">
                  <select required value={formData.employeeId} onChange={e=>setFormData({...formData, employeeId: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-[16px] px-4 py-3.5 text-[15px] font-medium text-gray-900 appearance-none outline-none focus:ring-2 ring-orange-100 transition-shadow">
                    <option value="" disabled>Select a staff member</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                </div>
              </div>
            </div>

            <button type="submit" className="w-full bg-[#F57830] text-white py-3.5 rounded-[18px] font-medium text-[15px] shadow-[0_4px_12px_rgba(245,120,48,0.25)] active:scale-[0.98] transition-transform">
              Assign Review
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}

function ManageStaffModal({ onClose }: { onClose: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [staffToRemove, setStaffToRemove] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetch('/api/employees/stats').then(r => r.json()).then(setEmployees).catch(() => {});
  }, []);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    const newEmp: Employee = { id: Date.now().toString(), name: newStaffName, totalReviews: 0 };
    setEmployees(prev => [...prev, newEmp]);
    setNewStaffName('');
  };

  const handleRemove = (id: string, name: string) => {
    setStaffToRemove({ id, name });
  };

  const confirmRemove = () => {
    if (!staffToRemove) return;
    setEmployees(prev => prev.filter(emp => emp.id !== staffToRemove.id));
    setStaffToRemove(null);
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-[28px] shadow-2xl p-6 w-full max-w-sm relative flex flex-col max-h-[85vh] overflow-hidden">
        
        <AnimatePresence>
          {staffToRemove && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="w-[64px] h-[64px] bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 shadow-sm border border-red-100">
                <ShieldBan className="w-8 h-8" />
              </div>
              <h3 className="text-[19px] font-semibold text-gray-900 mb-2">Remove Staff?</h3>
              <p className="text-[14px] text-gray-500 font-medium mb-8 leading-relaxed">
                Are you sure you want to remove <span className="font-bold text-gray-900">{staffToRemove.name}</span>? This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button onClick={() => setStaffToRemove(null)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-3.5 rounded-[16px] font-medium text-[15px] hover:bg-gray-50 transition-colors shadow-sm">
                  Cancel
                </button>
                <button onClick={confirmRemove} className="flex-1 bg-red-500 text-white py-3.5 rounded-[16px] font-medium text-[15px] hover:bg-red-600 transition-colors shadow-[0_4px_12px_rgba(239,68,68,0.25)] active:scale-[0.98]">
                  Remove
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button onClick={onClose} className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-500 hover:bg-gray-100 transition-colors z-10">
          <X size={18} />
        </button>
        
        <h3 className="text-[18px] font-semibold text-gray-900 mb-1 pr-8">Manage Staff</h3>
        <p className="text-[14px] text-gray-500 font-medium mb-4">Add or remove staff. Changes are saved automatically.</p>
        
        <div className="flex-1 overflow-y-auto no-scrollbar border-t border-b border-gray-100 py-3 -mx-2 px-2 shadow-inner bg-gray-50/30">
           <div className="space-y-2">
             {employees.length === 0 && <div className="text-gray-400 text-sm py-4 text-center">No staff found.</div>}
             {employees.map(e => (
               <div key={e.id} className="flex flex-row items-center justify-between py-2.5 px-3 bg-white rounded-xl border border-gray-100 shadow-sm">
                 <span className="font-medium text-gray-800 text-[15px] truncate mr-2">{e.name}</span>
                 <button onClick={() => handleRemove(e.id, e.name)} className="w-8 h-8 flex-shrink-0 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors active:scale-95 border border-red-100/50">
                    <Minus size={18} strokeWidth={2.5} />
                 </button>
               </div>
             ))}
           </div>
        </div>

        <form onSubmit={handleAdd} className="mt-4 pt-1">
           <label className="text-[13px] font-semibold text-gray-900 ml-1 mb-1.5 block">Add New Staff Member</label>
           <div className="flex items-center gap-2">
             <input 
               required 
               type="text" 
               placeholder="Enter staff name..." 
               value={newStaffName} 
               onChange={e => setNewStaffName(e.target.value)} 
               className="flex-1 bg-gray-50 border border-gray-100 rounded-[16px] px-4 py-3.5 text-[15px] font-medium text-gray-900 placeholder:text-gray-400 outline-none focus:ring-2 ring-orange-100 transition-shadow" 
             />
             <button type="submit" className="w-[50px] h-[50px] bg-[#F57830] text-white rounded-[16px] flex items-center justify-center hover:bg-orange-500 active:scale-[0.96] transition-transform shadow-sm flex-shrink-0">
               <Plus size={22} strokeWidth={2.5} />
             </button>
           </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('leaderboard');
  const [adminPin, setAdminPin] = useState('');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showQuickReview, setShowQuickReview] = useState(false);
  const [showManageStaff, setShowManageStaff] = useState(false);
  const [pendingAction, setPendingAction] = useState<'quickReview' | 'manageStaff' | null>(null);

  const checkAuth = () => {
    const expiry = localStorage.getItem('admin_auth_expiry');
    if (expiry && parseInt(expiry, 10) > Date.now()) {
      return true;
    }
    return false;
  };

  const handleSecureAction = (action: 'quickReview' | 'manageStaff') => {
    setShowOptions(false);
    if (checkAuth()) {
      if (action === 'quickReview') setShowQuickReview(true);
      if (action === 'manageStaff') setShowManageStaff(true);
    } else {
      setPendingAction(action);
    }
  };

  const onAuthSuccess = () => {
    if (pendingAction === 'quickReview') setShowQuickReview(true);
    if (pendingAction === 'manageStaff') setShowManageStaff(true);
    setPendingAction(null);
  };
  
  return (
    <div className="h-[100dvh] w-full flex flex-col items-center bg-[#F1F3F6]">
      <div className="w-full max-w-[430px] mx-auto h-full flex flex-col relative shadow-[0_0_80px_rgba(0,0,0,0.08)] bg-[var(--color-app-bg)] overflow-hidden">
        
        {/* Main Content Body */}
        <main className="flex-1 overflow-y-auto no-scrollbar pb-12 w-full">
          <AnimatePresence mode="popLayout">
            {activeTab === 'leaderboard' && <LeaderboardView key="leaderboard" />}
            {activeTab === 'submit' && <SubmitReviewView key="submit" />}
            {activeTab === 'my-stats' && <MyStatsView key="mystats" />}
            {activeTab === 'admin' && (
              <AdminView 
                key="admin"
                pin={adminPin} 
                setPin={setAdminPin} 
                isAuthenticated={isAdminAuthenticated} 
                setAuthenticated={setIsAdminAuthenticated} 
              />
            )}
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {showQuickReview && <QuickReviewModal onClose={() => setShowQuickReview(false)} />}
          {showManageStaff && <ManageStaffModal onClose={() => setShowManageStaff(false)} />}
          {pendingAction && (
             <PinAuthModal 
               onSuccess={onAuthSuccess} 
               onCancel={() => setPendingAction(null)} 
             />
          )}
        </AnimatePresence>

        {/* Floating Action Menu & Button */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col items-end">
          <AnimatePresence>
            {showOptions && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="mb-4 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-100 flex flex-col w-56"
              >
                <button 
                  onClick={() => handleSecureAction('quickReview')} 
                  className="px-4 py-3.5 text-sm font-medium text-gray-700 text-left hover:bg-gray-50 flex items-center gap-3 active:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#F57830]">
                    <Plus size={16} strokeWidth={2.5} />
                  </div>
                  Add a new review
                </button>
                <div className="h-[1px] w-full bg-gray-100"></div>
                <button 
                  onClick={() => handleSecureAction('manageStaff')} 
                  className="px-4 py-3.5 text-sm font-medium text-gray-700 text-left hover:bg-gray-50 flex items-center gap-3 active:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-[#F57830]">
                    <Settings size={16} strokeWidth={2.5} />
                  </div>
                  Manage staff members
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileTap={{ scale: 0.85 }}
            animate={{ rotate: showOptions ? 45 : 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => setShowOptions(!showOptions)}
            className="w-14 h-14 bg-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.1)] flex items-center justify-center text-gray-500 hover:text-[#F57830] transition-colors border border-gray-100 hover:bg-gray-50 focus:outline-none"
          >
            <Plus size={30} strokeWidth={2} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function LeaderboardView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [timeframe, setTimeframe] = useState('This Week');
  const [selectedEmployeeForReviews, setSelectedEmployeeForReviews] = useState<Employee | null>(null);
  const [employeeReviews, setEmployeeReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const timeframes = ['This Week', 'Last Week', 'This Month'];

  useEffect(() => {
    fetch('/api/employees/stats').then(r => r.json()).then(setEmployees);
    fetch('/api/admin/reviews').then(r => r.json()).then(data => {
       const mapped = Array.isArray(data) ? data : [];
       const sorted = mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
       setAllRawReviews(sorted);
       setRecentReviews(sorted);
    }).catch(err => {
      fetch('/api/reviews/recent').then(r => r.json()).then(data => {
         const mapped = Array.isArray(data) ? data : [];
         const sorted = mapped.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
         setAllRawReviews(sorted);
         setRecentReviews(sorted);
      }).catch(() => {});
    });
  }, []);

  const [allRawReviews, setAllRawReviews] = useState<Review[]>([]);
  const [displayCount, setDisplayCount] = useState(5);

  const getScore = (e: Employee) => {
    if (timeframe === 'This Week') return e.currentWeekCount || 0;
    if (timeframe === 'Last Week') return e.previousWeekCount || 0;
    if (timeframe === 'This Month') return e.currentMonthCount || 0;
    return e.totalReviews;
  };

  const handleOpenReviews = (e: Employee) => {
    setSelectedEmployeeForReviews(e);
    setIsLoadingReviews(true);
    fetch(`/api/employees/${e.id}/reviews`)
      .then(r => r.json())
      .then((data: Review[]) => {
         const now = new Date();
         let filtered = data;
         if (timeframe === 'This Week') {
           const start = startOfWeek(now, { weekStartsOn: 0 });
           filtered = data.filter(r => new Date(r.createdAt) >= start);
         } else if (timeframe === 'Last Week') {
           const start = startOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
           const end = endOfWeek(subWeeks(now, 1), { weekStartsOn: 0 });
           filtered = data.filter(r => new Date(r.createdAt) >= start && new Date(r.createdAt) <= end);
         } else if (timeframe === 'This Month') {
           const start = startOfMonth(now);
           filtered = data.filter(r => new Date(r.createdAt) >= start);
         }
         
         // Sort descending by date
         filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
         
         setEmployeeReviews(filtered);
         setIsLoadingReviews(false);
      }).catch(() => setIsLoadingReviews(false));
  };

  const sortedEmployees = [...employees].sort((a, b) => getScore(b) - getScore(a));
  const timeframeHasData = sortedEmployees.some(e => getScore(e) > 0);
  const totalScore = Math.max(1, sortedEmployees.reduce((acc, curr) => acc + getScore(curr), 0));

  const STAFF_COLORS = [
    '#F57830', // Orange (Top 1)
    '#94A3B8', // Slate (Top 2)
    '#F87171', // Red (Top 3)
    '#374151', // Dark Gray (Top 4)
    '#6366F1', // Indigo
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EC4899', // Pink
  ];

  const getDynamicGradient = () => {
    if (!timeframeHasData) return 'bg-gray-100';
    
    let currentPos = 0;
    const segments = sortedEmployees.slice(0, 8).map((e, i) => {
      const score = getScore(e);
      if (score === 0) return null;
      const percentage = (score / totalScore) * 100;
      const start = currentPos;
      currentPos += percentage;
      return `${STAFF_COLORS[i % STAFF_COLORS.length]} ${start}% ${currentPos}%`;
    }).filter(Boolean);

    return `conic-gradient(${segments.join(', ')}${currentPos < 100 ? `, #F3F4F6 ${currentPos}% 100%` : ''})`;
  };

  const getDateRangeString = () => {
    const now = new Date();
    if (timeframe === 'This Week') {
      const start = startOfWeek(now, { weekStartsOn: 0 });
      const end = endOfWeek(now, { weekStartsOn: 0 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }
    if (timeframe === 'Last Week') {
      const lastWeek = subWeeks(now, 1);
      const start = startOfWeek(lastWeek, { weekStartsOn: 0 });
      const end = endOfWeek(lastWeek, { weekStartsOn: 0 });
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }
    if (timeframe === 'This Month') {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }
    return '';
  };

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8 pt-8">
      
      {/* Animated Timeframe Tabs */}
      <div className="px-6">
        <div className="bg-[#F57830] p-[6px] rounded-[24px] flex relative max-w-full shadow-inner border border-[#F57830]">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className="relative flex-1 py-[10px] text-[14px] font-medium rounded-[18px] transition-colors duration-300 z-10 outline-none"
            >
              {timeframe === tf && (
                <motion.div
                  layoutId="segmentedBubble"
                  className="absolute inset-0 bg-white rounded-[18px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-white/60"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className={cn("relative z-20", timeframe === tf ? "text-black" : "text-white/80 hover:text-white")}>
                {tf}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* "Spending Summary" Style Header */}
      <div className="px-6">
        <div className="soft-card p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[17px] font-medium text-gray-900">Google Reviews</h2>
            <span className="text-[14px] text-gray-500 font-medium">{getDateRangeString()}</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-8">
             <div className="relative w-[130px] h-[130px] rounded-full flex items-center justify-center bg-gray-50 flex-shrink-0 mx-auto">
               <div 
                 className={cn("absolute inset-0 rounded-full", !timeframeHasData && "bg-gray-100")} 
                 style={{
                   background: timeframeHasData ? getDynamicGradient() : undefined,
                   clipPath: 'circle(50% at 50% 50%)'
                 }}
               ></div>
               <div className="absolute inset-[24px] bg-white rounded-full flex flex-col items-center justify-center shadow-sm px-2 overflow-hidden">
                  <div className="text-[24px] leading-none mb-1">
                    {timeframeHasData ? '🏆' : '⏳'}
                  </div>
                  <div className="text-[12px] text-gray-900 font-bold truncate w-full text-center">
                    {timeframeHasData ? sortedEmployees[0]?.name : 'No data'}
                  </div>
               </div>
             </div>
             
             <div className="space-y-2 w-full flex-1">
                {sortedEmployees.slice(0, 5).map((e, i) => {
                   const count = getScore(e) || 0;
                   return (
                   <button 
                     key={e.id} 
                     onClick={() => handleOpenReviews(e)}
                     className="w-full flex items-center justify-between text-[13px] hover:bg-gray-50/80 p-2 -mx-2 rounded-xl transition-all group active:scale-[0.98]"
                   >
                      <div className="flex items-center gap-2.5 overflow-hidden mr-2">
                        <div 
                          className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: STAFF_COLORS[i % STAFF_COLORS.length] }}
                        ></div>
                        <span className="text-gray-600 truncate font-medium group-hover:text-gray-900 transition-colors">{e.name}</span>
                      </div>
                      <div className="flex items-center gap-3 pl-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-[15px] leading-none">
                            {count}
                          </span>
                          <span className="text-[12px] text-green-500 font-bold flex items-center gap-0.5 bg-green-50/60 px-2 py-1 rounded-lg border border-green-100">
                            <Plus size={10} strokeWidth={4} />${count * 30}
                          </span>
                        </div>
                        <div className="w-5 h-5 flex items-center justify-center rounded-full bg-[#F57830] text-white flex-shrink-0 text-[11px] font-bold shadow-sm active:scale-95 transition-transform">
                           ?
                        </div>
                      </div>
                   </button>
                )})}
             </div>
          </div>
        </div>
      </div>

      <div className="px-6 flex justify-between items-center mb-4">
         <h3 className="text-[17px] font-bold text-gray-900">Recently Added</h3>
      </div>

      <div className="px-6 space-y-[14px]">
        {recentReviews.slice(0, displayCount).map((review) => {
          const initials = review.customerName.trim().split(/\s+/).map(n => n[0]).filter((_, i, arr) => i === 0 || i === arr.length - 1).join('').toUpperCase() || review.customerName.substring(0,2).toUpperCase();
          const colors = ['bg-blue-50 text-blue-600 border-blue-100', 'bg-purple-50 text-purple-600 border-purple-100', 'bg-green-50 text-green-600 border-green-100', 'bg-pink-50 text-pink-600 border-pink-100', 'bg-orange-50 text-orange-600 border-orange-100', 'bg-teal-50 text-teal-600 border-teal-100', 'bg-rose-50 text-rose-600 border-rose-100'];
          let hash = 0;
          for (let i = 0; i < review.customerName.length; i++) hash = review.customerName.charCodeAt(i) + ((hash << 5) - hash);
          const colorClass = colors[Math.abs(hash) % colors.length];

          return (
          <div key={review.id} className="flex items-center justify-between bg-white rounded-[24px] p-4 shadow-soft hover:shadow-md transition-shadow">
             <div className="flex items-center gap-4">
               <div className={cn("w-[48px] h-[48px] rounded-[16px] border flex items-center justify-center font-bold text-[16px] tracking-wide", colorClass)}>
                 {initials}
               </div>
               <div>
                 <div className="font-medium text-gray-900 text-[15px]">{review.customerName}</div>
                 <div className="text-[12px] text-gray-400 mt-[2px] flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 opacity-70"/> {format(new Date(review.createdAt), 'MMM d, h:mm a')}
                 </div>
               </div>
             </div>
             <div className="pr-2">
             </div>
          </div>
        )})}
        
        {recentReviews.length > displayCount && (
          <button 
            onClick={() => setDisplayCount(prev => prev + 5)}
            className="w-full py-4 text-[14px] font-bold text-gray-400 hover:text-[#F57831] transition-colors active:scale-95"
          >
            See more
          </button>
        )}
        
        {recentReviews.length === 0 && <div className="text-center text-gray-400 text-sm font-medium py-4">No recent reviews</div>}
      </div>
      
      <AnimatePresence>
        {selectedEmployeeForReviews && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm"
              onClick={() => setSelectedEmployeeForReviews(null)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.95 }} 
              animate={{ opacity: 1, y: 0, scale: 1 }} 
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl z-50 overflow-hidden shadow-2xl max-h-[85vh] flex flex-col"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                 <div>
                    <h3 className="font-semibold text-gray-900 leading-tight">{selectedEmployeeForReviews.name}'s Reviews</h3>
                    <p className="text-[13px] text-[--color-app-orange] font-medium mt-0.5">{timeframe}</p>
                 </div>
                 <button onClick={() => setSelectedEmployeeForReviews(null)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[--color-app-orange] hover:bg-gray-50 transition-colors shadow-sm">
                    <X size={16} strokeWidth={2.5} />
                 </button>
              </div>
              
              <div className="p-2 overflow-y-auto no-scrollbar flex-1 bg-white">
                 {isLoadingReviews ? (
                    <div className="flex justify-center items-center py-12">
                       <div className="w-8 h-8 border-3 border-[--color-app-orange] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                 ) : employeeReviews.length === 0 ? (
                    <div className="text-center py-12 px-4">
                       <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                          <Search className="text-gray-400" size={24} />
                       </div>
                       <h4 className="text-[15px] font-medium text-gray-900 mb-1">No reviews yet</h4>
                       <p className="text-gray-500 text-[14px]">There are no reviews for this timeframe.</p>
                    </div>
                 ) : (
                    <div className="flex flex-col">
                       {employeeReviews.map((review, i) => {
                          const initials = review.customerName.trim().split(/\s+/).map(n => n[0]).filter((_, i, arr) => i === 0 || i === arr.length - 1).join('').toUpperCase() || review.customerName.substring(0,2).toUpperCase();
                          const colors = ['bg-blue-50 text-blue-600 border-blue-100', 'bg-purple-50 text-purple-600 border-purple-100', 'bg-green-50 text-green-600 border-green-100', 'bg-pink-50 text-pink-600 border-pink-100', 'bg-orange-50 text-orange-600 border-orange-100', 'bg-teal-50 text-teal-600 border-teal-100', 'bg-rose-50 text-rose-600 border-rose-100'];
                          let hash = 0;
                          for (let i = 0; i < review.customerName.length; i++) hash = review.customerName.charCodeAt(i) + ((hash << 5) - hash);
                          const colorClass = colors[Math.abs(hash) % colors.length];
                          
                          return (
                             <div key={review.id} className={cn("flex items-center gap-4 p-4", i !== employeeReviews.length - 1 ? "border-b border-gray-50" : "")}>
                                <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-[14px] flex-shrink-0 tracking-wide", colorClass)}>
                                  {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center justify-between mb-0.5">
                                      <h4 className="font-medium text-[15px] text-gray-900">{review.customerName}</h4>
                                   </div>
                                   <div className="text-[12px] text-gray-400 flex items-center gap-1.5 font-medium">
                                      <Calendar size={12} className="opacity-70" />
                                      {format(new Date(review.createdAt), 'MMM d, yyyy')}
                                   </div>
                                </div>
                             </div>
                          );
                       })}
                    </div>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function SubmitReviewView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState({ customerName: '', employeeId: '', rating: 5, comment: '' });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch('/api/employees').then(r => r.json()).then(setEmployees);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center text-center py-24 px-6 h-full">
        <div className="w-[88px] h-[88px] bg-green-50 text-green-500 rounded-[30px] flex items-center justify-center mx-auto mb-8 shadow-sm">
          <Check className="w-10 h-10" />
        </div>
        <h2 className="text-[22px] font-semibold text-gray-900 mb-2">Record Added</h2>
        <p className="text-[15px] text-gray-500 mb-12 flex-1">Record has been created securely.</p>
        <button onClick={() => { setSubmitted(false); setFormData({ customerName: '', employeeId: '', rating: 5, comment: '' }); }} className="btn-orange w-full py-[18px] text-[16px] font-medium mt-auto">
          Add Another Note
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="px-6 flex flex-col h-full min-h-[600px] pb-4">
      <form onSubmit={handleSubmit} className="flex flex-col flex-1 h-full">
        
        {/* Profile Selector */}
        <div className="bg-white rounded-[24px] p-2 pr-[10px] flex items-center justify-between mb-8 shadow-soft">
           <div className="flex items-center gap-3 w-full pl-1">
              <div className="w-[46px] h-[46px] rounded-[16px] bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0">
                 <UserCircle2 className="w-[26px] h-[26px] text-gray-400" />
              </div>
              <div className="flex-1 overflow-hidden pr-2 flex flex-col justify-center">
                 <select required className="w-full text-[16px] font-medium text-gray-900 bg-transparent outline-none appearance-none" value={formData.employeeId} onChange={e=>setFormData({...formData, employeeId: e.target.value})}>
                    <option value="" disabled>Select Profile</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                 </select>
                 <div className="text-[12px] text-gray-400 font-medium tracking-tight mt-0.5">+1 - •••••••••• 67</div>
              </div>
           </div>
           <button type="button" className="bg-gray-50 border border-gray-100 text-[13px] font-medium px-5 py-2.5 rounded-[16px] text-gray-800 flex-shrink-0 active:bg-gray-100 hover:bg-gray-100/80 transition-colors">Change</button>
        </div>

        {/* Inputs */}
        <div className="bg-white rounded-[24px] p-1 flex items-center justify-between shadow-soft mb-8">
           <input required type="text" placeholder="Customer Name" value={formData.customerName} onChange={e=>setFormData({...formData, customerName: e.target.value})} className="bg-transparent outline-none text-[15px] w-full font-medium text-gray-900 placeholder:text-gray-400 p-[18px]" />
        </div>

        <h3 className="font-medium text-[17px] text-gray-900 mb-5 px-1">Payment info</h3>
        
        <div className="soft-card p-6 flex flex-col mb-6">
           <div className="text-[14px] text-gray-500 font-medium mb-4">Select Rating</div>
           <div className="flex gap-4 mb-6 border-b border-gray-100 pb-8 items-center bg-gray-50/50 p-4 rounded-2xl justify-center">
             {[1, 2, 3, 4, 5].map(star => (
               <button type="button" key={star} onClick={() => setFormData({ ...formData, rating: star })} className="active:scale-90 transition-transform">
                 <Star className={cn("w-8 h-8 transition-colors", formData.rating >= star ? "fill-[--color-app-orange] text-[--color-app-orange]" : "text-gray-200 fill-gray-100")} />
               </button>
             ))}
           </div>
           <textarea required rows={3} placeholder="Write your comment here..." value={formData.comment} onChange={e=>setFormData({...formData, comment: e.target.value})} className="bg-transparent outline-none text-[15px] w-full resize-none text-gray-900 placeholder:text-gray-400 pt-1" />
        </div>

        <button type="submit" className="btn-orange w-full py-[18px] text-[16px] font-medium mt-auto mb-2">
          Confirm Payment
        </button>
      </form>
    </motion.div>
  );
}

function MyStatsView() {
  const [employeesStats, setEmployeesStats] = useState<Employee[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    fetch('/api/employees/stats').then(r => r.json()).then(data => {
      setEmployeesStats(data);
      if (data.length > 0 && !selectedId) {
        setSelectedId(data[0].id);
      }
    });
  }, []);

  const employee = employeesStats.find(e => e.id === selectedId);

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="px-6 flex flex-col h-full space-y-6">
      
      <div className="flex justify-between items-center bg-white p-2 pl-5 rounded-[22px] shadow-soft mb-2">
        <span className="font-medium text-gray-900 text-[15px]">Select User</span>
        <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-[16px] text-[14px] text-gray-900 font-medium outline-none">
           <option value="" disabled>Select Staff</option>
           {employeesStats.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div className="flex justify-center my-3 relative">
         <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200/80 -z-10 translate-y-[-50%]"></div>
         <div className="w-[42px] h-[42px] bg-[#F57831] text-white rounded-[14px] shadow-[0_6px_20px_rgba(245,120,49,0.35)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
               <path d="M12 20V4M12 4L6 10M12 4L18 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M12 4V20M12 20L6 14M12 20L18 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/>
            </svg>
         </div>
      </div>

      {employee ? (
        <div className="soft-card p-6 flex flex-col relative overflow-hidden">
           
           <div className="mb-4 space-y-2">
             <div className="text-[14px] text-gray-500 font-medium mb-1 tracking-wide uppercase">Total Reviews</div>
             <div className="flex items-center gap-2 justify-between">
                <div className="text-[32px] font-bold text-gray-900 tracking-tight leading-none">{employee.totalReviews}</div>
             </div>
           </div>

           <div className="space-y-[18px] pt-6 border-t border-gray-100/80 mt-4">
             <div className="flex justify-between items-center text-[15px]">
               <span className="text-gray-500 font-medium">Reviews Today</span>
               <span className="text-gray-900 font-medium">{employee.todayCount}</span>
             </div>

             <div className="flex justify-between items-center pt-2">
               <span className="text-[13px] text-gray-400 font-medium">{format(new Date(), 'MMM d, h:mm a')} UTC</span>
             </div>
           </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 font-medium py-10">Loading details...</div>
      )}

      <div className="mt-auto pt-8 relative">
        <button className="btn-orange w-full py-[18px] text-[16px] font-medium">
           View Details
        </button>
      </div>
    </motion.div>
  );
}

function AdminView({ pin, setPin, isAuthenticated, setAuthenticated }: any) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [error, setError] = useState('');

  const fetchReviews = async () => {
    const res = await fetch('/api/admin/reviews', { headers: { 'x-admin-pin': pin } });
    if (res.ok) {
      setReviews(await res.json());
      setAuthenticated(true);
      setError('');
    } else {
      setError('Invalid code');
      setPin(''); // Reset on failure
    }
  };

  useEffect(() => {
    if (pin.length === 4 && !isAuthenticated) {
      fetchReviews();
    }
  }, [pin]);

  const handleNumPad = (key: string | number) => {
    if (key === 'X') {
       setPin(pin.slice(0, -1));
       setError('');
    } else if (pin.length < 4) {
       setPin(pin + key);
       setError('');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-pin': pin },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      fetchReviews();
    }
  };

  if (!isAuthenticated) {
    return (
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="px-6 flex flex-col h-full min-h-[550px] pb-6">
        
        <div className="bg-white rounded-[32px] p-8 pb-10 shadow-soft text-center flex flex-col items-center mx-auto w-full mb-10">
           <h2 className="text-[17px] font-medium text-gray-900 mb-8 w-full flex justify-between px-2 items-center">
             <span className="text-gray-400 text-[15px]">Auth Code</span>
             <ShieldBan className="w-5 h-5 text-gray-400" />
           </h2>
           
           <div className="flex gap-5 justify-center items-center w-full min-h-[40px]">
             {[0, 1, 2, 3].map(i => (
                <div key={i} className={cn("w-[20px] h-[20px] rounded-full transition-all border-2", 
                   pin.length > i ? "bg-gray-900 border-gray-900 text-gray-900 scale-110" : "bg-transparent border-gray-200"
                )}></div>
             ))}
           </div>
           
           <div className="h-4 mt-6">
             {error && <span className="text-[13px] text-red-500 font-medium">{error}</span>}
           </div>
        </div>

        <div className="mt-auto px-2 mx-auto w-full mb-4">
           <div className="grid grid-cols-3 gap-y-4 gap-x-5">
             {[1,2,3,4,5,6,7,8,9,'.',0,'X'].map((key, idx) => (
               <button 
                 key={idx}
                 onClick={() => handleNumPad(key)}
                 className="bg-white rounded-[24px] h-[72px] flex items-center justify-center font-medium text-[24px] text-gray-900 shadow-[0_2px_10px_rgba(0,0,0,0.03)] active:scale-[0.97] transition-transform active:bg-gray-50 border border-white"
               >
                 {key === 'X' ? <Delete className="w-[26px] h-[26px] text-gray-900"/> : key === '.' ? <div className="w-[6px] h-[6px] bg-gray-900 rounded-full"></div> : key}
               </button>
             ))}
           </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="px-6 space-y-6">
       <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-[17px] font-medium text-gray-900 pl-1">Review Queue</h2>
        <button onClick={() => { setAuthenticated(false); setPin(''); }} className="bg-white shadow-soft text-gray-700 px-5 py-2 rounded-[16px] text-[13px] font-medium active:bg-gray-50 border border-gray-50">Lock</button>
      </div>

      <div className="space-y-[16px]">
        {reviews.map(review => (
          <div key={review.id} className="bg-white rounded-[28px] p-5 shadow-soft">
            <div className="flex justify-between items-center mb-4">
               <div>
                  <div className="font-medium text-gray-900 text-[16px]">{review.customerName}</div>
                  <div className="text-[12px] text-gray-400 mt-[2px] font-medium">{format(new Date(review.createdAt), 'MMM d, hh:mm a')}</div>
               </div>
               <div className="text-right">
                  <div className="text-[14px] font-medium text-gray-900">{review.employeeName}</div>
                  <div className={cn("font-semibold text-[13px] mt-[2px] capitalize",
                     review.status === 'pending' ? "text-[--color-app-orange]" : 
                     review.status === 'approved' ? "text-green-500" : "text-red-400"
                  )}>{review.status}</div>
               </div>
            </div>
            
            <div className="bg-gray-50/80 rounded-[20px] p-4 text-[14px] text-gray-700 mb-5 relative border border-gray-50">
              <span className="relative z-10">{review.comment}</span>
            </div>
            
            {review.status === 'pending' && (
              <div className="flex gap-3">
                 <button onClick={() => updateStatus(review.id, 'approved')} className="flex-1 btn-orange py-4 text-[14px] font-medium shadow-sm transition-all focus:ring-2 ring-orange-200">
                    Confirm 
                 </button>
                 <button onClick={() => updateStatus(review.id, 'rejected')} className="flex-1 bg-white border border-gray-100 text-gray-700 rounded-[20px] py-4 text-[14px] font-medium active:bg-gray-50 shadow-[0_4px_10px_rgba(0,0,0,0.02)]">
                    Cancel
                 </button>
              </div>
            )}
          </div>
        ))}
        {reviews.length === 0 && <div className="text-center text-gray-400 text-[15px] italic font-medium p-8">Queue is empty.</div>}
      </div>
    </motion.div>
  );
}
