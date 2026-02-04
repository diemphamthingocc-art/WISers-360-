
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { ALL_STUDENTS } from '../constants';
import { Student } from '../types';

interface TeacherPortalProps {
  onSelectStudent: (student: Student) => void;
}

const TeacherPortal: React.FC<TeacherPortalProps> = ({ onSelectStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('All');

  const CLASSES = ['All', '6AB1', '6AB2', '6AB3', '6AB4', '6AD', '6MT'];

  const filteredStudents = ALL_STUDENTS.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         s.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = filterClass === 'All' || s.class === filterClass;
    return matchesSearch && matchesClass;
  });

  // Get status based on portfolio and archives for visual indicator
  const getStudentStatus = (studentId: string) => {
    const archives = JSON.parse(localStorage.getItem(`archives_${studentId}`) || '[]');
    const portfolio = JSON.parse(localStorage.getItem(`portfolio_items_${studentId}`) || '{"achievements":[], "activities":[]}');
    
    const hasPlan = archives.some((a: any) => a.type === 'PLAN');
    const hasReview = archives.some((a: any) => a.type === 'REVIEW');
    const portfolioCount = (portfolio.achievements?.length || 0) + (portfolio.activities?.length || 0);

    if (!hasPlan) return { label: 'Chưa lập mục tiêu', color: 'text-red-400', bg: 'bg-red-400/10', icon: 'fa-clock' };
    if (!hasReview) return { label: 'Đợi Review', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: 'fa-exclamation-circle' };
    return { label: `Portfolio: ${portfolioCount}`, color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: 'fa-check-circle' };
  };

  return (
    <div className="space-y-8 pb-32 animate-fade-in">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none">
            Teacher <span className="text-yellow-400">Dashboard</span>
          </h2>
          <p className="opacity-60 text-xs mt-2 font-black uppercase tracking-[0.2em]">Quản trị Lớp học & Giáo viên chủ nhiệm Insight 360</p>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
           <div className="px-6 py-3 bg-yellow-400 text-navy rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
             <i className="fas fa-users mr-2"></i> Danh sách lớp {filterClass !== 'All' ? filterClass : ''}
           </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 glass p-4 rounded-3xl border border-white/10">
        <div className="relative flex-1 w-full">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xs"></i>
          <input 
            type="text" 
            placeholder="Tìm tên hoặc mã số học sinh..."
            className="w-full bg-white/5 border border-white/10 pl-10 pr-4 py-3 rounded-2xl text-xs outline-none focus:border-yellow-400 transition-all"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <span className="text-[10px] font-black uppercase opacity-40 whitespace-nowrap mr-2">Lớp:</span>
          {CLASSES.map(c => (
            <button 
              key={c}
              onClick={() => setFilterClass(c)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all whitespace-nowrap border ${filterClass === c ? 'bg-white/20 border-white/40 text-white' : 'border-white/5 text-white/40 hover:border-white/20'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredStudents.length > 0 ? filteredStudents.map((s) => {
          const status = getStudentStatus(s.id);
          return (
            <GlassCard 
              key={s.id} 
              className="group relative overflow-hidden transition-all duration-500 hover:-translate-y-2 border-white/10 hover:border-yellow-400/50 flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="relative">
                  <img src={s.avatar} className="w-16 h-16 rounded-2xl border-2 border-white/10 object-cover shadow-xl group-hover:border-yellow-400 transition-all" alt={s.fullName} />
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-navy border-2 border-white/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-user-graduate text-[8px] text-yellow-400"></i>
                  </div>
                </div>
                <div className={`${status.bg} ${status.color} px-2 py-1 rounded-lg text-[7px] font-black uppercase border border-white/10 flex items-center`}>
                  <i className={`fas ${status.icon} mr-1`}></i>
                  {status.label}
                </div>
              </div>

              <div className="flex-1">
                <h4 className="font-black text-base leading-tight uppercase italic group-hover:text-yellow-400 transition-colors mb-1">{s.fullName}</h4>
                <p className="text-[9px] opacity-40 uppercase tracking-[0.2em] mb-4">Mã số: {s.studentId} • Lớp {s.class}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                    <p className="text-[7px] opacity-40 uppercase mb-0.5">IQ/EQ Avg</p>
                    <p className="text-xs font-black text-yellow-400">{Math.round((s.scores.iq + s.scores.eq)/2)}</p>
                  </div>
                  <div className="bg-white/5 p-2 rounded-xl border border-white/5 text-center">
                    <p className="text-[7px] opacity-40 uppercase mb-0.5">Social/AQ</p>
                    <p className="text-xs font-black text-blue-400">{Math.round((s.scores.social + s.scores.aq)/2)}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onSelectStudent(s)}
                className="w-full py-4 bg-yellow-400 text-navy rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Xem chi tiết hồ sơ
              </button>
            </GlassCard>
          );
        }) : (
          <div className="col-span-full py-32 text-center opacity-20">
            <i className="fas fa-user-slash text-5xl mb-4"></i>
            <p className="font-black uppercase italic tracking-widest">Không tìm thấy học sinh phù hợp</p>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default TeacherPortal;
