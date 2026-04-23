import type {
  ClassSubjectSummaryResponse,
  SingleClassSummaryResponse,
  SingleClassQuestionResponse,
  SingleQuestionSummaryResponse,
  SingleQuestionDetailResponse,
} from '@/types'

// ===== Mock Data Generators =====

const mockClassSubjectSummary = (
  examId: string,
  classId: number
): ClassSubjectSummaryResponse => {
  const subjects = [
    { id: 'chinese', name: '语文', fullScore: 150 },
    { id: 'math', name: '数学', fullScore: 150 },
    { id: 'english', name: '英语', fullScore: 150 },
    { id: 'physics', name: '物理', fullScore: 100 },
    { id: 'chemistry', name: '化学', fullScore: 100 },
  ]

  const classSubjects = subjects.map((s, i) => {
    const classAvg = s.fullScore * (0.55 + Math.random() * 0.25)
    const gradeAvg = s.fullScore * (0.5 + Math.random() * 0.25)
    return {
      subjectId: s.id,
      subjectName: s.name,
      fullScore: s.fullScore,
      classAvgScore: Math.round(classAvg * 10) / 10,
      gradeAvgScore: Math.round(gradeAvg * 10) / 10,
      scoreDiff: Math.round((classAvg - gradeAvg) * 10) / 10,
      classHighest: Math.round(s.fullScore * (0.7 + Math.random() * 0.28)),
      classLowest: Math.round(s.fullScore * (0.2 + Math.random() * 0.3)),
      classRank: i + 1,
      totalClasses: 10,
    }
  })

  const overallAvg = classSubjects.reduce((s, c) => s + c.classAvgScore, 0)
  const gradeOverallAvg = classSubjects.reduce((s, c) => s + c.gradeAvgScore, 0)

  return {
    examId,
    examName: '期中考试',
    classId,
    className: `高二(${classId - 100})班`,
    overall: {
      subjectId: 'overall',
      subjectName: '全科',
      fullScore: 550,
      classAvgScore: Math.round(overallAvg * 10) / 10,
      gradeAvgScore: Math.round(gradeOverallAvg * 10) / 10,
      scoreDiff: Math.round((overallAvg - gradeOverallAvg) * 10) / 10,
      classHighest: Math.round(overallAvg * 1.25),
      classLowest: Math.round(overallAvg * 0.65),
      classRank: 2,
      totalClasses: 10,
    },
    subjects: classSubjects,
  }
}

const mockSingleClassSummary = (
  examId: string,
  subjectId: string
): SingleClassSummaryResponse => {
  const subjectNames: Record<string, string> = {
    chinese: '语文', math: '数学', english: '英语',
    physics: '物理', chemistry: '化学',
  }
  const subjectName = subjectNames[subjectId] || subjectId
  const fullScore = subjectId === 'chinese' || subjectId === 'math' || subjectId === 'english' ? 150 : 100

  const classes = Array.from({ length: 10 }, (_, i) => {
    const avg = fullScore * (0.45 + Math.random() * 0.35)
    const gradeAvg = fullScore * 0.6
    return {
      classId: 101 + i,
      className: `高二(${i + 1})班`,
      totalStudents: 45 + Math.floor(Math.random() * 10),
      subjectAvgScore: Math.round(avg * 10) / 10,
      gradeAvgScore: Math.round(gradeAvg * 10) / 10,
      scoreDiff: Math.round((avg - gradeAvg) * 10) / 10,
      classRank: i + 1,
      totalClasses: 10,
      passRate: Math.round((0.6 + Math.random() * 0.35) * 100),
      excellentRate: Math.round((0.1 + Math.random() * 0.25) * 100),
    }
  }).sort((a, b) => b.subjectAvgScore - a.subjectAvgScore)
    .map((c, i) => ({ ...c, classRank: i + 1 }))

  const overallAvg = classes.reduce((s, c) => s + c.subjectAvgScore * c.totalStudents, 0)
    / classes.reduce((s, c) => s + c.totalStudents, 0)

  return {
    examId,
    examName: '期中考试',
    subjectId,
    subjectName,
    overall: {
      classId: 0,
      className: '全年级',
      totalStudents: classes.reduce((s, c) => s + c.totalStudents, 0),
      subjectAvgScore: Math.round(overallAvg * 10) / 10,
      gradeAvgScore: Math.round(overallAvg * 10) / 10,
      scoreDiff: 0,
      classRank: 0,
      totalClasses: 10,
      passRate: Math.round(classes.reduce((s, c) => s + c.passRate, 0) / classes.length),
      excellentRate: Math.round(classes.reduce((s, c) => s + c.excellentRate, 0) / classes.length),
    },
    classes,
  }
}

