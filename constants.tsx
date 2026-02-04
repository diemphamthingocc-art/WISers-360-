
import { GoalCategory, Student, Goal, HomeroomTeacherLog, Dimension5D } from './types';

export const COLORS = {
  navy: '#1A2A6C',
  gold: '#FFD700',
  glassWhite: 'rgba(255, 255, 255, 0.15)',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B'
};

const generateRandomScores = (): Dimension5D => ({
  iq: Math.floor(Math.random() * 40) + 60,
  eq: Math.floor(Math.random() * 40) + 60,
  physical: Math.floor(Math.random() * 40) + 60,
  social: Math.floor(Math.random() * 40) + 60,
  aq: Math.floor(Math.random() * 40) + 60,
});

const RAW_DATA: Record<string, string[]> = {
  "6AB2": [
    "Hoàng Khánh An", "Nguyễn Quang Anh", "Vũ Duy Anh", "Nguyễn Ngọc Ánh",
    "Vũ Linh Chi", "Âu Bảo Khanh", "Phạm Hùng Kiệt", "Trương Kim Ngân",
    "Nguyễn Ngọc An Nhi", "Nguyễn Tuấn Phong", "Lại Văn Minh Phúc", "Vũ Bảo Phúc",
    "ZHAO QICHEN", "Đình Phương Thảo", "Nguyễn Phương Thảo"
  ],
  "6AB4": [
    "Nguyễn Đoàn Tâm An", "Nguyễn Phan Kiều Anh", "Nguyễn Phương Anh", "Phạm Mỹ Anh",
    "Phương Hữu Bảo", "Bùi Thế Dũng", "Nguyễn Trần Thùy Dương", "Lê Hải Đăng",
    "Nguyễn Hải Đăng", "Lê Trần Bảo Lâm", "Nguyễn An Lê", "Lý Duy Bảo Minh",
    "Nguyễn Tuấn Minh", "Đặng Đức Nguyên", "Lương Tuệ Nhi", "Tạ Minh Phương",
    "Nguyễn Ngọc Bảo Quân", "Lê Phương Uyên", "Nguyễn Bá Tôn Vũ", "Tạ Yến Vy"
  ],
  "8AB3": [
    "Lê Hoàng Minh Anh", "Nguyễn Bùi Bảo Anh", "Nguyễn Nhật Anh", "Trần Hải Ngọc Châu",
    "Phạm Anh Duy", "Đỗ Tiến Đạt", "Nguyễn Minh Khang", "Đồng Trường Khanh",
    "Lê Nam Khánh", "Lê Nhã Kỳ", "Lã Ngọc Long", "Nguyễn Nhật Minh",
    "Phạm Nhật Minh", "Lu Phương Nhi", "Bùi Hải Phong", "Mai Anh Quan",
    "Trần Ngọc Trâm", "Nguyễn Minh Khang (mới)", "Nguyễn Đức Vinh", "Vũ Gia Vũ",
    "Nguyễn Phạm Minh Khôi", "Nguyễn Bảo Ngân"
  ]
};

const createStudents = (): Student[] => {
  const students: Student[] = [];
  let globalIndex = 1;

  Object.entries(RAW_DATA).forEach(([className, names]) => {
    names.forEach((name, idx) => {
      students.push({
        id: `std-${globalIndex}`,
        fullName: name,
        studentId: `WS25${globalIndex.toString().padStart(3, '0')}`,
        class: className,
        avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(name)}`,
        scores: generateRandomScores()
      });
      globalIndex++;
    });
  });

  return students;
};

export const ALL_STUDENTS: Student[] = createStudents();

export const getMockGoals = (studentId: string): Goal[] => [
  {
    id: `g1-${studentId}`,
    studentId,
    category: GoalCategory.ACADEMIC,
    title: 'Nâng cao tư duy toán học',
    target: 'Điểm trung bình học kỳ >= 8.5',
    checklist: ['Hoàn thành bài tập Khan Academy', 'Tham gia CLB Toán'],
    status: 'PENDING'
  },
  {
    id: `g2-${studentId}`,
    studentId,
    category: GoalCategory.SKILLS,
    title: 'Kỹ năng thuyết trình',
    target: 'Tự tin trình bày trước lớp 5 phút',
    checklist: ['Luyện tập trước gương', 'Học cách dùng Canva'],
    status: 'PENDING'
  }
];

export const MOCK_LOGS: HomeroomTeacherLog[] = [
  {
    id: 'l1',
    studentId: 'all',
    date: '2025-05-20',
    mood: '😊',
    content: 'Các lớp đang thể hiện tinh thần học tập và nỗ lực rất tốt trong hệ thống Insight 360.',
    tags: ['#TinhThanLop', '#HocTap']
  }
];
