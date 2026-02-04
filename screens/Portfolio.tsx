import React, { useState, useEffect, useRef } from 'react';
import GoalReview from './GoalReview';
import { GlassCard } from '../components/GlassCard';

// Khai báo thư viện jsPDF từ CDN (đã nạp trong index.html)
declare const jspdf: any;

interface PortfolioItem {
  id: string;
  title: string;
  type: string;
  category: 'achievements' | 'activities';
  subCategory: string;
  img: string;
  date: string;
  note?: string; // Ghi chú thêm cho compilation
}

interface PortfolioProps {
  student: any;
  isTeacherView?: boolean;
}

const SUB_CATEGORIES = ['Học tập', 'Thể thao', 'Nghệ thuật', 'Kỹ năng', 'Cộng đồng', 'Khác'];

const Portfolio: React.FC<PortfolioProps> = ({ student, isTeacherView }) => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'activities' | 'archives'>('achievements');
  const [archives, setArchives] = useState<any[]>([]);
  const [selectedArchive, setSelectedArchive] = useState<any | null>(null);
  
  const [items, setItems] = useState<{ achievements: PortfolioItem[], activities: PortfolioItem[] }>({
    achievements: [],
    activities: []
  });

  // Compilation & Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showCompileModal, setShowCompileModal] = useState(false);
  const [compilationNotes, setCompilationNotes] = useState<Record<string, string>>({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubCat, setFilterSubCat] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Modal State for new upload
  const [uploadingItem, setUploadingItem] = useState<{ 
    base64: string, 
    name: string, 
    category: 'achievements' | 'activities',
    subCategory: string 
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(`portfolio_items_${student.id}`);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        setItems({ achievements: [], activities: [] });
      }
    } else {
      setItems({ achievements: [], activities: [] });
    }
  }, [student.id]);

  useEffect(() => {
    if (student) {
      const stored = JSON.parse(localStorage.getItem(`archives_${student.id}`) || '[]');
      setArchives(stored.sort((a: any, b: any) => {
        const idA = a.id.split('-')[1] || 0;
        const idB = b.id.split('-')[1] || 0;
        return parseInt(idB) - parseInt(idA);
      }));
    }
  }, [student.id, activeTab]);

  const optimizeImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; // Tăng nhẹ độ phân giải cho PDF
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85)); // Chất lượng tốt hơn cho in ấn
        } else {
          resolve(base64);
        }
      };
      img.onerror = () => resolve(base64);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isTeacherView) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalBase64 = event.target?.result as string;
      const optimizedBase64 = await optimizeImage(originalBase64);
      
      setUploadingItem({
        base64: optimizedBase64,
        name: '',
        category: activeTab === 'activities' ? 'activities' : 'achievements',
        subCategory: SUB_CATEGORIES[0]
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveUploadedItem = () => {
    if (!uploadingItem || !uploadingItem.name.trim()) {
      alert("Vui lòng nhập tên chứng chỉ hoặc hoạt động!");
      return;
    }

    const newItem: PortfolioItem = {
      id: `item-${Date.now()}`,
      title: uploadingItem.name,
      type: uploadingItem.category === 'achievements' ? 'Thành tựu' : 'Hoạt động',
      category: uploadingItem.category,
      subCategory: uploadingItem.subCategory,
      img: uploadingItem.base64,
      date: new Date().toISOString()
    };

    const targetCategory = uploadingItem.category;
    const newItems = {
      ...items,
      [targetCategory]: [newItem, ...(items[targetCategory] || [])]
    };

    try {
      localStorage.setItem(`portfolio_items_${student.id}`, JSON.stringify(newItems));
      setItems(newItems);
      setUploadingItem(null);
      alert("Đã lưu vào Portfolio thành công!");
    } catch (e) {
      alert("Lỗi: Bộ nhớ trình duyệt đã đầy. Vui lòng xóa bớt minh chứng cũ.");
    }
  };

  const deleteItem = (id: string, category: 'achievements' | 'activities') => {
    if (isTeacherView) return;
    if (window.confirm("Xóa minh chứng này khỏi Portfolio?")) {
      const updatedList = (items[category] || []).filter((i: any) => i.id !== id);
      const updatedAll = { ...items, [category]: updatedList };
      localStorage.setItem(`portfolio_items_${student.id}`, JSON.stringify(updatedAll));
      setItems(updatedAll);
    }
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getDisplayItems = () => {
    if (activeTab === 'archives') return archives;
    
    let filtered = items[activeTab] || [];

    if (searchQuery.trim()) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterSubCat !== 'All') {
      filtered = filtered.filter(item => item.subCategory === filterSubCat);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      filtered = filtered.filter(item => new Date(item.date).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(endDate).getTime();
      filtered = filtered.filter(item => new Date(item.date).getTime() <= end);
    }

    return filtered;
  };

  /**
   * Hàm loại bỏ dấu tiếng Việt chuẩn hóa NFD giúp hiển thị an toàn trên PDF
   */
  const removeVietnameseTones = (str: string) => {
    if (!str) return "";
    return str
      .normalize('NFD') // Tách các ký tự dấu
      .replace(/[\u0300-\u036f]/g, '') // Xóa dấu
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^\x00-\x7F]/g, ""); // Đảm bảo chỉ còn ký tự ASCII cho PDF chuẩn
  };

  const handleExportPDF = async () => {
    if (selectedItemIds.length === 0) return;
    if (!(window as any).jspdf) {
      alert("Hệ thống đang nạp thư viện PDF, vui lòng thử lại sau 1 giây.");
      return;
    }
    
    const allItems = [...items.achievements, ...items.activities];
    const selectedItems = allItems.filter(i => selectedItemIds.includes(i.id));

    try {
      const { jsPDF } = (window as any).jspdf;
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // --- TRANG BÌA ---
      doc.setFillColor(26, 42, 108); // WIS Navy
      doc.rect(0, 0, 210, 297, 'F');
      
      doc.setTextColor(255, 215, 0); // WIS Gold
      doc.setFont("helvetica", "bold");
      doc.setFontSize(40);
      doc.text("INSIGHT 360", 105, 90, { align: 'center' });
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("E-PORTFOLIO SUMMARY", 105, 105, { align: 'center' });
      
      doc.setDrawColor(255, 215, 0);
      doc.setLineWidth(1);
      doc.line(60, 115, 150, 115);

      doc.setFontSize(18);
      doc.text(removeVietnameseTones(student.fullName).toUpperCase(), 105, 145, { align: 'center' });
      doc.setFontSize(14);
      doc.text(`Class: ${student.class}`, 105, 155, { align: 'center' });
      doc.text(`Academic Year: 2024 - 2025`, 105, 165, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setTextColor(200, 200, 200);
      doc.text("WELLSPRING HANOI INTERNATIONAL BILINGUAL SCHOOL", 105, 275, { align: 'center' });

      // --- CÁC TRANG MINH CHỨNG ---
      for (const item of selectedItems) {
        doc.addPage();
        
        // Vẽ khung trang
        doc.setDrawColor(230, 230, 240);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);

        // Thanh Header
        doc.setFillColor(26, 42, 108);
        doc.rect(5, 5, 200, 15, 'F');
        doc.setTextColor(255, 215, 0);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`${item.type.toUpperCase()} | ${item.subCategory.toUpperCase()}`, 12, 15);
        doc.setTextColor(255, 255, 255);
        doc.text("WISERS INSIGHT 360", 198, 15, { align: 'right' });
        
        // Xử lý Ảnh
        const imgData = item.img;
        let format = 'JPEG';
        if (imgData.includes('png') || imgData.includes('PNG')) format = 'PNG';
        
        doc.setDrawColor(220, 220, 225);
        doc.rect(15, 30, 180, 120); // Vùng chứa ảnh
        
        try {
          doc.addImage(imgData, format, 16, 31, 178, 118, undefined, 'FAST');
        } catch (e) {
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(12);
          doc.text("[MINH CHUNG HINH ANH]", 105, 90, { align: 'center' });
        }

        // Thông tin minh chứng
        doc.setTextColor(26, 42, 108);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        const safeTitle = removeVietnameseTones(item.title).toUpperCase();
        const splitTitle = doc.splitTextToSize(safeTitle, 180);
        doc.text(splitTitle, 15, 170);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.setFontSize(10);
        doc.text(`Recorded Date: ${new Date(item.date).toLocaleDateString('vi-VN')}`, 15, 182);
        
        // Khu vực Phản hồi (Reflection)
        doc.setFillColor(245, 247, 255);
        doc.rect(15, 195, 180, 75, 'F');
        doc.setDrawColor(200, 205, 230);
        doc.rect(15, 195, 180, 75);
        
        doc.setTextColor(26, 42, 108);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("STUDENT'S REFLECTION & LEARNING JOURNEY:", 20, 205);
        
        const note = compilationNotes[item.id] || "No reflection added for this evidence.";
        doc.setTextColor(60, 60, 80);
        doc.setFont("helvetica", "italic");
        doc.setFontSize(11);
        const safeNote = removeVietnameseTones(note);
        const splitNote = doc.splitTextToSize(safeNote, 170);
        doc.text(splitNote, 20, 215);
        
        // Footer trang
        doc.setTextColor(180, 180, 180);
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.text(`Student: ${removeVietnameseTones(student.fullName)} | Class: ${student.class} | WIS Insight 360 Portfolio`, 105, 288, { align: 'center' });
      }

      doc.save(`WIS_Portfolio_${student.fullName.replace(/\s/g, '_')}.pdf`);
      setShowCompileModal(false);
      setIsSelectionMode(false);
      setSelectedItemIds([]);
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Lỗi xuất tệp PDF. Vui lòng thử lại hoặc liên hệ quản trị viên.");
    }
  };

  if (selectedArchive) {
    return (
      <GoalReview 
        student={student} 
        viewData={selectedArchive} 
        onBack={() => {
          setSelectedArchive(null);
          const stored = JSON.parse(localStorage.getItem(`archives_${student.id}`) || '[]');
          setArchives(stored);
        }} 
        isTeacherView={isTeacherView} 
      />
    );
  }

  const displayItems = getDisplayItems();

  return (
    <div className="space-y-8 pb-32 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white leading-none">Smart <span className="text-yellow-400">Portfolio</span></h2>
          <p className="text-xs opacity-60 font-black uppercase tracking-[0.2em] text-white/60 mt-2">Hồ sơ năng lực số dành cho WISers Insight 360</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {activeTab !== 'archives' && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (isSelectionMode) {
                    if (selectedItemIds.length > 0) setShowCompileModal(true);
                    else setIsSelectionMode(false);
                  } else {
                    setIsSelectionMode(true);
                  }
                }}
                className={`px-6 py-3 rounded-2xl flex items-center justify-center transition-all shadow-xl font-black uppercase text-[10px] tracking-widest ${isSelectionMode ? 'bg-orange-500 text-white animate-pulse' : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'}`}
              >
                <i className={`fas ${isSelectionMode ? 'fa-file-pdf' : 'fa-list-check'} mr-2`}></i>
                {isSelectionMode ? `Xác nhận tải về (${selectedItemIds.length})` : 'Chọn ảnh biên tập PDF'}
              </button>
              {isSelectionMode && (
                <button 
                  onClick={() => { setIsSelectionMode(false); setSelectedItemIds([]); }}
                  className="bg-red-500/20 text-red-400 h-12 w-12 rounded-2xl border border-red-500/30 flex items-center justify-center hover:bg-red-500/30 transition-all"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          )}

          <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            {[
              { id: 'achievements', label: 'Thành tựu' },
              { id: 'activities', label: 'Hoạt động' },
              { id: 'archives', label: 'Lưu trữ' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsSelectionMode(false); setSelectedItemIds([]); }} 
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-yellow-400 text-navy shadow-lg scale-105' : 'opacity-40 hover:opacity-100 text-white hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {!isTeacherView && activeTab !== 'archives' && (
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 text-white h-12 w-12 rounded-2xl flex items-center justify-center hover:scale-110 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 border border-emerald-500/50"
              title="Tải lên minh chứng"
            >
              <i className="fas fa-plus"></i>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Section */}
      <div className="space-y-4">
        <div className="glass p-6 rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col md:flex-row items-center gap-6">
          <div className="w-full md:w-auto flex-shrink-0">
            <p className="text-[10px] font-black uppercase text-yellow-400 mb-3 tracking-widest ml-1">Lọc nhanh theo chuyên mục</p>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {['All', ...SUB_CATEGORIES].map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterSubCat(cat)}
                  className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase whitespace-nowrap border transition-all duration-300 ${filterSubCat === cat ? 'bg-yellow-400 text-navy border-yellow-400 shadow-lg scale-105' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/30'}`}
                >
                  {cat === 'All' ? 'Tất cả' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-white/10"></div>

          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 opacity-30 text-xs"></i>
              <input 
                type="text"
                placeholder="Tìm từ khóa minh chứng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-3.5 text-xs outline-none focus:border-yellow-400 transition-all text-white placeholder:text-white/20"
              />
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 py-3.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${showFilters ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
              >
                <i className="fas fa-calendar-alt mr-2"></i>
                {showFilters ? 'Đóng bộ lọc' : 'Lọc theo ngày'}
              </button>
              {(searchQuery || filterSubCat !== 'All' || startDate || endDate) && (
                <button 
                  onClick={() => { setSearchQuery(''); setFilterSubCat('All'); setStartDate(''); setEndDate(''); }}
                  className="bg-red-500/10 text-red-400 px-4 rounded-2xl border border-red-500/20 hover:bg-red-500/20 transition-all"
                >
                  <i className="fas fa-undo"></i>
                </button>
              )}
            </div>
          </div>
        </div>

        {showFilters && activeTab !== 'archives' && (
          <GlassCard className="animate-slide-down border-white/10 p-6 rounded-3xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 text-white ml-1">Từ ngày</label>
                <input 
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-yellow-400 text-white invert hue-rotate-180 brightness-200"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 text-white ml-1">Đến ngày</label>
                <input 
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-yellow-400 text-white invert hue-rotate-180 brightness-200"
                />
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* PDF Compilation Modal (PREVIEW) */}
      {showCompileModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/95 backdrop-blur-xl" onClick={() => setShowCompileModal(false)}></div>
          <GlassCard className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3rem] p-10 border border-white/20 animate-slide-up shadow-2xl no-scrollbar">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-white/10 gap-6">
              <div>
                <h3 className="text-3xl font-black uppercase italic text-yellow-400 flex items-center">
                  <i className="fas fa-file-pdf mr-4"></i>
                  Biên tập & Preview PDF
                </h3>
                <p className="text-[10px] opacity-40 font-black uppercase mt-1">Chuẩn bị nội dung trước khi xuất bản hồ sơ năng lực số</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowCompileModal(false)}
                  className="px-6 py-4 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-white border border-white/10"
                >
                  Quay lại
                </button>
                <button 
                  onClick={handleExportPDF}
                  className="px-10 py-4 rounded-2xl bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  <i className="fas fa-download mr-2"></i> Xuất bản PDF
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...items.achievements, ...items.activities]
                .filter(i => selectedItemIds.includes(i.id))
                .map(item => (
                  <div key={item.id} className="bg-white/5 rounded-[2rem] p-6 border border-white/10 space-y-4 group">
                    <div className="flex gap-6">
                      <div className="w-32 h-32 rounded-2xl overflow-hidden border border-white/10 flex-shrink-0 bg-black/20">
                        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                      </div>
                      <div className="flex-1">
                        <span className="bg-navy/60 text-yellow-400 text-[8px] font-black uppercase px-2 py-1 rounded-md border border-white/10">{item.subCategory}</span>
                        <h5 className="font-black uppercase text-base text-white leading-tight mt-2">{item.title}</h5>
                        <p className="text-[9px] opacity-40 font-bold mt-1 italic">{new Date(item.date).toLocaleDateString('vi-VN')}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase opacity-40 text-white ml-1 tracking-widest">
                        Ghi chú & Suy ngẫm của con (Sẽ hiện trong PDF)
                      </label>
                      <textarea 
                        value={compilationNotes[item.id] || ''}
                        onChange={(e) => setCompilationNotes({...compilationNotes, [item.id]: e.target.value})}
                        className="w-full bg-navy/40 border border-white/10 rounded-2xl p-4 text-xs outline-none focus:border-yellow-400 text-white min-h-[120px] italic leading-relaxed shadow-inner"
                        placeholder="Con đã học được bài học gì? Cảm xúc của con ra sao khi đạt được thành tựu này?..."
                      />
                    </div>
                  </div>
                ))}
            </div>
          </GlassCard>
        </div>
      )}

      {/* Upload Confirmation Modal */}
      {uploadingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/95 backdrop-blur-xl" onClick={() => setUploadingItem(null)}></div>
          <GlassCard className="relative w-full max-w-xl rounded-[3rem] p-10 border border-white/20 animate-slide-up shadow-2xl">
            <h3 className="text-2xl font-black uppercase italic text-yellow-400 mb-8 tracking-tighter">Xác nhận minh chứng</h3>
            
            <div className="space-y-6">
              <div className="aspect-video w-full rounded-[2rem] overflow-hidden border border-white/10 bg-black/40 shadow-inner">
                <img src={uploadingItem.base64} className="w-full h-full object-contain" alt="Preview" />
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1 text-white tracking-widest">Loại minh chứng</label>
                  <div className="flex gap-2 mt-2">
                    <button 
                      onClick={() => setUploadingItem({...uploadingItem, category: 'achievements'})}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border ${uploadingItem.category === 'achievements' ? 'bg-yellow-400 text-navy border-yellow-400 shadow-lg scale-105' : 'bg-white/5 border-white/10 opacity-40 text-white'}`}
                    >
                      Thành tựu
                    </button>
                    <button 
                      onClick={() => setUploadingItem({...uploadingItem, category: 'activities'})}
                      className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase transition-all border ${uploadingItem.category === 'activities' ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg scale-105' : 'bg-white/5 border-white/10 opacity-40 text-white'}`}
                    >
                      Hoạt động
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1 text-white tracking-widest">Chuyên mục</label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {SUB_CATEGORIES.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => setUploadingItem({...uploadingItem, subCategory: cat})}
                        className={`py-2.5 rounded-xl text-[8px] font-black uppercase border transition-all ${uploadingItem.subCategory === cat ? 'bg-white/20 border-white/50 text-white' : 'bg-white/5 border-white/10 opacity-30 text-white'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 ml-1 text-white tracking-widest">
                    {uploadingItem.category === 'achievements' ? 'Tên chứng chỉ / Giải thưởng' : 'Tên sự kiện / Dự án'}
                  </label>
                  <input 
                    type="text"
                    value={uploadingItem.name}
                    onChange={(e) => setUploadingItem({...uploadingItem, name: e.target.value})}
                    placeholder="Nhập tên chính thức..."
                    className="w-full bg-navy/60 border border-white/20 rounded-2xl py-5 px-6 text-sm mt-2 outline-none focus:border-yellow-400 transition-all text-yellow-400 font-bold placeholder:text-white/10 shadow-inner"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => setUploadingItem(null)}
                  className="flex-1 py-5 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 text-white"
                >
                  Hủy
                </button>
                <button 
                  onClick={saveUploadedItem}
                  className="flex-1 py-5 rounded-2xl bg-yellow-400 text-navy text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-gold/20 font-black hover:scale-105 active:scale-95 transition-all"
                >
                  Lưu minh chứng
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Main Grid View */}
      <div className="relative">
        {displayItems.length > 0 ? (
          <div className={`${activeTab === 'archives' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6'}`}>
            {activeTab === 'archives' ? (
              displayItems.map((item: any) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedArchive(item)}
                  className="glass rounded-[2.5rem] p-10 border border-white/10 hover:border-yellow-400 transition-all cursor-pointer group relative overflow-hidden flex flex-col h-full text-white shadow-2xl"
                >
                  <div className="flex justify-between items-start mb-8">
                    <div className={`p-5 rounded-2xl ${item.type === 'PLAN' ? 'bg-yellow-400/20 text-yellow-400' : 'bg-emerald-400/20 text-emerald-400'} border border-white/5 shadow-inner`}>
                      <i className={`fas ${item.type === 'PLAN' ? 'fa-map-marked-alt' : 'fa-clipboard-check'} text-3xl`}></i>
                    </div>
                    {item.mentorVerified && <span className="bg-emerald-500 text-navy text-[8px] font-black px-3 py-1.5 rounded-xl uppercase shadow-md border border-emerald-400/20"><i className="fas fa-check-circle mr-1.5"></i>Đã duyệt</span>}
                  </div>
                  <h4 className="font-black uppercase tracking-tight text-xl mb-2 group-hover:text-yellow-400 transition-colors leading-tight">{item.title}</h4>
                  <p className="text-[10px] font-bold opacity-30 uppercase tracking-[0.2em] mb-10">{item.date} • {item.phase}</p>
                  <button className="w-full mt-auto py-4 rounded-[1.5rem] bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5 group-hover:border-yellow-400/20 text-white shadow-sm">
                    Xem hồ sơ chi tiết
                  </button>
                </div>
              ))
            ) : (
              displayItems.map((item: any) => (
                <div 
                  key={item.id} 
                  onClick={() => isSelectionMode && toggleItemSelection(item.id)}
                  className={`break-inside-avoid relative glass rounded-[2.5rem] overflow-hidden group border transition-all duration-500 shadow-2xl cursor-pointer ${isSelectionMode ? (selectedItemIds.includes(item.id) ? 'ring-4 ring-yellow-400 border-yellow-400 scale-[0.98]' : 'opacity-40 grayscale blur-[3px] scale-95') : 'hover:border-yellow-400/40'}`}
                >
                  <img src={item.img} alt={item.title} className="w-full h-auto object-cover transition-transform duration-1000 group-hover:scale-110" />
                  
                  {isSelectionMode && (
                    <div className="absolute top-6 right-6 z-20">
                      <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all ${selectedItemIds.includes(item.id) ? 'bg-yellow-400 border-navy text-navy scale-110' : 'bg-black/40 border-white/50 text-transparent'}`}>
                        <i className="fas fa-check text-xs"></i>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 left-4 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-all transform -translate-y-2 group-hover:translate-y-0 duration-500">
                    <span className="bg-navy/90 backdrop-blur-xl text-yellow-400 text-[8px] font-black uppercase px-3 py-1.5 rounded-xl border border-white/10 shadow-xl">{item.subCategory}</span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-navy/100 via-navy/50 to-transparent p-8 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="flex justify-between items-start mb-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                       <span className={`text-[8px] font-black uppercase px-2.5 py-1 rounded-lg border ${item.type === 'Thành tựu' ? 'bg-yellow-400 text-navy border-yellow-400' : 'bg-indigo-600 text-white border-indigo-500'}`}>{item.type}</span>
                       {!isTeacherView && !isSelectionMode && (
                         <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id, activeTab as any); }} className="text-white/40 hover:text-red-400 bg-white/5 h-8 w-8 flex items-center justify-center rounded-xl transition-all border border-white/5 hover:border-red-400/30">
                           <i className="fas fa-trash-alt text-[10px]"></i>
                         </button>
                       )}
                    </div>
                    <h5 className="text-lg font-black text-white leading-tight uppercase mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">{item.title}</h5>
                    <div className="flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                      <i className="far fa-calendar text-[10px] text-white/30"></i>
                      <p className="text-[10px] text-white/50 font-bold italic">{new Date(item.date).toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="py-48 flex flex-col items-center justify-center text-center opacity-30 glass rounded-[4rem] border border-dashed border-white/10 text-white">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-8">
              <i className="fas fa-images text-5xl"></i>
            </div>
            <p className="italic uppercase tracking-[0.4em] text-sm font-black text-white">Không có minh chứng trong kho lưu trữ này</p>
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .columns-1 { column-count: 1; }
        @media (min-width: 640px) { .columns-2 { column-count: 2; } }
        @media (min-width: 1024px) { .columns-3 { column-count: 3; } }
        @media (min-width: 1280px) { .columns-4 { column-count: 4; } }
      `}</style>
    </div>
  );
};

export default Portfolio;