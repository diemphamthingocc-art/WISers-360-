import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GlassCard } from '../components/GlassCard';
import { Student } from '../types';
import { GoogleGenAI } from "@google/genai";

// Khai báo thư viện PptxGenJS
declare const PptxGenJS: any;

interface GoalReviewProps {
  student: Student;
  viewData?: any; 
  onBack?: () => void;
  isTeacherView?: boolean;
}

const PHASES = ["Giữa học kỳ I", "Cuối học kỳ I", "Giữa học kỳ II", "Cuối học kỳ II"];
const ACHIEVEMENTS = ["Học sinh Giỏi", "Học sinh Xuất sắc", "Học sinh Nỗ lực", "Học sinh Danh dự", "Active WISers"];

const SUBJECTS_INT = ["ESL", "Grammar", "Computer Science", "Science", "Math"];
const SUBJECTS_VN = [
  "Toán", "Ngữ văn", "KHTN", "Lịch sử & Địa lý", "Well-being", 
  "Công nghệ (STEM/Robotic)", "GD Thể chất", "Âm nhạc - Mỹ thuật"
];

const NON_NUMERIC_SUBJECTS = ["GD Thể chất", "Âm nhạc - Mỹ thuật"];

const SUGGESTIONS = {
  academic: {
    science: { title: "Khoa học & Tự nhiên", icon: "fa-atom", items: ["Giải 1 bài Toán khó/ngày", "Tự thực hành thí nghiệm", "Học thêm 1 hàm Excel/Tin học", "Đọc sách khám phá khoa học", "Xem 1 video khoa học ngắn/ngày"] },
    social: { title: "Xã hội & Ngôn ngữ", icon: "fa-book-open", items: ["Viết nhật ký tiếng Anh", "Đọc 1 cuốn sách văn học/tháng", "Vẽ Mindmap lịch sử", "Học 10 từ vựng ngoại ngữ/ngày", "Tóm tắt tin tức thế giới hàng tuần", "Tham gia câu lạc bộ tranh biện"] },
    method: { title: "Phương pháp & Kỹ năng", icon: "fa-brain", items: ["Hoàn thành 100% BTVN", "Hỏi bài ngay khi chưa hiểu", "Ghi chép bài đầy đủ", "Tự kiểm tra kiến thức tuần", "Sử dụng Pomodoro (25-5)", "Học nhóm ít nhất 1 lần/tuần", "Ôn tập bài cũ sau 24h"] }
  },
  routine: {
    discipline: { title: "Kỷ luật & Nề nếp", icon: "fa-university", items: ["Đi học đúng giờ", "Đồng phục đúng quy định", "Giữ vệ sinh lớp học", "Tuân thủ nội quy lớp", "Chuẩn bị sách vở từ tối hôm trước"] },
    behavior: { title: "Giao tiếp & Ứng xử", icon: "fa-comments", items: ["Chào hỏi lễ phép", "Ngôn ngữ văn minh", "Giúp đỡ bạn bè", "Lắng nghe ý kiến người khác", "Nói lời cảm ơn và xin lỗi", "Tôn trọng không gian riêng của bạn"] },
    home: { title: "Trách nhiệm tại nhà", icon: "fa-home", items: ["Tự giác việc nhà", "Góc học tập ngăn nắp", "Dậy sớm tập thể dục", "Đi ngủ đúng giờ", "Tự giặt đồ cá nhân", "Nấu 1 bữa ăn đơn giản/tuần"] }
  },
  personal: {
    exams: { title: "Chứng chỉ & Kỳ thi", icon: "fa-award", items: ["Thi KET/PET/FCE", "Toán quốc tế AMC", "Thi Tin học trẻ", "Olympic Tiếng Anh", "Luyện thi SAT/IELTS căn bản", "Thi học sinh giỏi cấp Quận/Thành phố"] },
    events: { title: "Hoạt động & Sự kiện", icon: "fa-star", items: ["Giải Tranh biện VBC 2026 (24-25/01)", "Sự kiện Sắc Xuân (06/02)", "Dã ngoại Trường Trung học (25/03)", "Thi Vòng 2 Học bổng Tài năng (16/05 – 17/05)", "Sự kiện S-space", "Biểu diễn văn nghệ", "Hội thao School Games", "Dự án Service Learning", "Tham gia dự án cộng đồng", "Trình bày tại Assembly"] },
    clubs: { title: "CLB & Hội nhóm", icon: "fa-users-cog", items: ["CLB Tranh biện", "CLB Robotics", "Đại sứ WFOM", "Hội đồng học sinh", "Tổ chức hoạt động ngoại khóa", "Leader dự án nhóm"] }
  }
};

const TEMPLATES = [
  { id: 'modern_card', name: 'Thẻ Hiện đại', class: 'bg-slate-900 text-white', bgColor: '#0f172a', secondaryColor: '1e293b', accentColor: '#fbbf24', fontFace: 'Arial', type: 'card', isLight: false },
  { id: 'minimal_indigo', name: 'Tối giản Indigo', class: 'bg-indigo-950 text-white', bgColor: '#1e1b4b', secondaryColor: '312e81', accentColor: '#818cf8', fontFace: 'Verdana', type: 'minimal', isLight: false },
  { id: 'academic_honor', name: 'Vinh danh Học thuật', class: 'bg-[#FAF9F6] text-[#451A03]', bgColor: '#FAF9F6', secondaryColor: 'FEF3C7', accentColor: '#92400E', fontFace: 'Times New Roman', type: 'honor', isLight: true }
];

