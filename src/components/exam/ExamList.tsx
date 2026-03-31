'use client'

import { useExams } from '@/hooks/useAnalysis'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/utils/format'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'

export default function ExamList() {
  const { data, isLoading, error } = useExams(1, 20)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-600">加载失败，请检查后端服务是否运行</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data?.exams.map((exam) => (
        <Link href={`/exams/${exam.id}`} key={exam.id}>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{exam.name}</CardTitle>
              <CardDescription>
                {formatDate(exam.examDate)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500">
                点击查看详细分析
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

