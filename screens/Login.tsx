
import React, { useState } from 'react';
import { GlassCard } from '../components/GlassCard';
import { ALL_STUDENTS } from '../constants';
import { Student } from '../types';

const CLASSES = ['6AB1', '6AB2', '6AB3', '6AB4', '6AD', '6MT', '8AB3'];

const normalizeForPassword = (str: string) => {
  if (!str) return "";
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, '');
};

interface LoginProps {
  onLogin: (user: Student | 'teacher') => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isTeacherMode, setIsTeacherMode] = useState(false);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const filteredStudents = ALL_STUDENTS.filter(s => s.class === selectedClass);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isTeacherMode) {
      if (password === 'Wellspring123') {
        onLogin('teacher');
      } else {
        setError('Mật mã giáo viên không chính xác.');
      }
      return;
    }

    if (!selectedStudentId) {
      setError('Con hãy chọn tên của mình nhé.');
      return;
    }

    const studentBase = ALL_STUDENTS.find(s => s.id === selectedStudentId);
    if (studentBase) {
      const overrides = JSON.parse(localStorage.getItem(`profile_override_${studentBase.id}`) || '{}');
      const student = { ...studentBase, ...overrides };
      
      const defaultPass = normalizeForPassword(studentBase.fullName) + studentBase.class;
      const effectivePass = overrides.customPassword || defaultPass;

      if (password === effectivePass) {
        onLogin(student);
      } else {
        setError('Mật khẩu chưa đúng, con kiểm tra lại nhé! (Gợi ý: Tên không dấu + Lớp)');
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <GlassCard className="w-full max-w-md p-10 space-y-6 border-t-4 border-t-yellow-400 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/10 rounded-full blur-3xl"></div>
        <div className="text-center relative z-10">
          <div className="bg-gold w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-gold/20">
            <i className={`fas ${isTeacherMode ? 'fa-user-tie' : 'fa-user-graduate'} text-navy text-3xl`}></i>
          </div>
          <h2 className="text-3xl font-black tracking-tight uppercase italic text-white">Xin chào <span className="text-yellow-400">WISers!</span></h2>
          
          <div className="flex justify-center mt-6 p-1 bg-white/5 rounded-xl border border-white/10">
            <button 
              onClick={() => { setIsTeacherMode(false); setError(''); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${!isTeacherMode ? 'bg-yellow-400 text-navy shadow-md' : 'opacity-50 hover:opacity-100 text-white'}`}
            >Con là học sinh</button>
            <button 
              onClick={() => { setIsTeacherMode(true); setError(''); }}
              className={`flex-1 py-2 text-[10px] font-black uppercase rounded-lg transition-all ${isTeacherMode ? 'bg-orange-500 text-white shadow-md' : 'opacity-50 hover:opacity-100 text-white'}`}
            >Giáo viên</button>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          {!isTeacherMode && (
            <>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest text-white">Lớp của con</label>
                <select 
                  value={selectedClass}
                  onChange={(e) => { setSelectedClass(e.target.value); setSelectedStudentId(''); }}
                  className="w-full bg-[#1A2A6C] border border-white/20 rounded-xl py-3 px-4 focus:border-yellow-400 outline-none transition-all cursor-pointer text-white"
                >
                  <option value="" className="bg-[#1A2A6C] text-white">-- Chọn lớp --</option>
                  {CLASSES.map(c => <option key={c} value={c} className="bg-[#1A2A6C] text-white">{c}</option>)}
                </select>
              </div>

              <div className={`space-y-1 transition-all duration-300 ${selectedClass ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest text-white">Tên của con</label>
                <select 
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full bg-[#1A2A6C] border border-white/20 rounded-xl py-3 px-4 focus:border-yellow-400 outline-none transition-all cursor-pointer text-white"
                >
                  <option value="" className="bg-[#1A2A6C] text-white">-- Chọn tên con --</option>
                  {filteredStudents.map(s => <option key={s.id} value={s.id} className="bg-[#1A2A6C] text-white">{s.fullName}</option>)}
                </select>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase opacity-60 ml-1 tracking-widest text-white">Mật mã truy cập</label>
            <div className="relative">
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isTeacherMode ? "Nhập mã bảo mật" : "Nhập mật khẩu con nhé"}
                className="w-full bg-white/5 border border-white/20 rounded-xl py-3 px-4 focus:border-yellow-400 outline-none transition-all text-white placeholder:text-white/30"
                required
              />
              <i className="fas fa-lock absolute right-4 top-1/2 -translate-y-1/2 opacity-40 text-white"></i>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-xl text-[10px] text-red-200 flex items-center space-x-2 animate-pulse">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            className={`w-full ${isTeacherMode ? 'bg-orange-500' : 'bg-yellow-400'} text-navy font-black py-4 rounded-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-gold/20 uppercase mt-2 tracking-widest`}
          >Bắt đầu khám phá</button>
        </form>
        <p className="text-[9px] text-center opacity-40 uppercase tracking-[0.2em] font-bold text-white leading-relaxed">
          Wellspring Hanoi International Bilingual School<br/>Insight 360 EdTech Platform
        </p>
      </GlassCard>
    </div>
  );
};

export default Login;
