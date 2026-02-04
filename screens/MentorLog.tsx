
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Student, HomeroomTeacherLog as LogType } from '../types';

interface MentorLogProps {
  student: Student;
  isTeacherView?: boolean;
}

const MOODS = ['😊', '🤩', '😐', '😔', '😤', '🤔'];

const MentorLog: React.FC<MentorLogProps> = ({ student, isTeacherView }) => {
  const [logs, setLogs] = useState<LogType[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newLog, setNewLog] = useState({
    mood: '😊',
    content: '',
    privateNote: '',
    tags: ''
  });

  useEffect(() => {
    const savedLogs = JSON.parse(localStorage.getItem(`mentor_logs_${student.id}`) || '[]');
    setLogs(savedLogs.sort((a: LogType, b: LogType) => {
      const timeB = new Date(b.dateISO || 0).getTime();
      const timeA = new Date(a.dateISO || 0).getTime();
      return timeB - timeA;
    }));
  }, [student.id]);

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLog.content.trim() && !isTeacherView) return;
    if (isTeacherView && !newLog.content.trim() && !newLog.privateNote.trim()) return;

    const now = new Date();
    const log: LogType = {
      id: `log-${Date.now()}`,
      studentId: student.id,
      date: now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      dateISO: now.toISOString(),
      mood: newLog.mood,
      content: newLog.content,
      privateNote: isTeacherView ? newLog.privateNote : undefined,
      tags: newLog.tags.split(',').map(t => t.trim().startsWith('#') ? t.trim() : `#${t.trim()}`).filter(t => t !== '#'),
      authorRole: isTeacherView ? 'TEACHER' : 'STUDENT',
      authorName: isTeacherView ? 'Giáo viên chủ nhiệm - Wellspring Hanoi International Bilingual School' : student.fullName
    };

    const updatedLogs = [log, ...logs].sort((a, b) => {
      const timeB = new Date(b.dateISO || 0).getTime();
      const timeA = new Date(a.dateISO || 0).getTime();
      return timeB - timeA;
    });
    setLogs(updatedLogs);
    localStorage.setItem(`mentor_logs_${student.id}`, JSON.stringify(updatedLogs));
    
    setNewLog({ mood: '😊', content: '', privateNote: '', tags: '' });
    setIsModalOpen(false);
  };

  const deleteLog = (id: string) => {
    if (window.confirm("Xóa bản nhật ký này khỏi hệ thống Insight?")) {
      const updated = logs.filter(l => l.id !== id);
      setLogs(updated);
      localStorage.setItem(`mentor_logs_${student.id}`, JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-8 pb-32 max-w-2xl mx-auto animate-fade-in">
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-[2rem] border border-white/10 shadow-2xl">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Nhật ký <span className="text-yellow-400">Insight</span></h2>
          <p className="text-[10px] opacity-40 uppercase font-bold text-white tracking-widest mt-1">Lưu giữ cảm xúc & Tham vấn Giáo viên chủ nhiệm</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all shadow-xl hover:scale-110 active:scale-95 ${isTeacherView ? 'bg-orange-500 shadow-orange-500/20' : 'bg-blue-600 shadow-blue-600/20'}`}
        >
          <i className="fas fa-plus text-white text-lg"></i>
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/90 backdrop-blur-2xl" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative glass w-full max-w-lg rounded-[3rem] p-10 border border-white/20 animate-slide-up shadow-2xl text-white">
            <h3 className="text-2xl font-black uppercase italic mb-8 text-yellow-400">{isTeacherView ? 'Giáo viên chủ nhiệm - Wellspring Hanoi' : 'Góc tự sự của con'}</h3>
            <form onSubmit={handleAddLog} className="space-y-6">
              {!isTeacherView && (
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1 tracking-widest">Tâm trạng của con hôm nay?</label>
                  <div className="flex justify-between mt-3 p-2 bg-white/5 rounded-2xl border border-white/10 shadow-inner">
                    {MOODS.map(m => (
                      <button 
                        key={m} type="button" onClick={() => setNewLog({...newLog, mood: m})}
                        className={`text-2xl p-2 rounded-xl transition-all ${newLog.mood === m ? 'bg-yellow-400 text-navy scale-125 shadow-lg' : 'opacity-40 hover:opacity-100 hover:scale-110'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-60 ml-1 flex items-center tracking-widest">
                    <i className="fas fa-globe-asia mr-2 text-blue-400"></i>
                    {isTeacherView ? 'Nội dung phản hồi (Học sinh sẽ thấy)' : 'Nội dung chia sẻ cùng Giáo viên chủ nhiệm'}
                  </label>
                  <textarea 
                    value={newLog.content}
                    onChange={e => setNewLog({...newLog, content: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-yellow-400 mt-2 min-h-[120px] shadow-inner leading-relaxed transition-all"
                    placeholder={isTeacherView ? "Viết những lời động viên và nhận xét cho học sinh tại đây..." : "Hôm nay con đã học được gì mới? Hay con có điều gì muốn tâm sự không?..."}
                  />
                </div>

                {isTeacherView && (
                  <div className="animate-fade-in">
                    <label className="text-[10px] font-black uppercase text-orange-400 ml-1 flex items-center tracking-widest">
                      <i className="fas fa-user-shield mr-2"></i>
                      Ghi chú nội bộ (Chỉ Giáo viên/Giáo viên chủ nhiệm thấy)
                    </label>
                    <textarea 
                      value={newLog.privateNote}
                      onChange={e => setNewLog({...newLog, privateNote: e.target.value})}
                      className="w-full bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 text-sm outline-none focus:border-orange-400 mt-2 min-h-[100px] shadow-inner italic leading-relaxed transition-all"
                      placeholder="Ghi chú về đặc điểm tâm lý, sự tiến bộ thầm lặng hoặc các vấn đề cần lưu ý riêng..."
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase opacity-40 ml-1 tracking-widest">Gắn thẻ Hashtags</label>
                <div className="relative mt-2">
                   <i className="fas fa-hashtag absolute left-4 top-1/2 -translate-y-1/2 opacity-20 text-xs"></i>
                   <input 
                      type="text" value={newLog.tags}
                      onChange={e => setNewLog({...newLog, tags: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-xs outline-none focus:border-yellow-400 transition-all font-bold tracking-wider"
                      placeholder="Growth, Goal, Emotional, STEM..."
                    />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Hủy bỏ</button>
                <button type="submit" className={`flex-1 py-4 rounded-2xl ${isTeacherView ? 'bg-orange-500 shadow-orange-500/30' : 'bg-yellow-400 shadow-gold/30'} text-navy text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all`}>Ghi nhật ký</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative space-y-10">
        <div className="absolute left-6 top-6 bottom-0 w-0.5 bg-gradient-to-b from-yellow-400/50 via-white/10 to-transparent"></div>
        {logs.length > 0 ? logs.map((log) => (
          <div key={log.id} className="relative pl-16 animate-fade-in text-white group">
            <div className={`absolute left-3 top-2 w-7 h-7 rounded-2xl bg-navy border-2 ${log.authorRole === 'TEACHER' ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'border-yellow-400 shadow-[0_0_10px_rgba(255,215,0,0.5)]'} flex items-center justify-center text-[10px] z-10 shadow-lg group-hover:scale-110 transition-transform`}>
              <i className={`fas ${log.authorRole === 'TEACHER' ? 'fa-user-tie text-orange-400' : 'fa-pen-nib text-yellow-400'}`}></i>
            </div>
            
            <GlassCard className={`relative overflow-hidden ${log.authorRole === 'TEACHER' ? 'border-orange-500/30 bg-orange-500/5' : 'border-white/10 bg-white/5'} shadow-2xl`}>
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">{log.date}</span>
                  <div className="flex items-center">
                    {log.authorRole !== 'TEACHER' && <span className="text-3xl mr-3">{log.mood}</span>}
                    <h4 className={`font-black text-xl tracking-tighter italic uppercase ${log.authorRole === 'TEACHER' ? 'text-orange-400' : 'text-white'}`}>
                      {log.authorRole === 'TEACHER' ? 'Phản hồi từ Giáo viên chủ nhiệm' : 'Nhật ký Insight'}
                    </h4>
                  </div>
                </div>
                {!isTeacherView && log.authorRole === 'STUDENT' && (
                   <button onClick={() => deleteLog(log.id)} className="text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-trash-alt text-xs"></i></button>
                )}
                {isTeacherView && (
                   <button onClick={() => deleteLog(log.id)} className="text-white/20 hover:text-red-400 transition-all opacity-0 group-hover:opacity-100"><i className="fas fa-trash-alt text-xs"></i></button>
                )}
              </div>

              <div className="space-y-6">
                {log.content && (
                  <div className={`p-5 rounded-2xl bg-navy/40 border border-white/5 relative`}>
                    <i className="fas fa-quote-left absolute -top-3 -left-1 opacity-10 text-3xl"></i>
                    <p className={`text-sm leading-relaxed opacity-90 italic`}>
                      {log.content}
                    </p>
                  </div>
                )}

                {isTeacherView && log.privateNote && (
                  <div className="mt-4 p-5 bg-orange-500/10 rounded-2xl border border-orange-500/20 shadow-inner">
                    <p className="text-[10px] font-black uppercase text-orange-400 mb-3 flex items-center tracking-widest">
                      <i className="fas fa-lock mr-2"></i> Ghi chú nội bộ dành cho GV
                    </p>
                    <p className="text-sm italic opacity-80 leading-relaxed text-white/90">
                      {log.privateNote}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex flex-wrap gap-2 border-t border-white/5 pt-4">
                <span className="text-[9px] font-black uppercase opacity-30 tracking-widest mr-auto">Viết bởi: {log.authorName || 'User'}</span>
                {log.tags.map(tag => (
                  <span key={tag} className="text-[9px] font-black bg-navy/80 px-4 py-1.5 rounded-full border border-white/10 text-yellow-400 uppercase tracking-wider">
                    {tag}
                  </span>
                ))}
              </div>
            </GlassCard>
          </div>
        )) : (
          <div className="py-32 text-center opacity-20 italic glass rounded-[3rem] border border-dashed border-white/10 flex flex-col items-center">
            <i className="fas fa-feather-alt text-5xl mb-6"></i>
            <p className="uppercase tracking-[0.3em] font-black">Hãy bắt đầu bản ghi đầu tiên của con</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorLog;