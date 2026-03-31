'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import SubjectTabs from '@/components/exam/SubjectTabs'
import SubjectSummary from '@/components/analysis/SubjectSummary'
import ClassSummary from '@/components/analysis/ClassSummary'
import RatingChart from '@/components/analysis/RatingChart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

interface PageProps {
  params: {
    id: string
  }
}

export default function ExamDetailPage({ params }: PageProps) {
  const { selectedExamId, setSelectedExamId, ratingConfig, setRatingConfig } = useAnalysisStore()
  const examId = params.id

  useEffect(() => {
    setSelectedExamId(examId)
  }, [examId, setSelectedExamId])

  const handleRatingConfigChange = (key: string, value: number) => {
    setRatingConfig({
      ...ratingConfig,
      [key]: value,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">考试分析详情</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 学科标签 */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">选择学科</h2>
            <SubjectTabs examId={examId} />
          </div>

          {/* 四率配置 */}
          <Card>
            <CardHeader>
              <CardTitle>四率配置（可自定义）</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    优秀分数线
                  </label>
                  <Input
                    type="number"
                    value={ratingConfig.excellent_threshold}
                    onChange={(e) =>
                      handleRatingConfigChange('excellent_threshold', parseFloat(e.target.value))
                    }
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    良好分数线
                  </label>
                  <Input
                    type="number"
                    value={ratingConfig.good_threshold}
                    onChange={(e) =>
                      handleRatingConfigChange('good_threshold', parseFloat(e.target.value))
                    }
                    min={0}
                    max={100}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    合格分数线
                  </label>
                  <Input
                    type="number"
                    value={ratingConfig.pass_threshold}
                    onChange={(e) =>
                      handleRatingConfigChange('pass_threshold', parseFloat(e.target.value))
                    }
                    min={0}
                    max={100}
                  />
                </div>
                <div className="flex items-end">
                  <p className="text-sm text-gray-500">
                    低分: &lt;{ratingConfig.pass_threshold}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 学科情况汇总 */}
          <SubjectSummary examId={examId} />

          {/* 班级情况汇总 */}
          <ClassSummary examId={examId} />

          {/* 四率分析 */}
          <RatingChart examId={examId} />
        </div>
      </main>
    </div>
  )
}

