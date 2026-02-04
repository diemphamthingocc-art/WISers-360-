
import React, { useState, useRef } from 'react';
import { GlassCard } from '../components/GlassCard';
import { RadarChart } from '../components/RadarChart';
import { Student } from '../types';

interface DashboardProps {
  student: Student;
  onUpdateStudent: (updated: Student) => void;
  isTeacherView?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ student, onUpdateStudent, isTeacherView }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editMode, setEditMode] = useState<'avatar' | 'password' | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [passwordForm, setPasswordForm] = useState({
    newPass: '',
    confirmPass: ''
  });

  const startCamera = async () => {
    if (isTeacherView) return;
    setIsCameraActive(true);
    setEditMode('avatar');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert("Không thể truy cập camera. Vui lòng kiểm tra quyền trình duyệt.");
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      updateAvatar(dataUrl);
      stopCamera();
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setIsCameraActive(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        updateAvatar(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateAvatar = (newAvatar: string) => {
    if (isTeacherView) return;
    const updated = { ...student, avatar: newAvatar };
    const overrides = JSON.parse(localStorage.getItem(`profile_override_${student.id}`) || '{}');
    localStorage.setItem(`profile_override_${student.id}`, JSON.stringify({ ...overrides, avatar: newAvatar }));
    onUpdateStudent(updated);
    setIsEditModalOpen(false);
    setEditMode(null);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTeacherView) return;
    if (passwordForm.newPass !== passwordForm.confirmPass) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    
    const overrides = JSON.parse(localStorage.getItem(`profile_override_${student.id}`) || '{}');
    localStorage.setItem(`profile_override_${student.id}`, JSON.stringify({ ...overrides, customPassword: passwordForm.newPass }));
    alert("Đổi mật khẩu thành công! Con hãy sử dụng mật khẩu này cho lần đăng nhập tới.");
    setIsEditModalOpen(false);
    setEditMode(null);
    setPasswordForm({ newPass: '', confirmPass: '' });
  };

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* Student Profile Header */}
      <GlassCard className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6 border-l-4 border-l-yellow-400 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className={`relative ${!isTeacherView ? 'group cursor-pointer' : ''}`} onClick={() => { if(!isTeacherView) { setIsEditModalOpen(true); setEditMode('avatar'); } }}>
          <img src={student.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-white/10 shadow-xl object-cover" />
          {!isTeacherView && (
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <i className="fas fa-camera text-white"></i>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-navy flex items-center justify-center">
            <i className="fas fa-check text-[8px]"></i>
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">{student.fullName}</h2>
          <p className="opacity-70 text-sm font-medium">Lớp: {student.class} • Niên độ: 2024-2025</p>
          <div className="mt-3 flex flex-wrap justify-center md:justify-start gap-2">
            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full border border-blue-500/30 uppercase tracking-widest">WISS Scholar</span>
            <span className="bg-yellow-400/20 text-yellow-400 text-[10px] font-black px-3 py-1 rounded-full border border-yellow-400/30 uppercase tracking-widest">Global Citizen</span>
            {!isTeacherView && (
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="bg-white/10 hover:bg-white/20 text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/20 uppercase tracking-widest transition-all"
              >
                <i className="fas fa-user-edit mr-1"></i> Sửa thông tin
              </button>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Edit Profile Modal */}
      {isEditModalOpen && !isTeacherView && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/90 backdrop-blur-xl" onClick={() => { setIsEditModalOpen(false); stopCamera(); }}></div>
          <div className="relative glass w-full max-w-md rounded-[2.5rem] p-10 border border-white/20 animate-fade-in shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-6 text-yellow-400">Tùy chỉnh tài khoản</h3>
            
            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-8">
              <button 
                onClick={() => { setEditMode('avatar'); stopCamera(); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${editMode === 'avatar' ? 'bg-yellow-400 text-navy' : 'opacity-40'}`}
              >Ảnh đại diện</button>
              <button 
                onClick={() => { setEditMode('password'); stopCamera(); }}
                className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${editMode === 'password' ? 'bg-indigo-500 text-white' : 'opacity-40'}`}
              >Mật khẩu</button>
            </div>

            {editMode === 'avatar' && (
              <div className="space-y-6">
                {!isCameraActive ? (
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center aspect-square glass rounded-3xl border-2 border-dashed border-white/10 hover:border-yellow-400 transition-all group"
                    >
                      <i className="fas fa-image text-3xl mb-3 opacity-20 group-hover:opacity-100"></i>
                      <span className="text-[10px] font-black uppercase opacity-40 group-hover:opacity-100">Chọn từ máy</span>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                    </button>
                    <button 
                      onClick={startCamera}
                      className="flex flex-col items-center justify-center aspect-square glass rounded-3xl border-2 border-dashed border-white/10 hover:border-blue-400 transition-all group"
                    >
                      <i className="fas fa-camera text-3xl mb-3 opacity-20 group-hover:opacity-100"></i>
                      <span className="text-[10px] font-black uppercase opacity-40 group-hover:opacity-100">Chụp ảnh mới</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="aspect-square rounded-3xl overflow-hidden border-2 border-yellow-400 relative bg-black">
                      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    </div>
                    <div className="flex gap-4">
                      <button onClick={stopCamera} className="flex-1 py-4 rounded-2xl bg-white/5 text-[10px] font-black uppercase">Quay lại</button>
                      <button onClick={capturePhoto} className="flex-1 py-4 rounded-2xl bg-blue-500 text-white text-[10px] font-black uppercase shadow-lg">Chụp & Lưu</button>
                    </div>
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            )}

            {editMode === 'password' && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1">Mật khẩu mới</label>
                  <input 
                    type="password"
                    required
                    value={passwordForm.newPass}
                    onChange={e => setPasswordForm({...passwordForm, newPass: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs mt-1 outline-none focus:border-yellow-400"
                    placeholder="Nhập mật khẩu mới..."
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1">Xác nhận mật khẩu</label>
                  <input 
                    type="password"
                    required
                    value={passwordForm.confirmPass}
                    onChange={e => setPasswordForm({...passwordForm, confirmPass: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs mt-1 outline-none focus:border-yellow-400"
                    placeholder="Xác nhận lại mật khẩu..."
                  />
                </div>
                <button type="submit" className="w-full py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase shadow-xl mt-4">Cập nhật mật khẩu</button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Radar Analysis */}
        <GlassCard className="flex flex-col items-center">
          <h3 className="text-lg font-black mb-6 flex items-center uppercase tracking-tighter self-start">
            <i className="fas fa-chart-pie mr-3 text-yellow-400"></i>
            Chân dung năng lực 360°
          </h3>
          <RadarChart data={student.scores} size={300} />
          <div className="mt-6 grid grid-cols-5 gap-2 w-full">
            {Object.entries(student.scores).map(([key, val]) => (
              <div key={key} className="bg-white/5 p-2 rounded-xl text-center">
                <p className="opacity-40 text-[8px] font-black uppercase">{key}</p>
                <p className="font-black text-sm text-yellow-400">{val}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* AI Homeroom Teacher Insights */}
        <div className="space-y-6">
          <GlassCard className="relative overflow-hidden group">
            <h3 className="text-lg font-black mb-6 flex items-center uppercase tracking-tighter">
              <i className="fas fa-robot mr-3 text-blue-400"></i>
              AI Giáo viên chủ nhiệm Insight
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="p-4 bg-blue-500/10 border-l-4 border-blue-500 rounded-xl">
                <p className="text-xs font-black uppercase text-blue-400 mb-1">Cảm hứng học tập</p>
                <p className="text-xs opacity-80 leading-relaxed italic">"Với các chỉ số hiện tại, con đang thể hiện sự vượt trội về Tư duy Logic. Hãy tiếp tục duy trì thói quen học tập đã đề ra nhé!"</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="border-t-4 border-green-500">
            <h4 className="text-xs font-black uppercase text-green-400 mb-4 tracking-widest flex justify-between items-center">
              <span>Nhiệm vụ trọng tâm</span>
              <span className="text-[10px] opacity-50 lowercase font-normal italic">Tuần 12</span>
            </h4>
            <div className="space-y-3">
              {[
                { t: "Hoàn thiện mục tiêu Insight 360", done: true },
                { t: "Cập nhật 02 minh chứng Achievement", done: false },
                { t: "Ghi nhật ký tham vấn Giáo viên chủ nhiệm", done: false }
              ].map((task, i) => (
                <div key={i} className={`flex items-center p-3 rounded-xl border ${task.done ? 'bg-green-500/10 border-green-500/20 opacity-60' : 'bg-white/5 border-white/5'}`}>
                  <i className={`fas ${task.done ? 'fa-check-circle text-green-500' : 'fa-circle text-white/20'} mr-3`}></i>
                  <p className={`text-xs font-bold ${task.done ? 'line-through' : ''}`}>{task.t}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