const GoalReview: React.FC<GoalReviewProps> = ({ student, viewData: initialViewData, onBack, isTeacherView }) => {
  const [archives, setArchives] = useState<any[]>([]);
  const [selectedArchiveItem, setSelectedArchiveItem] = useState<any | null>(initialViewData || null);
  const [activeTab, setActiveTab] = useState<'set' | 'review'>(initialViewData?.type === 'REVIEW' ? 'review' : 'set');
  const [mode, setMode] = useState<'edit' | 'template_select' | 'preview' | 'list'>(initialViewData ? 'preview' : 'edit');
  const [step, setStep] = useState(1);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Core Data State
  const [phase, setPhase] = useState(initialViewData?.phase || PHASES[0]);
  const [targetScores, setTargetScores] = useState<Record<string, string>>(initialViewData?.data?.targetScores || {});
  const [actualScores, setActualScores] = useState<Record<string, string>>(initialViewData?.data?.actualScores || {});
  const [selectedHabits, setSelectedHabits] = useState<string[]>(Array.isArray(initialViewData?.data?.selectedHabits) ? initialViewData.data.selectedHabits : []);
  const [achievedHabits, setAchievedHabits] = useState<string[]>(Array.isArray(initialViewData?.data?.achievedHabits) ? initialViewData.data.achievedHabits : []);
  const [selectedTitles, setSelectedTitles] = useState<string[]>(Array.isArray(initialViewData?.data?.selectedTitles) ? initialViewData.data.selectedTitles : []);
  const [achievedTitles, setAchievedTitles] = useState<string[]>(Array.isArray(initialViewData?.data?.achievedTitles) ? initialViewData.data.achievedTitles : []);
  const [customGoals, setCustomGoals] = useState<Record<string, string>>(initialViewData?.data?.customGoals || { academic: "", academicAction: "", routine: "", routineAction: "", personal: "", personalAction: "" });
  
  const [subjectSolutions, setSubjectSolutions] = useState<Record<string, string>>(initialViewData?.data?.subjectSolutions || {});
  const [habitSolutions, setHabitSolutions] = useState<Record<string, string>>(initialViewData?.data?.habitSolutions || {});

  const [teacherFeedback, setTeacherFeedback] = useState(initialViewData?.data?.teacherFeedback || "");
  const [selectedTemplate, setSelectedTemplate] = useState(initialViewData?.data?.selectedTemplate || 'modern_card');
  const [previewScale, setPreviewScale] = useState(1);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const previewWrapperRef = useRef<HTMLDivElement>(null);

  const activeTpl = TEMPLATES.find(t => t.id === selectedTemplate) || TEMPLATES[0];
  
  // Logic Fix: Phân tách trạng thái khóa giao diện để học sinh có thể thực hiện review trên kế hoạch đã lưu
  const isReadOnly = isTeacherView || (!!initialViewData && (initialViewData.type === 'REVIEW' || activeTab === 'set'));

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(`archives_${student.id}`) || '[]');
    setArchives(stored);
  }, [student.id]);

  useEffect(() => {
    if (selectedArchiveItem) {
      const { phase: p, data, type } = selectedArchiveItem;
      setPhase(p || PHASES[0]);
      setActiveTab(type === 'REVIEW' ? 'review' : 'set');
      setTargetScores(data?.targetScores || {});
      setActualScores(data?.actualScores || {});
      setSelectedHabits(Array.isArray(data?.selectedHabits) ? data.selectedHabits : []);
      setAchievedHabits(Array.isArray(data?.achievedHabits) ? data.achievedHabits : []);
      setSelectedTitles(Array.isArray(data?.selectedTitles) ? data.selectedTitles : []);
      setAchievedTitles(Array.isArray(data?.achievedTitles) ? data.achievedTitles : []);
      setCustomGoals(data?.customGoals || { academic: "", academicAction: "", routine: "", routineAction: "", personal: "", personalAction: "" });
      setSubjectSolutions(data?.subjectSolutions || {});
      setHabitSolutions(data?.habitSolutions || {});
      setTeacherFeedback(data?.teacherFeedback || "");
      setSelectedTemplate(data?.selectedTemplate || 'modern_card');
      setMode('preview');
      setCurrentSlideIndex(0);
    }
  }, [selectedArchiveItem]);

  useEffect(() => {
    const updateScale = () => {
      if (previewWrapperRef.current) {
        const wrapperWidth = previewWrapperRef.current.offsetWidth;
        setPreviewScale(Math.min(1, (wrapperWidth - 40) / 1000));
      }
    };
    if (mode === 'preview') {
      updateScale();
      window.addEventListener('resize', updateScale);
      return () => window.removeEventListener('resize', updateScale);
    }
  }, [mode]);

  const praiseOptions = ["Tuyệt vời! Tiếp tục phát huy nhé.", "Làm tốt lắm!", "Con đã nỗ lực rất tốt.", "Kết quả rất đáng khen ngợi."];
  const getRandomPraise = () => praiseOptions[Math.floor(Math.random() * praiseOptions.length)];

  // AI Assistant for Teacher - Comprehensive Feedback Analysis
  const handleAiTeacherAssist = async () => {
    if (isAiThinking) return;
    setIsAiThinking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Bạn là Trợ lý AI Giáo viên chủ nhiệm tại Wellspring Hanoi International Bilingual School. 
        Hãy phân tích kỹ lưỡng dữ liệu mục tiêu và kết quả thực tế của học sinh ${student.fullName} để tạo một bản nhận xét toàn diện, chuyên sâu và mang tính giáo dục định hướng.

        DỮ LIỆU ĐẦU VÀO:
        - Mục tiêu điểm số: ${JSON.stringify(targetScores)}
        - Kết quả thực tế: ${JSON.stringify(actualScores)}
        - Danh hiệu đăng ký: ${JSON.stringify(selectedTitles)}
        - Danh hiệu đạt được: ${JSON.stringify(achievedTitles)}
        - Thói quen đăng ký: ${JSON.stringify(selectedHabits)}
        - Thói quen đã đạt: ${JSON.stringify(achievedHabits)}
        - Mục tiêu riêng & Kế hoạch hành động: ${JSON.stringify(customGoals)}
        - Giải pháp học sinh đề xuất: ${JSON.stringify(subjectSolutions)}

        YÊU CẦU PHẢN HỒI (THEO MẪU):
        1. Về học tập: Phân tích sự tiến bộ so với mục tiêu. Khen ngợi thế mạnh ở các môn (ví dụ ESL, Grammar nếu điểm cao). Chỉ ra các môn cần nỗ lực thêm (Toán, KHTN...). Gợi ý lộ trình cụ thể: dành thêm thời gian, nắm chắc kiến thức nền, rà soát lỗi sai trước khi nộp.
        2. Về nền nếp: Nhận xét về việc thực hiện thói quen kỷ luật, trách nhiệm tập thể, nội quy đồng phục và cách trao đổi văn minh với bạn bè.
        3. Về ngoại khóa, sự kiện: Ghi nhận sự chủ động tham gia các hoạt động (WISTalk, cuộc thi, văn nghệ...). Khuyến khích tham gia các sự kiện sắp tới (S-Space, Lễ hội Mùa xuân...) để ghi dấu ấn cá nhân.

        PHONG CÁCH:
        - Ngôn ngữ: Tiếng Việt, chuyên nghiệp, khích lệ nhưng thẳng thắn về điểm cần sửa.
        - Trình bày: Mỗi trụ cột bắt đầu bằng "Về [Tên trụ cột]:" và xuống dòng sau mỗi đoạn.
        - Độ dài: Khoảng 150-250 từ.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });

      const text = response.text;
      if (text) setTeacherFeedback(text.trim());
    } catch (error) {
      console.error("AI Assistant Error:", error);
      alert("Lỗi kết nối AI. Vui lòng thử lại sau.");
    } finally {
      setIsAiThinking(false);
    }
  };

  const isReviewValid = useMemo(() => {
    if (activeTab === 'set') return true;
    const allSubjects = [...SUBJECTS_INT, ...SUBJECTS_VN];
    for (const sub of allSubjects) {
      const target = targetScores[sub] || "";
      const actual = actualScores[sub] || "";
      if (!target) continue;
      if (actual === "" || actual === undefined) return false;
      let isFail = false;
      if (NON_NUMERIC_SUBJECTS.includes(sub)) {
        isFail = (target === "Đ" && actual === "CĐ");
      } else {
        const tNum = parseFloat(target || "0");
        const aNum = parseFloat(actual || "0");
        isFail = (tNum > 0 && aNum < tNum);
      }
      if (isFail && (!subjectSolutions[sub] || subjectSolutions[sub].trim().length === 0)) return false;
    }
    const allPillars: (keyof typeof SUGGESTIONS)[] = ['academic', 'routine', 'personal'];
    for (const pillar of allPillars) {
      const suggestions = Object.values(SUGGESTIONS[pillar]).flatMap(g => g.items);
      const plannedInPillar = (selectedHabits || []).filter(h => suggestions.includes(h));
      const customLines = (customGoals[pillar] || "").split('\n').filter((l: string) => l.trim() !== "");
      const allPlanned = [...plannedInPillar, ...customLines];
      for (const h of allPlanned) {
        if (!achievedHabits.includes(h)) {
          if (!habitSolutions[h] || habitSolutions[h].trim().length === 0) return false;
        }
      }
    }
    return true;
  }, [activeTab, targetScores, actualScores, subjectSolutions, selectedHabits, achievedHabits, habitSolutions, customGoals]);

  const toggleHabit = (h: string) => { 
    if (isReadOnly) return; 
    if (activeTab === 'review') {
      const isAchieved = achievedHabits.includes(h);
      if (!isAchieved) {
        setAchievedHabits(prev => [...prev, h]);
        setHabitSolutions(prev => ({ ...prev, [h]: getRandomPraise() }));
      } else {
        setAchievedHabits(prev => prev.filter(x => x !== h));
        setHabitSolutions(prev => ({ ...prev, [h]: "" }));
      }
    } else {
      setSelectedHabits(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
    }
  };
  
  const toggleTitle = (t: string) => { 
    if (isReadOnly) return; 
    if (activeTab === 'review') {
      setAchievedTitles(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
    } else {
      setSelectedTitles(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]); 
    }
  };

  const startReviewFromPlan = (plan: any) => {
    setPhase(plan.phase);
    setTargetScores(plan.data.targetScores || {});
    setSelectedHabits(Array.isArray(plan.data.selectedHabits) ? plan.data.selectedHabits : []);
    setSelectedTitles(Array.isArray(plan.data.selectedTitles) ? plan.data.selectedTitles : []);
    setCustomGoals(plan.data.customGoals || { academic: "", academicAction: "", routine: "", routineAction: "", personal: "", personalAction: "" });
    setActualScores({});
    setAchievedHabits([]);
    setAchievedTitles([]);
    setSubjectSolutions({});
    setHabitSolutions({});
    setStep(1);
    setMode('edit');
  };

  const handleSaveToPortfolio = () => {
    if (activeTab === 'review' && !isReviewValid && !isTeacherView) {
      alert("Vui lòng nhập đầy đủ thực tế và giải pháp cho các mục chưa đạt.");
      return;
    }
    const archiveTitle = isTeacherView 
      ? `[GVCN] Phản hồi ${activeTab === 'set' ? 'mục tiêu' : 'đánh giá'} - ${phase}` 
      : (activeTab === 'set' ? `Mục tiêu Insight - ${phase}` : `Tự đánh giá REVIEW - ${phase}`);

    const archiveItem = {
      id: isTeacherView ? `teacher-${Date.now()}` : (selectedArchiveItem?.id || `student-${Date.now()}`),
      title: archiveTitle,
      type: activeTab === 'set' ? 'PLAN' : 'REVIEW',
      phase,
      author: isTeacherView ? 'Giáo viên chủ nhiệm' : 'Học sinh',
      date: new Date().toLocaleDateString('vi-VN'),
      data: { 
        targetScores, actualScores, 
        selectedHabits, achievedHabits, 
        selectedTitles, achievedTitles,
        customGoals, subjectSolutions, habitSolutions,
        selectedTemplate, teacherFeedback 
      }
    };

    let currentArchives = JSON.parse(localStorage.getItem(`archives_${student.id}`) || '[]');
    if (isTeacherView) {
      currentArchives = [archiveItem, ...currentArchives];
    } else {
      if (selectedArchiveItem && !selectedArchiveItem.id.startsWith('teacher-')) {
        currentArchives = currentArchives.map((a: any) => a.id === selectedArchiveItem.id ? archiveItem : a);
      } else {
        currentArchives = [archiveItem, ...currentArchives];
      }
    }
    localStorage.setItem(`archives_${student.id}`, JSON.stringify(currentArchives));
    setArchives(currentArchives);
    alert("✨ Hồ sơ Insight 360 đã được lưu thành công!");
    setSelectedArchiveItem(null);
    setMode('list');
  };

  const processedSlides = useMemo(() => {
    const data = selectedArchiveItem?.data || { 
      selectedHabits, achievedHabits, 
      customGoals, subjectSolutions, habitSolutions, 
      selectedTitles, achievedTitles,
      targetScores, actualScores,
      teacherFeedback 
    };
    const allSlides: any[] = [{ id: 'cover', type: 'cover', title: 'Trang bìa' }];

    const titlesToDisplay = Array.from(new Set([...(Array.isArray(data.selectedTitles) ? data.selectedTitles : []), ...(Array.isArray(data.achievedTitles) ? data.achievedTitles : [])]));
    if (titlesToDisplay.length > 0) {
      allSlides.push({ 
        id: 'titles', 
        type: 'titles', 
        title: activeTab === 'review' ? 'Kết quả Danh hiệu' : 'Danh hiệu hướng tới', 
        items: titlesToDisplay,
        targets: Array.isArray(data.selectedTitles) ? data.selectedTitles : [],
        achieved: Array.isArray(data.achievedTitles) ? data.achievedTitles : []
      });
    }

    const hasScores = Object.values(data.targetScores || {}).some(s => s) || Object.values(data.actualScores || {}).some(s => s);
    if (hasScores) {
      allSlides.push({ id: 'scores', type: 'scores', title: activeTab === 'review' ? 'Kết quả thực tế' : 'Mục tiêu điểm số' });
    }

    const cats = [
      { id: 'academic', title: 'I. Học tập', icon: 'fa-graduation-cap' },
      { id: 'routine', title: 'II. Nề nếp', icon: 'fa-tasks' },
      { id: 'personal', title: 'III. Cá nhân', icon: 'fa-star' }
    ] as const;

    cats.forEach(cat => {
      const suggestions = Object.values(SUGGESTIONS[cat.id as keyof typeof SUGGESTIONS]).flatMap(g => g.items);
      const habits = [
        ...((Array.isArray(data.selectedHabits) ? data.selectedHabits : []).filter((h: string) => suggestions.includes(h))),
        ...((data.customGoals?.[cat.id] || "").split('\n').filter((l: string) => l.trim() !== ""))
      ];
      const actionText = data.customGoals?.[`${cat.id}Action`] || "";

      if (habits.length > 0 || actionText.trim()) {
        const CHUNK_SIZE = 6;
        for (let i = 0; i < habits.length; i += CHUNK_SIZE) {
          allSlides.push({
            id: `${cat.id}-part-${i}`,
            type: 'pillar',
            category: cat.id,
            title: i === 0 ? cat.title : `${cat.title} (Tiếp theo)`,
            habits: habits.slice(i, i + CHUNK_SIZE),
            achieved: Array.isArray(data.achievedHabits) ? data.achievedHabits : [],
            habitSolutions: data.habitSolutions || {},
            action: actionText,
            icon: cat.icon,
            isFirstPart: i === 0
          });
        }
      }
    });

    if (data.teacherFeedback) allSlides.push({ id: 'feedback', type: 'feedback', title: 'Phản hồi từ GVCN', content: data.teacherFeedback });
    return { slides: allSlides, data };
  }, [selectedHabits, achievedHabits, customGoals, subjectSolutions, habitSolutions, selectedTitles, achievedTitles, targetScores, actualScores, teacherFeedback, selectedArchiveItem, activeTab]);

  const handleExportPPTX = async () => {
    if (activeTab === 'review' && !isReviewValid && !isTeacherView) return alert("Vui lòng hoàn thành đầy đủ nội dung review.");
    if (typeof PptxGenJS === 'undefined') return alert("Lỗi tải thư viện PptxGenJS.");
    try {
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_16x9';
      const { slides, data } = processedSlides;
      const tpl = activeTpl;

      slides.forEach(slideData => {
        const slide = pptx.addSlide();
        slide.background = { color: tpl.bgColor.replace('#', '') };
        if (slideData.type === 'cover') {
          slide.addText(activeTab === 'review' ? "BẢN TỰ ĐÁNH GIÁ" : "MỤC TIÊU NĂM HỌC", { x: 0, y: 1.8, w: '100%', fontSize: 44, bold: true, color: tpl.accentColor, align: 'center', fontFace: tpl.fontFace });
          slide.addText(student.fullName.toUpperCase(), { x: 0, y: 3.0, w: '100%', fontSize: 32, bold: true, color: tpl.isLight ? '222222' : 'FFFFFF', align: 'center' });
          slide.addText(`Học sinh lớp ${student.class} | ${phase}`, { x: 0, y: 4.0, w: '100%', fontSize: 18, color: tpl.accentColor, align: 'center' });
        } else if (slideData.type === 'titles') {
          slide.addText(slideData.title, { x: 0.5, y: 0.5, w: 9, fontSize: 32, bold: true, color: tpl.accentColor });
          slideData.items.forEach((item: string, idx: number) => {
            const isAch = Array.isArray(slideData.achieved) && slideData.achieved.includes(item);
            const isTarget = Array.isArray(slideData.targets) && slideData.targets.includes(item);
            slide.addText(`${isAch ? '✓' : '★'} ${item}${isTarget ? ' (Mục tiêu)' : ''}`, { x: 0.8, y: 1.5 + (idx * 0.55), w: 8, fontSize: 18, color: isAch ? '10B981' : (tpl.isLight ? '333333' : 'FFFFFF'), bold: true });
          });
        } else if (slideData.type === 'scores') {
          slide.addText(slideData.title, { x: 0.5, y: 0.5, w: 9, fontSize: 28, bold: true, color: tpl.accentColor });
          const isPlan = activeTab === 'set';
          const headers = isPlan ? ["Môn học", "Mục tiêu"] : ["Môn học", "Mục tiêu", "Thực tế", "Giải pháp/Lời khen"];
          const filteredSubs = [...SUBJECTS_INT, ...SUBJECTS_VN].filter(s => data.targetScores[s]);
          const rows = filteredSubs.map(s => {
            const row = [s, data.targetScores[s] || "-"];
            if (!isPlan) {
              row.push(data.actualScores?.[s] || "-");
              row.push(data.subjectSolutions?.[s] || "-");
            }
            return row;
          });
          slide.addTable([headers, ...rows], { x: 0.25, y: 1.2, w: 9.5, color: tpl.isLight ? '000000' : 'FFFFFF', fill: { color: tpl.secondaryColor }, border: { color: '444444', pt: 0.5 }, fontSize: isPlan ? 14 : 9, align: 'center', autoSize: true });
        } else if (slideData.type === 'pillar') {
          slide.addText(slideData.title, { x: 0.5, y: 0.4, w: 9, fontSize: 26, bold: true, color: tpl.accentColor });
          slide.addText(activeTab === 'review' ? "KẾT QUẢ THỰC HIỆN" : "MỤC TIÊU & THÓI QUEN", { x: 0.5, y: 1.0, w: 4.4, fontSize: 14, bold: true, color: tpl.accentColor });
          slideData.habits.forEach((h: string, i: number) => {
            const isDone = Array.isArray(slideData.achieved) && slideData.achieved.includes(h);
            const sol = slideData.habitSolutions?.[h] || "";
            const prefix = activeTab === 'review' ? (isDone ? '✓' : '○') : '○';
            const color = activeTab === 'review' && isDone ? '10B981' : (tpl.isLight ? '000000' : 'FFFFFF');
            slide.addText(`${prefix} ${h}`, { x: 0.6, y: 1.4 + (i * (activeTab === 'review' ? 0.55 : 0.45)), w: 4.2, fontSize: 11, bold: activeTab === 'review' && isDone, color: color });
            if (activeTab === 'review' && !isDone && sol) {
                slide.addText(`-> ${sol}`, { x: 0.8, y: 1.7 + (i * 0.55), w: 4, fontSize: 9, italic: true, color: '92400E' });
            }
          });
          if (slideData.isFirstPart) {
            slide.addText(activeTab === 'review' ? "LỘ TRÌNH ĐÃ LẬP" : "LỘ TRÌNH THỰC HIỆN", { x: 5.1, y: 1.0, w: 4.4, fontSize: 14, bold: true, color: '10B981' });
            slide.addText(slideData.action || "Chưa cập nhật...", { x: 5.1, y: 1.4, w: 4.4, h: 3.5, fontSize: 11, color: tpl.isLight ? '333333' : 'FFFFFF', fill: { color: tpl.secondaryColor }, valign: 'top', margin: 10 });
          }
        } else if (slideData.type === 'feedback') {
          slide.addText(slideData.title, { x: 0, y: 1.0, w: '100%', fontSize: 28, bold: true, color: tpl.accentColor, align: 'center' });
          slide.addText(`"${slideData.content}"`, { x: 1, y: 2.0, w: 8, h: 3, fontSize: 20, color: tpl.isLight ? '333333' : 'FFFFFF', italic: true, align: 'center', valign: 'middle' });
        }
      });
      pptx.writeFile({ fileName: `Insight360_${student.fullName}_Portfolio.pptx` });
    } catch (e) { 
      console.error(e);
      alert("Lỗi xuất file. Vui lòng kiểm tra lại trình duyệt."); 
    }
  };

  const renderSubjectInput = (subjects: string[], title: string, colorClass: string) => (
    <div className="space-y-4">
      <p className={`text-[11px] font-black uppercase border-b pb-2 tracking-widest ${colorClass}`}>{title}</p>
      <div className="space-y-2">
        {subjects.map(s => {
          const isNumeric = !NON_NUMERIC_SUBJECTS.includes(s);
          const target = targetScores[s] || "";
          const actual = actualScores[s] || "";
          let isFailed = false;
          if (activeTab === 'review' && target !== "" && actual !== "") {
            isFailed = isNumeric ? parseFloat(actual) < parseFloat(target) : (target === "Đ" && actual === "CĐ");
          }

          return (
            <div key={s} className="bg-white/5 p-3 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center gap-4">
              <span className="text-[10px] font-bold w-full md:w-32 text-white">{s}</span>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="flex flex-col">
                  <span className="text-[8px] opacity-40 uppercase text-white">Mục tiêu</span>
                  {isNumeric ? (
                    <input type="text" readOnly={isTeacherView || !!initialViewData} value={target} onChange={e => setTargetScores({...targetScores, [s]: e.target.value})} className={`bg-[#1A2A6C] w-16 text-center text-xs p-1.5 rounded-lg border border-white/10 text-white font-bold outline-none ${isTeacherView ? 'opacity-60 cursor-not-allowed' : ''}`} />
                  ) : (
                    <select disabled={isTeacherView || !!initialViewData} value={target} onChange={e => setTargetScores({...targetScores, [s]: e.target.value})} className={`bg-[#1A2A6C] w-16 text-center text-[10px] p-1.5 rounded-lg border border-white/10 text-white font-bold outline-none ${isTeacherView ? 'opacity-60 cursor-not-allowed' : ''}`}>
                      <option value="">--</option>
                      <option value="Đ">Đ</option>
                      <option value="CĐ">CĐ</option>
                    </select>
                  )}
                </div>
                {activeTab === 'review' && (
                  <div className="flex flex-col">
                    <span className="text-[8px] opacity-40 uppercase text-white">Thực tế</span>
                    {isNumeric ? (
                      <input type="text" readOnly={isReadOnly} value={actual} onChange={e => {
                          const val = e.target.value;
                          setActualScores({...actualScores, [s]: val});
                          if (val !== "" && target !== "" && parseFloat(val) >= parseFloat(target) && parseFloat(target) > 0) {
                            if (!subjectSolutions[s]) setSubjectSolutions(prev => ({ ...prev, [s]: getRandomPraise() }));
                          }
                        }} className={`bg-[#1A2A6C] w-16 text-center text-xs p-1.5 rounded-lg border font-bold outline-none transition-all ${isFailed ? 'border-red-500 text-red-400' : 'border-emerald-500/30 text-emerald-400'} ${isTeacherView ? 'opacity-60 cursor-not-allowed' : ''}`} />
                    ) : (
                      <select disabled={isReadOnly} value={actual} onChange={e => {
                          const val = e.target.value;
                          setActualScores({...actualScores, [s]: val});
                          if (val !== "" && target === "Đ" && val === "Đ") {
                            if (!subjectSolutions[s]) setSubjectSolutions(prev => ({ ...prev, [s]: getRandomPraise() }));
                          }
                        }} className={`bg-[#1A2A6C] w-16 text-center text-[10px] p-1.5 rounded-lg border font-bold outline-none transition-all ${isFailed ? 'border-red-500 text-red-400' : 'border-emerald-500/30 text-emerald-400'} ${isTeacherView ? 'opacity-60 cursor-not-allowed' : ''}`}>
                        <option value="">--</option>
                        <option value="Đ">Đ</option>
                        <option value="CĐ">CĐ</option>
                      </select>
                    )}
                  </div>
                )}
              </div>
              {activeTab === 'review' && actual !== "" && (
                <div className="flex-1 w-full animate-fade-in">
                  <span className={`text-[8px] uppercase font-black ${isFailed ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isFailed ? '* Giải pháp khắc phục (Bắt buộc)' : 'Ghi chú / Lời khen'}
                  </span>
                  <input type="text" readOnly={isReadOnly} value={subjectSolutions[s] || ""} onChange={e => setSubjectSolutions({...subjectSolutions, [s]: e.target.value})} placeholder={isFailed ? "Con sẽ nỗ lực như thế nào?..." : "Làm tốt lắm!"} className={`w-full bg-white/5 border rounded-xl py-2 px-4 text-xs mt-1 outline-none transition-all ${isFailed && !subjectSolutions[s] ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-yellow-400 text-white'} ${isTeacherView ? 'opacity-60 cursor-not-allowed' : ''}`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGoalInputs = (category: 'academic' | 'routine' | 'personal') => {
    if (activeTab === 'review') return null;
    const accent = category === 'academic' ? 'border-yellow-400' : category === 'routine' ? 'border-emerald-400' : 'border-indigo-400';
    const labelColor = category === 'academic' ? 'text-yellow-400' : category === 'routine' ? 'text-emerald-400' : 'text-indigo-400';
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5 mt-6">
        <div className="space-y-3">
          <label className={`text-[10px] font-black uppercase flex items-center tracking-widest ${labelColor}`}>
            <i className="fas fa-bullseye mr-2"></i> Mục tiêu riêng của con
          </label>
          <textarea readOnly={isReadOnly} value={customGoals[category]} onChange={e => setCustomGoals({...customGoals, [category]: e.target.value})} className={`w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white outline-none min-h-[140px] focus:${accent} transition-all placeholder:opacity-20 ${isTeacherView ? 'opacity-60 cursor-not-allowed' : ''}`} placeholder="Mỗi dòng là 1 mục tiêu..." />
        </div>
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-emerald-400 flex items-center tracking-widest">
            <i className="fas fa-running mr-2"></i> Kế hoạch hành động chi tiết
          </label>
          <textarea readOnly={isReadOnly} value={customGoals[`${category}Action`]} onChange={e => setCustomGoals({...customGoals, [`${category}Action`] : e.target.value})} className={`w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white outline-none min-h-[140px] focus:border-emerald-400 transition-all font-medium leading-relaxed placeholder:opacity-20 italic ${isTeacherView ? 'opacity-60 cursor-not-allowed' : ''}`} placeholder="Con sẽ làm gì để đạt được mục tiêu?..." />
        </div>
      </div>
    );
  };

  const renderPillarReview = (category: keyof typeof SUGGESTIONS) => {
    const suggestions = Object.values(SUGGESTIONS[category]).flatMap(g => g.items);
    const plannedFromSuggestions = (selectedHabits || []).filter(h => suggestions.includes(h));
    const customLines = (customGoals[category] || "").split('\n').filter((l: string) => l.trim() !== "");
    const allGoals = [...plannedFromSuggestions, ...customLines];
    return (
      <div className="space-y-6">
        <p className="text-[11px] font-black uppercase opacity-60 tracking-widest border-b border-white/10 pb-2 text-white">{category === 'academic' ? 'Học tập & Thói quen' : category === 'routine' ? 'Nề nếp & Kỷ luật' : 'Phát triển Cá nhân'}</p>
        <div className="space-y-4">
          {allGoals.length > 0 ? allGoals.map((h, idx) => {
            const isAchieved = achievedHabits.includes(h);
            return (
              <div key={idx} className="bg-white/5 p-4 rounded-3xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => toggleHabit(h)} disabled={isReadOnly} className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isAchieved ? 'bg-emerald-500 border-emerald-500 text-navy' : 'border-white/20'} ${isTeacherView ? 'cursor-not-allowed opacity-60' : ''}`}>
                      {isAchieved && <i className="fas fa-check text-[10px]"></i>}
                    </button>
                    <span className={`text-sm font-bold ${isAchieved ? 'text-emerald-400' : 'text-white/60'}`}>{h}</span>
                  </div>
                  <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${isAchieved ? 'bg-emerald-400/10 text-emerald-400' : 'bg-red-400/10 text-red-400'}`}>{isAchieved ? 'Đã đạt' : 'Chưa đạt'}</span>
                </div>
                {!isAchieved && (
                  <div className="animate-fade-in pl-9">
                    <label className="text-[9px] font-black uppercase text-red-400 mb-1 block">* Giải pháp khắc phục (Bắt buộc)</label>
                    <input type="text" readOnly={isReadOnly} value={habitSolutions[h] || ""} onChange={e => setHabitSolutions({...habitSolutions, [h]: e.target.value})} className={`w-full bg-red-400/5 border rounded-xl py-2 px-4 text-xs italic outline-none ${!habitSolutions[h] ? 'border-red-500/40' : 'border-white/20'} text-white ${isTeacherView ? 'opacity-60 cursor-not-allowed' : ''}`} placeholder="Giải pháp khắc phục..." />
                  </div>
                )}
                {isAchieved && habitSolutions[h] && (
                   <div className="pl-9 opacity-50 italic text-[10px] text-emerald-400">Ghi nhận: {habitSolutions[h]}</div>
                )}
              </div>
            );
          }) : (
            <p className="text-[10px] opacity-40 italic text-white">Không có thói quen nào trong bản kế hoạch.</p>
          )}
        </div>
        <div className="pt-4 border-t border-white/5">
           <label className="text-[10px] font-black uppercase text-emerald-400 flex items-center tracking-widest mb-2"><i className="fas fa-running mr-2"></i> Kế hoạch hành động gốc</label>
           <div className="p-4 bg-white/5 rounded-2xl border border-white/5 italic text-sm text-white/70">{customGoals[`${category}Action`] || "Chưa cập nhật lộ trình..."}</div>
        </div>
      </div>
    );
  };

  const renderWizard = () => {
    const hasPlanData = (selectedHabits || []).length > 0 || Object.values(targetScores).some(s => s) || Object.values(customGoals).some((g: string) => g.trim().length > 0);
    if (activeTab === 'review' && !hasPlanData && mode === 'edit') {
      const plans = archives.filter(a => a.type === 'PLAN');
      return (
        <div className="space-y-8 py-20 text-center max-w-4xl mx-auto">
          <i className="fas fa-history text-6xl text-emerald-400/30 mb-6"></i>
          <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">Chọn bản Kế hoạch để Review</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
            {plans.map(p => (
              <div key={p.id} onClick={() => startReviewFromPlan(p)} className="glass p-8 rounded-[3rem] border border-white/10 hover:border-emerald-400 cursor-pointer transition-all text-left group">
                <p className="text-[10px] font-black text-emerald-400 uppercase mb-2">{p.phase}</p>
                <h4 className="font-black text-xl text-white uppercase group-hover:text-emerald-400">{p.title}</h4>
                <p className="text-[9px] opacity-40 mt-4 font-bold text-white">{p.date}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 pb-32 max-w-6xl mx-auto">
        <div className="flex items-center space-x-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= s ? (activeTab === 'review' ? 'bg-emerald-400' : 'bg-yellow-400') : 'bg-white/10'}`}></div>
          ))}
        </div>
        {step === 1 && (
          <div className="space-y-6 animate-slide-up">
            <GlassCard className={`border-l-4 ${activeTab === 'review' ? 'border-l-emerald-400' : 'border-l-yellow-400'}`}>
              <h4 className="text-sm font-black uppercase mb-8 flex justify-between items-center text-white">
                <span>Trụ cột I: Học tập (Academic)</span>
                <span className="opacity-40 text-[10px]">{phase}</span>
              </h4>
              {activeTab === 'set' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    {renderSubjectInput(SUBJECTS_INT, "Mục tiêu Quốc tế", "text-blue-400")}
                    {renderSubjectInput(SUBJECTS_VN, "Mục tiêu Việt Nam", "text-emerald-400")}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase opacity-60 mb-4 tracking-widest text-center text-white">Gợi ý thói quen thông minh</p>
                    <div className="space-y-6">
                      {Object.values(SUGGESTIONS.academic).map(group => (
                        <div key={group.title} className="space-y-2">
                          <p className="text-[9px] font-black text-blue-400 uppercase">{group.title}</p>
                          <div className="flex flex-wrap gap-1">
                            {group.items.map(h => (
                              <button key={h} disabled={isReadOnly} onClick={() => toggleHabit(h)} className={`px-2 py-1 rounded-lg text-[8px] font-bold border transition-all ${selectedHabits.includes(h) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 border-white/10 opacity-40 text-white'} ${isTeacherView ? 'cursor-not-allowed' : ''}`}>{h}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-10">
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {renderSubjectInput(SUBJECTS_INT, "Review Quốc tế", "text-blue-400")}
                    {renderSubjectInput(SUBJECTS_VN, "Review Việt Nam", "text-emerald-400")}
                  </div>
                  {renderPillarReview('academic')}
                </div>
              )}
              {renderGoalInputs('academic')}
            </GlassCard>
            <div className="flex justify-end pt-4"><button onClick={() => setStep(2)} className="bg-emerald-600 px-10 py-3 rounded-xl font-black uppercase text-xs text-white">Bước tiếp theo</button></div>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            <GlassCard className={`border-l-4 ${activeTab === 'review' ? 'border-l-emerald-400' : 'border-l-emerald-400'}`}>
               <h4 className="text-sm font-black uppercase mb-8 text-white">Trụ cột II: Nề nếp & Kỷ luật (Routine)</h4>
               {activeTab === 'review' ? (
                 <div className="space-y-8">{renderPillarReview('routine')}</div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {Object.values(SUGGESTIONS.routine).map(g => (
                     <div key={g.title} className="space-y-3">
                       <p className="text-[10px] font-black text-emerald-400 uppercase"><i className={`fas ${g.icon} mr-2`}></i>{g.title}</p>
                       <div className="space-y-1">
                         {g.items.map(h => (
                           <button key={h} disabled={isReadOnly} onClick={() => toggleHabit(h)} className={`w-full p-2.5 rounded-xl text-left text-[9px] font-bold border transition-all ${selectedHabits.includes(h) ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-white/5 border-white/10 opacity-40 text-white'} ${isTeacherView ? 'cursor-not-allowed' : ''}`}>{h}</button>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
               {renderGoalInputs('routine')}
            </GlassCard>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="text-white/50 uppercase font-black text-xs">Quay lại</button>
              <button onClick={() => setStep(3)} className="bg-indigo-600 px-10 py-3 rounded-xl font-black uppercase text-xs text-white">Bước tiếp theo</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-6 animate-slide-up">
            <GlassCard className={`border-l-4 ${activeTab === 'review' ? 'border-l-indigo-400' : 'border-l-indigo-400'}`}>
               <h4 className="text-sm font-black uppercase mb-8 text-white">Trụ cột III: Cá nhân & Danh hiệu (Personal)</h4>
               <div className="mb-10">
                 <p className="text-[10px] font-black uppercase text-yellow-400 mb-4 tracking-widest">{activeTab === 'review' ? 'Đánh giá kết quả Danh hiệu' : 'Danh hiệu hướng tới'}</p>
                 <div className="flex flex-wrap gap-2">
                   {ACHIEVEMENTS.map(title => {
                     const isTarget = Array.isArray(selectedTitles) && selectedTitles.includes(title);
                     const isSelected = activeTab === 'review' 
                        ? (Array.isArray(achievedTitles) ? achievedTitles.includes(title) : false) 
                        : (Array.isArray(selectedTitles) ? selectedTitles.includes(title) : false);
                     
                     return (
                       <div key={title} className="relative">
                         <button 
                           disabled={isReadOnly} 
                           onClick={() => toggleTitle(title)} 
                           className={`px-4 py-3 rounded-xl text-[10px] font-black border transition-all flex flex-col items-center gap-1 ${isSelected ? (activeTab === 'review' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-yellow-400 text-navy border-yellow-400 shadow-lg') : 'bg-white/5 border-white/10 opacity-40 text-white'} ${isTeacherView ? 'cursor-not-allowed' : ''}`}
                         >
                           {title}
                           {activeTab === 'review' && isTarget && (
                             <span className="bg-navy/40 text-[7px] font-black uppercase px-1.5 py-0.5 rounded-md border border-white/10">Mục tiêu</span>
                           )}
                         </button>
                       </div>
                     );
                   })}
                 </div>
               </div>
               {activeTab === 'review' ? (
                 <div className="space-y-8">{renderPillarReview('personal')}</div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                   {Object.values(SUGGESTIONS.personal).map(g => (
                     <div key={g.title} className="space-y-3">
                       <p className="text-[10px] font-black text-indigo-400 uppercase"><i className={`fas ${g.icon} mr-2`}></i>{g.title}</p>
                       <div className="space-y-1">
                         {g.items.map(h => (
                           <button key={h} disabled={isReadOnly} onClick={() => toggleHabit(h)} className={`w-full p-2.5 rounded-xl text-left text-[9px] font-bold border transition-all ${selectedHabits.includes(h) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 opacity-40 text-white'} ${isTeacherView ? 'cursor-not-allowed' : ''}`}>{h}</button>
                         ))}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
               {renderGoalInputs('personal')}
            </GlassCard>
            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="text-white/50 uppercase font-black text-xs">Quay lại</button>
              <button onClick={() => isReviewValid && setMode('template_select')} className={`px-12 py-4 rounded-2xl font-black uppercase text-xs shadow-2xl transition-all ${isReviewValid ? 'bg-yellow-400 text-navy hover:scale-105' : 'bg-white/10 text-white/20 cursor-not-allowed opacity-50'}`}>Xem Preview</button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderArchiveSelector = () => {
    const plans = archives.filter(a => a.type === 'PLAN');
    const reviews = archives.filter(a => a.type === 'REVIEW');
    return (
      <div className="space-y-10 py-10 animate-fade-in max-w-5xl mx-auto">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Lưu trữ <span className="text-yellow-400">Insight 360</span></h2>
          <p className="opacity-60 text-sm font-medium uppercase tracking-[0.2em] text-white">Hành trình mục tiêu và tự đánh giá của con</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic text-yellow-400 flex items-center"><i className="fas fa-map-marked-alt mr-3"></i> Kế hoạch mục tiêu</h3>
            <div className="space-y-4">
              {plans.length > 0 ? plans.map(p => (
                <div key={p.id} onClick={() => setSelectedArchiveItem(p)} className="glass p-6 rounded-3xl border border-white/10 hover:border-yellow-400 cursor-pointer transition-all group relative overflow-hidden">
                  <p className="text-[10px] font-black text-yellow-400 uppercase mb-1">{p.phase}</p>
                  <h4 className="font-black text-lg text-white uppercase group-hover:text-yellow-400 transition-colors">{p.title}</h4>
                  <div className="flex justify-between items-center mt-6"><span className="text-[9px] opacity-40 font-bold uppercase text-white">{p.date}</span><span className="text-[9px] font-black uppercase text-white/40">Xem chi tiết <i className="fas fa-chevron-right ml-1"></i></span></div>
                </div>
              )) : <div className="p-10 border-2 border-dashed border-white/10 rounded-3xl text-center opacity-30 italic text-sm text-white">Chưa có kế hoạch nào</div>}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic text-emerald-400 flex items-center"><i className="fas fa-clipboard-check mr-3"></i> Bản tự đánh giá</h3>
            <div className="space-y-4">
              {reviews.length > 0 ? reviews.map(r => (
                <div key={r.id} onClick={() => setSelectedArchiveItem(r)} className="glass p-6 rounded-3xl border border-white/10 hover:border-emerald-400 cursor-pointer transition-all group relative overflow-hidden">
                  <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">{r.phase}</p>
                  <h4 className="font-black text-lg text-white uppercase group-hover:text-emerald-400 transition-colors">{r.title}</h4>
                  <div className="flex justify-between items-center mt-6"><span className="text-[9px] opacity-40 font-bold uppercase text-white">{r.date}</span><span className="text-[9px] font-black uppercase text-white/40">Xem chi tiết <i className="fas fa-chevron-right ml-1"></i></span></div>
                </div>
              )) : <div className="p-10 border-2 border-dashed border-white/10 rounded-3xl text-center opacity-30 italic text-sm text-white">Chưa có bản đánh giá nào</div>}
            </div>
          </div>
        </div>
        {!isTeacherView && (
          <div className="flex justify-center pt-10">
            <button onClick={() => { setMode('edit'); setStep(1); setTargetScores({}); setActualScores({}); setSelectedHabits([]); setAchievedHabits([]); setSubjectSolutions({}); setHabitSolutions({}); setSelectedArchiveItem(null); setAchievedTitles([]); setSelectedTitles([]); setCustomGoals({ academic: "", academicAction: "", routine: "", routineAction: "", personal: "", personalAction: "" }); }} className="bg-white/10 hover:bg-white/20 text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all shadow-xl"><i className="fas fa-plus-circle mr-2"></i> Tạo lộ trình mới</button>
          </div>
        )}
      </div>
    );
  };

  if (mode === 'template_select') {
    return (
      <div className="space-y-8 animate-fade-in py-10 max-w-6xl mx-auto">
        <h2 className="text-4xl font-black text-center text-white italic uppercase tracking-tighter">Bố cục báo cáo</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
          {TEMPLATES.map(t => (
            <div key={t.id} onClick={() => { setSelectedTemplate(t.id); setMode('preview'); }} className={`glass rounded-[2rem] p-4 border-2 cursor-pointer transition-all ${selectedTemplate === t.id ? 'border-yellow-400 scale-105 shadow-2xl' : 'border-white/10 opacity-60'}`}><div className={`${t.class} w-full aspect-video rounded-xl flex items-center justify-center font-black uppercase text-[10px] text-center p-4 shadow-inner`}>{t.name}</div></div>
          ))}
        </div>
        <div className="flex justify-center pt-8"><button onClick={() => setMode('edit')} className="text-white/50 text-xs font-black uppercase">Quay lại sửa dữ liệu</button></div>
      </div>
    );
  }

  if (selectedArchiveItem || mode === 'preview') {
    const { slides, data } = processedSlides;
    const s = slides[currentSlideIndex];
    const isTplLight = activeTpl.isLight;
    return (
      <div className="space-y-6 animate-fade-in pb-32 max-w-6xl mx-auto text-white">
        <div className="flex flex-wrap justify-between items-center bg-white/5 p-4 rounded-3xl border border-white/10 shadow-xl gap-4">
          {!isTeacherView && <button onClick={() => { setMode('edit'); setSelectedArchiveItem(null); }} className="px-6 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase text-white tracking-widest">Sửa dữ liệu</button>}
          <div className="flex gap-3">
             <button disabled={activeTab === 'review' && !isReviewValid && !isTeacherView} onClick={handleSaveToPortfolio} className={`${isTeacherView ? 'bg-orange-600' : 'bg-emerald-600'} px-6 py-2 rounded-xl text-[10px] font-black uppercase text-white shadow-xl hover:scale-105 transition-all disabled:opacity-20`}>{isTeacherView ? 'Lưu phản hồi' : 'Lưu hồ sơ'}</button>
             <button onClick={handleExportPPTX} className="bg-orange-500 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-xl flex items-center hover:scale-105 transition-all"><i className="fas fa-file-powerpoint mr-2"></i>Tải Báo cáo</button>
          </div>
        </div>
        {isTeacherView && (
          <GlassCard className="border-l-4 border-l-orange-500 shadow-2xl animate-slide-up relative">
            <div className="flex justify-between items-center mb-4">
               <h4 className="text-sm font-black uppercase text-orange-400">GVCN Nhận xét & Đánh giá (AI Hỗ trợ)</h4>
               <button onClick={handleAiTeacherAssist} disabled={isAiThinking} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-lg ${isAiThinking ? 'bg-gray-600' : 'bg-blue-600 hover:scale-105 shadow-blue-500/20'}`}>
                 <i className={`fas ${isAiThinking ? 'fa-spinner fa-spin' : 'fa-robot'}`}></i>
                 {isAiThinking ? 'AI Đang Phân Tích...' : 'AI Trợ Lý Nhận Xét'}
               </button>
            </div>
            <textarea value={teacherFeedback} onChange={e => setTeacherFeedback(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white min-h-[160px] outline-none italic transition-all focus:border-orange-500 font-medium leading-relaxed" placeholder="GVCN ghi nhận xét chi tiết cho từng trụ cột hoặc dùng trợ lý AI phía trên..." />
          </GlassCard>
        )}
        <div className="flex flex-col items-center">
           <div className="flex items-center space-x-6 mb-8 text-white">
              <button onClick={() => setCurrentSlideIndex(v => Math.max(0, v-1))} disabled={currentSlideIndex === 0} className="w-12 h-12 glass rounded-full text-white disabled:opacity-20 flex items-center justify-center hover:bg-white/10"><i className="fas fa-chevron-left"></i></button>
              <span className="text-white text-xs font-black uppercase opacity-40">Trang {currentSlideIndex + 1} / {slides.length}</span>
              <button onClick={() => setCurrentSlideIndex(v => Math.min(slides.length-1, v+1))} disabled={currentSlideIndex >= slides.length - 1} className="w-12 h-12 glass rounded-full text-white disabled:opacity-20 flex items-center justify-center hover:bg-white/10"><i className="fas fa-chevron-right"></i></button>
           </div>
           <div ref={previewWrapperRef} className="w-full max-w-[900px] aspect-video rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/10" style={{ height: `${506.25 * previewScale}px` }}>
              <div className={`${activeTpl.class} absolute top-0 left-0 w-[900px] h-[506.25px] p-12 flex flex-col shadow-inner`} style={{ transform: `scale(${previewScale})`, transformOrigin: 'top center' }}>
                 {s.type === 'cover' ? (
                   <div className="flex-1 flex flex-col items-center justify-center text-center relative"><div className="absolute inset-0 opacity-10 pointer-events-none flex items-center justify-center"><i className="fas fa-award text-[300px]"></i></div><h1 className="text-6xl font-black italic uppercase mb-4 z-10" style={{ color: activeTpl.accentColor }}>{activeTab === 'review' ? "BẢN TỰ ĐÁNH GIÁ" : "MỤC TIÊU NĂM HỌC"}</h1><p className="text-3xl font-bold z-10">{student.fullName}</p><p className="text-lg opacity-60 mt-2 uppercase z-10">{student.class} | {phase}</p></div>
                 ) : s.type === 'titles' ? (
                   <div className="flex-1 flex flex-col relative"><div className="absolute -top-10 -right-10 opacity-5"><i className="fas fa-trophy text-[200px]"></i></div><h2 className="text-3xl font-black mb-6 uppercase tracking-tighter" style={{ color: activeTpl.accentColor }}>{s.title}</h2><div className="space-y-4">{(Array.isArray(s.items) ? s.items : []).map((item: string, idx: number) => { 
                     const isAch = Array.isArray(s.achieved) && s.achieved.includes(item); 
                     const isTarget = Array.isArray(s.targets) && s.targets.includes(item);
                     return (<div key={idx} className={`p-4 ${isTplLight ? 'bg-black/5' : 'bg-white/5'} rounded-2xl border ${isTplLight ? 'border-black/10' : 'border-white/10'} font-bold uppercase text-lg shadow-sm flex items-center justify-between`}>
                       <div className="flex items-center">
                        <i className={`fas ${isAch ? 'fa-check-circle text-emerald-500' : 'fa-award text-yellow-400'} mr-3`}></i>
                        <span className={isAch ? 'text-emerald-500' : ''}>{item}</span>
                       </div>
                       {isTarget && <span className="text-[10px] font-black uppercase opacity-40">Mục tiêu</span>}
                     </div>); 
                   })}</div></div>
                 ) : s.type === 'scores' ? (
                   <div className="flex-1 flex flex-col relative"><div className="absolute -top-10 -right-10 opacity-5"><i className="fas fa-chart-line text-[200px]"></i></div><h2 className="text-3xl font-black mb-6 uppercase tracking-tighter" style={{ color: activeTpl.accentColor }}>{s.title}</h2><div className={`${isTplLight ? 'bg-black/5' : 'bg-white/5'} p-4 rounded-2xl border ${isTplLight ? 'border-black/10' : 'border-white/10'}`}><div className={`grid ${activeTab === 'review' ? 'grid-cols-4' : 'grid-cols-2'} gap-4 font-black uppercase text-[8px] opacity-40 border-b ${isTplLight ? 'border-black/10' : 'border-white/10'} pb-2 mb-2`}><span>Môn học</span><span className="text-center">Mục tiêu</span>{activeTab === 'review' && <span className="text-center">Thực tế</span>}{activeTab === 'review' && <span>Giải pháp / Lời khen</span>}</div><div className="grid grid-cols-1 gap-y-1 overflow-y-auto max-h-[300px] no-scrollbar">{[...SUBJECTS_INT, ...SUBJECTS_VN].filter(sub => data.targetScores[sub]).map(sub => { const target = data.targetScores[sub] || ""; const actual = data.actualScores?.[sub] || ""; const isF = NON_NUMERIC_SUBJECTS.includes(sub) ? (target === "Đ" && actual === "CĐ") : (actual !== "" && parseFloat(actual || "0") < parseFloat(target || "0") && parseFloat(target || "0") > 0); return (<div key={sub} className={`grid ${activeTab === 'review' ? 'grid-cols-4' : 'grid-cols-2'} gap-4 items-center border-b ${isTplLight ? 'border-black/5' : 'border-white/5'} py-1 text-[10px]`}><span className="font-bold opacity-70 uppercase">{sub}</span><span className={`text-center font-black ${isTplLight ? 'text-black/60' : 'text-white/60'}`}>{target || '-'}</span>{activeTab === 'review' && <span className={`text-center font-black ${isF ? 'text-red-500' : 'text-emerald-500'}`}>{actual || '-'}</span>}{activeTab === 'review' && <span className={`italic text-[9px] ${isF ? 'text-red-600' : 'text-emerald-600'}`}>{data.subjectSolutions?.[sub] || '-'}</span>}</div>) })}</div></div></div>
                 ) : s.type === 'pillar' ? (
                   <div className="flex-1 flex flex-col relative"><div className="absolute -top-10 -right-10 opacity-5"><i className={`fas ${s.icon} text-[200px]`}></i></div><h2 className="text-3xl font-black mb-6 uppercase tracking-tighter" style={{ color: activeTpl.accentColor }}>{s.title}</h2><div className="grid grid-cols-2 gap-8 h-full"><div className="space-y-4"><p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em]">{activeTab === 'review' ? "Kết quả thực hiện" : "Mục tiêu & Thói quen"}</p><div className="space-y-2 overflow-y-auto max-h-[300px] no-scrollbar">{(Array.isArray(s.habits) ? s.habits : []).map((h: string, idx: number) => { const isDone = activeTab === 'review' ? (Array.isArray(s.achieved) && s.achieved.includes(h)) : true; const sol = activeTab === 'review' ? s.habitSolutions?.[h] : ""; return (<div key={idx} className={`p-3 ${isTplLight ? 'bg-black/5' : 'bg-white/5'} rounded-xl border ${isTplLight ? 'border-black/10' : 'border-white/10'} font-bold uppercase text-[10px] shadow-sm flex flex-col ${activeTab === 'review' ? (isDone ? 'text-emerald-600' : 'opacity-60') : ''}`}><div className="flex items-center"><i className={`fas ${activeTab === 'review' ? (isDone ? 'fa-check-circle text-emerald-500' : 'fa-circle') : 'fa-check'} mr-2 opacity-60`}></i><span>{h}</span></div>{activeTab === 'review' && !isDone && sol && <span className="ml-6 mt-1 text-[8px] italic text-yellow-600">Giải pháp: {sol}</span>}</div>); })}</div></div>{s.isFirstPart && (<div className={`bg-navy/10 ${isTplLight ? 'bg-black/5' : 'bg-navy/40'} rounded-3xl p-6 border ${isTplLight ? 'border-black/10' : 'border-white/5'} shadow-inner flex flex-col h-full overflow-hidden`}><p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] mb-4">{activeTab === 'review' ? "Lộ trình đã lập" : "Kế hoạch Hành động"}</p><div className="flex-1 overflow-y-auto no-scrollbar"><p className={`text-xs italic leading-relaxed ${isTplLight ? 'text-black/80' : 'text-yellow-400/90'} whitespace-pre-wrap`}>{s.action || "Chưa cập nhật lộ trình..."}</p></div></div>)}</div></div>
                 ) : (
                   <div className="flex-1 flex flex-col justify-center text-center italic relative"><div className="absolute inset-0 opacity-5 pointer-events-none flex items-center justify-center"><i className="fas fa-comments text-[200px]"></i></div><h2 className="text-3xl font-black mb-8 uppercase" style={{ color: activeTpl.accentColor }}>{s.title}</h2><div className={`p-10 ${isTplLight ? 'bg-black/5' : 'bg-white/5'} rounded-[3rem] border ${isTplLight ? 'border-black/10' : 'border-white/10'} z-10`}><p className="text-2xl leading-relaxed">"{s.content}"</p></div></div>
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (mode === 'list' || (archives.length > 0 && mode !== 'edit')) return renderArchiveSelector();

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto text-white">
       <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white/5 p-6 rounded-[2.5rem] border border-white/10 shadow-xl text-white">
          <div><h3 className="text-2xl font-black uppercase italic tracking-tighter">Hành trình <span className="text-yellow-400">Insight</span></h3><div className="flex items-center mt-2 space-x-4"><select value={phase} disabled={isTeacherView} onChange={e => setPhase(e.target.value)} className={`bg-[#1A2A6C] border border-white/20 rounded-xl px-3 py-2 text-[10px] font-bold uppercase outline-none focus:border-yellow-400 transition-all text-white appearance-none min-w-[150px] ${isTeacherView ? 'opacity-60 cursor-not-allowed' : ''}`}>{PHASES.map(p => <option key={p} value={p} className="bg-[#1A2A6C] text-white py-2">{p}</option>)}</select></div></div>
          <div className="flex p-1 bg-white/10 rounded-2xl border border-white/5">
             <button onClick={() => { setActiveTab('set'); setMode('edit'); setStep(1); }} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'set' ? 'bg-yellow-400 text-navy shadow-lg' : 'opacity-40 hover:opacity-100 text-white'}`}>Lập mục tiêu</button>
             <button onClick={() => { setActiveTab('review'); setMode('edit'); setStep(1); }} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase transition-all tracking-widest ${activeTab === 'review' ? 'bg-emerald-500 text-white shadow-lg' : 'opacity-40 hover:opacity-100 text-white'}`}>Tự đánh giá</button>
          </div>
       </div>
       {renderWizard()}
    </div>
  );
};

export default GoalReview;