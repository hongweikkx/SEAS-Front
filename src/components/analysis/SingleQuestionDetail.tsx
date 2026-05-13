'use client'

import { useState } from 'react'
import { useSingleQuestionDetail, useSingleQuestionSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { downloadWorkbook, sanitizeFilename } from '@/lib/export-utils'
import * as XLSX from 'xlsx'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
import QuestionCombobox from '@/components/analysis/QuestionCombobox'

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

  const handleExport = () => {
    if (!data?.students) return

    const rows = filteredStudents.map((s) => ({
      学生姓名: s.studentName,
      得分: s.score,
      满分: s.fullScore,
      得分率: `${s.scoreRate}%`,
      班级排名: s.classRank,
      年级排名: s.gradeRank,
    }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '学生得分详情')
    const examName = data.examName || '考试'
    const subjectName = selectedSubjectName || '全科'
    downloadWorkbook(wb, `${sanitizeFilename(examName)}-${sanitizeFilename(subjectName)}-学生得分详情.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            学生得分详情
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <AIAnalysisTrigger view="single-question-detail" examId={examId} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={!data || filteredStudents.length === 0}
            className="h-8 w-8 p-0"
            title="导出Excel"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {data?.questionContent && (
        <p className="text-xs text-muted-foreground">
          题目内容：{data.questionContent}
        </p>
      )}

      <div className="flex items-center gap-4 flex-wrap">
        <QuestionCombobox
          questions={allQuestions.map((q) => ({ questionId: q.questionId, questionNumber: q.questionNumber }))}
          currentQuestionId={effectiveQuestionId}
          onChange={handleQuestionChange}
        />
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">学生:</span>
          <input
            type="text"
            placeholder="搜索学生姓名..."
            value={studentNameFilter}
            onChange={(e) => setStudentNameFilter(e.target.value)}
            className="h-8 rounded-lg border border-border/60 bg-background px-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
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
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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
