
import React, { useState } from 'react';
import Dashboard from './screens/Dashboard';
import GoalReview from './screens/GoalReview';
import MentorLog from './screens/MentorLog';
import Portfolio from './screens/Portfolio';
import Login from './screens/Login';
import TeacherPortal from './screens/TeacherPortal';
import { Student } from './types';

type Screen = 'dashboard' | 'goals' | 'log' | 'portfolio' | 'teacher';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Student | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');

  const handleLogin = (user: Student | 'teacher') => {
    if (user === 'teacher') {
      setIsTeacher(true);
      setCurrentUser(null);
      setActiveScreen('teacher');
    } else {
      setCurrentUser(user);
      setIsTeacher(false);
      setActiveScreen('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsTeacher(false);
    setActiveScreen('dashboard');
  };

  const updateStudentInfo = (updated: Student) => {
    setCurrentUser(updated);
  };

  const renderScreen = () => {
    if (!currentUser && !isTeacher) {
      return <Login onLogin={handleLogin} />;
    }

    if (isTeacher && activeScreen === 'teacher') {
      return <TeacherPortal onSelectStudent={(s) => { 
        const overrides = JSON.parse(localStorage.getItem(`profile_override_${s.id}`) || '{}');
        setCurrentUser({ ...s, ...overrides }); 
        setActiveScreen('dashboard'); 
      }} />;
    }

    const student = currentUser!;
    const isTeacherView = isTeacher && !!currentUser;

    switch (activeScreen) {
      case 'dashboard': return <Dashboard student={student} onUpdateStudent={updateStudentInfo} isTeacherView={isTeacherView} />;
      case 'goals': return <GoalReview student={student} isTeacherView={isTeacherView} />;
      case 'log': return <MentorLog student={student} isTeacherView={isTeacherView} />;
      case 'portfolio': return <Portfolio student={student} isTeacherView={isTeacherView} />;
      case 'teacher': return <TeacherPortal onSelectStudent={(s) => { 
        const overrides = JSON.parse(localStorage.getItem(`profile_override_${s.id}`) || '{}');
        setCurrentUser({ ...s, ...overrides }); 
        setActiveScreen('dashboard'); 
      }} />;
      default: return <Dashboard student={student} onUpdateStudent={updateStudentInfo} isTeacherView={isTeacherView} />;
    }
  };

  const isLoggedIn = !!currentUser || isTeacher;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="flex justify-between items-center mb-8 glass px-6 py-4 rounded-2xl shadow-2xl">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => isLoggedIn && setActiveScreen(isTeacher ? 'teacher' : 'dashboard')}>
          <div className="bg-gold p-1.5 rounded-lg"><i className="fas fa-cubes text-navy text-xl"></i></div>
          <h1 className="text-xl font-black tracking-tighter uppercase">INSIGHT <span className="text-yellow-400">360</span></h1>
        </div>
        {isLoggedIn && (
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right mr-2">
              <p className="text-xs font-bold leading-none">{isTeacher && !currentUser ? 'Teacher Portal' : (isTeacher ? `Đang xem: ${currentUser?.fullName}` : currentUser?.fullName)}</p>
              <p className="text-[10px] opacity-50 uppercase tracking-widest">{isTeacher && !currentUser ? 'Quản trị viên' : `Học sinh lớp ${currentUser?.class}`}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-white/50 hover:text-red-400 transition-colors" title="Đăng xuất"><i className="fas fa-sign-out-alt"></i></button>
            <div className={`h-10 w-10 rounded-full ${isTeacher && !currentUser ? 'bg-orange-500' : 'bg-blue-500'} flex items-center justify-center text-xs font-bold border-2 border-white/20 overflow-hidden shadow-lg`}>
              {currentUser ? <img src={currentUser.avatar} className="w-full h-full object-cover" /> : <i className="fas fa-user-tie"></i>}
            </div>
          </div>
        )}
      </header>

      <main className="min-h-[70vh]">{renderScreen()}</main>

      {isLoggedIn && (
        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-xl glass rounded-2xl px-6 py-3 shadow-2xl z-50 flex justify-between items-center border border-white/30 backdrop-blur-2xl">
          {isTeacher && <NavButton active={activeScreen === 'teacher'} icon="fa-users" label="Lớp học" onClick={() => { setCurrentUser(null); setActiveScreen('teacher'); }} />}
          <NavButton active={activeScreen === 'dashboard' && (!!currentUser)} icon="fa-home" label="Chi tiết" onClick={() => currentUser ? setActiveScreen('dashboard') : alert('Chọn học sinh trước')} />
          <NavButton active={activeScreen === 'goals'} icon="fa-bullseye" label="Mục tiêu" onClick={() => currentUser ? setActiveScreen('goals') : alert('Chọn học sinh trước')} />
          <NavButton active={activeScreen === 'log'} icon="fa-pen-fancy" label="Nhật ký" onClick={() => currentUser ? setActiveScreen('log') : alert('Chọn học sinh trước')} />
          <NavButton active={activeScreen === 'portfolio'} icon="fa-th-large" label="Portfolio" onClick={() => currentUser ? setActiveScreen('portfolio') : alert('Chọn học sinh trước')} />
        </nav>
      )}
    </div>
  );
};

interface NavButtonProps { active: boolean; icon: string; label: string; onClick: () => void; }
const NavButton: React.FC<NavButtonProps> = ({ active, icon, label, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center space-y-1 transition-all duration-300 ${active ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}>
    <div className={`p-2 rounded-xl ${active ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'text-white'}`}><i className={`fas ${icon} text-lg`}></i></div>
    <span className={`text-[10px] font-bold ${active ? 'text-white' : 'text-white/70'}`}>{label}</span>
  </button>
);

export default App;
