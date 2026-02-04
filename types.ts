
export enum GoalCategory {
  ACADEMIC = 'Học tập',
  HEALTH = 'Sức khỏe',
  SKILLS = 'Kỹ năng',
  ROUTINE = 'Nề nếp'
}

export interface Dimension5D {
  iq: number;
  eq: number;
  physical: number;
  social: number;
  aq: number;
}

export interface Student {
  id: string;
  fullName: string;
  studentId: string;
  class: string;
  avatar: string;
  scores: Dimension5D;
}

export interface Goal {
  id: string;
  studentId: string;
  category: GoalCategory;
  title: string;
  target: string;
  checklist: string[];
  status: 'PENDING' | 'ACHIEVED' | 'FAILED';
}

export interface Evidence {
  id: string;
  goalId: string;
  imageUrl: string;
  uploadedAt: string;
  aiAnalysis?: string;
  isVerified: boolean;
  isArchive?: boolean;
  archiveType?: 'PLAN' | 'REVIEW';
  archivePhase?: string;
}

export interface HomeroomTeacherLog {
  id: string;
  studentId: string;
  date: string;
  dateISO?: string;
  mood: string;
  content: string;
  privateNote?: string; // Ghi chú nội bộ của GV
  tags: string[];
  authorRole?: 'STUDENT' | 'TEACHER';
  authorName?: string;
}