const mockSingleClassQuestion = (
  examId: string,
  subjectId: string,
  classId: number
): SingleClassQuestionResponse => {
  const subjectNames: Record<string, string> = {
    chinese: '语文', math: '数学', english: '英语',
    physics: '物理', chemistry: '化学',
  }
  const questionTypes = ['选择题', '填空题', '解答题']
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']

  return {
    examId,
    examName: '期中考试',
    subjectId,
    subjectName: subjectNames[subjectId] || subjectId,
    classId,
    className: `高二(${classId - 100})班`,
    questions: Array.from({ length: 20 }, (_, i) => {
      const fullScore = i < 10 ? 5 : i < 16 ? 10 : 15
      const classAvg = fullScore * (0.4 + Math.random() * 0.5)
      return {
        questionId: `q${i + 1}`,
        questionNumber: `${i + 1}`,
        questionType: questionTypes[i % 3],
        fullScore,
        classAvgScore: Math.round(classAvg * 10) / 10,
        scoreRate: Math.round((classAvg / fullScore) * 100),
        gradeAvgScore: Math.round(fullScore * (0.45 + Math.random() * 0.4) * 10) / 10,
        difficulty: difficulties[Math.floor(Math.random() * 3)],
      }
    }),
  }
}

const mockSingleQuestionSummary = (
  examId: string,
  subjectId: string
): SingleQuestionSummaryResponse => {
  const subjectNames: Record<string, string> = {
    chinese: '语文', math: '数学', english: '英语',
    physics: '物理', chemistry: '化学',
  }
  const questionTypes = ['选择题', '填空题', '解答题']
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']

  return {
    examId,
    examName: '期中考试',
    subjectId,
    subjectName: subjectNames[subjectId] || subjectId,
    questions: Array.from({ length: 20 }, (_, i) => {
      const fullScore = i < 10 ? 5 : i < 16 ? 10 : 15
      const gradeAvg = fullScore * (0.45 + Math.random() * 0.4)
      return {
        questionId: `q${i + 1}`,
        questionNumber: `${i + 1}`,
        questionType: questionTypes[i % 3],
        fullScore,
        gradeAvgScore: Math.round(gradeAvg * 10) / 10,
        classBreakdown: Array.from({ length: 5 }, (_, j) => ({
          classId: 101 + j,
          className: `高二(${j + 1})班`,
          avgScore: Math.round(fullScore * (0.3 + Math.random() * 0.6) * 10) / 10,
        })),
        scoreRate: Math.round((gradeAvg / fullScore) * 100),
        difficulty: difficulties[Math.floor(Math.random() * 3)],
      }
    }),
  }
}

const mockSingleQuestionDetail = (
  examId: string,
  subjectId: string,
  classId: number,
  questionId: string
): SingleQuestionDetailResponse => {
  const subjectNames: Record<string, string> = {
    chinese: '语文', math: '数学', english: '英语',
    physics: '物理', chemistry: '化学',
  }
  const fullScore = Math.random() > 0.5 ? 10 : 5

  return {
    examId,
    examName: '期中考试',
    subjectId,
    subjectName: subjectNames[subjectId] || subjectId,
    classId,
    className: `高二(${classId - 100})班`,
    questionId,
    questionNumber: questionId.replace('q', ''),
    questionType: Math.random() > 0.5 ? '选择题' : '填空题',
    fullScore,
    questionContent: '这是一道示例题目，实际数据将由后端提供。',
    students: Array.from({ length: 50 }, (_, i) => {
      const score = Math.round(Math.random() * fullScore * 10) / 10
      return {
        studentId: `s${i + 1}`,
        studentName: `学生${i + 1}`,
        score,
        fullScore,
        scoreRate: Math.round((score / fullScore) * 100),
        classRank: 0,
        gradeRank: 0,
        answerContent: score >= fullScore * 0.6 ? '回答正确' : '回答有误',
      }
    }).sort((a, b) => b.score - a.score)
      .map((s, i) => ({ ...s, classRank: i + 1, gradeRank: i + 1 })),
  }
}

// ===== Service Methods =====

export const drilldownService = {
  getClassSubjectSummary: async (examId: string, classId: number): Promise<ClassSubjectSummaryResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockClassSubjectSummary(examId, classId)
  },

  getSingleClassSummary: async (examId: string, subjectId: string): Promise<SingleClassSummaryResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockSingleClassSummary(examId, subjectId)
  },

  getSingleClassQuestion: async (
    examId: string, subjectId: string, classId: number
  ): Promise<SingleClassQuestionResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockSingleClassQuestion(examId, subjectId, classId)
  },

  getSingleQuestionSummary: async (examId: string, subjectId: string): Promise<SingleQuestionSummaryResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockSingleQuestionSummary(examId, subjectId)
  },

  getSingleQuestionDetail: async (
    examId: string, subjectId: string, classId: number, questionId: string
  ): Promise<SingleQuestionDetailResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockSingleQuestionDetail(examId, subjectId, classId, questionId)
  },
}
