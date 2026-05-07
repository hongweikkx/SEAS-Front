'use client'

import { useState } from 'react'
import { useSingleQuestionDetail, useSingleQuestionSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
import QuestionPager from '@/components/analysis/QuestionPager'

interface SingleQuestionDetailProps {
  examId: string
}

const getScoreClass = (scoreRate: number) => {
  if (scoreRate >= 80) return 'text-emerald-600'
  if (scoreRate < 60) return 'text-red-600'
  return ''
}

export default function SingleQuestionDetail({ examId }: SingleQuestionDetailProps) {
  const { selectedSubjectId, drillDownParams, setDrillDownParam, updateLastDrillDownLabel } = useAnalysisStore()
  const classIdStr = drillDownParams.classId ?? 'all'
  const questionId = drillDownParams.questionId
  const [studentNameFilter, setStudentNameFilter] = useState('')

  const { data: questionSummary } = useSingleQuestionSummary(examId, selectedSubjectId ?? undefined)
  const allQuestions = questionSummary?.questions || []
  const effectiveQuestionId = questionId || allQuestions[0]?.questionId

  const classId = classIdStr === 'all' ? 0 : Number(classIdStr)
  const { data, isLoading } = useSingleQuestionDetail(
    examId,
    selectedSubjectId ?? undefined,
    classId,
    effectiveQuestionId
  )

  const handleQuestionChange = (newQuestionId: string, newQuestionNumber: string) => {
    setDrillDownParam('questionId', newQuestionId)
    updateLastDrillDownLabel(`学生得分详情 第${newQuestionNumber}题`)
  }

  const filteredStudents = data?.students.filter((s) =>
    !studentNameFilter || s.studentName.toLowerCase().includes(studentNameFilter.toLowerCase())
  ) || []

  const displayClassName = data?.className || (classIdStr === 'all' ? '全年级' : '班级')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {displayClassName} {data?.subjectName || '学科'} — {data?.questionNumber ?? ''} 学生得分详情
          </h2>
        </div>
        <AIAnalysisTrigger view="single-question-detail" examId={examId} />
      </div>
      {data?.questionContent && (
        <p className="text-xs text-muted-foreground">
          题目内容：{data.questionContent}
        </p>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <QuestionPager
          questions={allQuestions.map((q) => ({ questionId: q.questionId, questionNumber: q.questionNumber }))}
          currentQuestionId={effectiveQuestionId}
          onChange={handleQuestionChange}
        />
        <input
          type="text"
          placeholder="搜索学生姓名..."
          value={studentNameFilter}
          onChange={(e) => setStudentNameFilter(e.target.value)}
          className="h-8 rounded-lg border border-border/60 bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">学生姓名</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">得分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">满分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">得分率</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级排名</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">年级排名</th>
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">作答情况</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.studentId}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td className="py-3 px-5">{student.studentName}</td>
                  <td className={`py-3 px-5 text-right ${getScoreClass(student.scoreRate)}`}>
                    {formatNumber(student.score)}
                  </td>
                  <td className="py-3 px-5 text-right">{student.fullScore}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(student.scoreRate)}%</td>
                  <td className="py-3 px-5 text-right">{student.classRank}</td>
                  <td className="py-3 px-5 text-right">{student.gradeRank}</td>
                  <td className="py-3 px-5">{student.answerContent || '—'}</td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    {studentNameFilter ? '未找到匹配的学生' : '暂无数据'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <AIAnalysisPanel view="single-question-detail" examId={examId} />
    </div>
  )
}
