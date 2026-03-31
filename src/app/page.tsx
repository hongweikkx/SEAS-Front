'use client'
import ExamList from '@/components/exam/ExamList'
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-4xl font-bold text-gray-900">
            SEAS - 学生成绩分析系统
          </h1>
          <p className="text-gray-600 mt-2">
            多维度成绩分析平台，帮助你深入了解学生学习情况
          </p>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            选择要分析的考试
          </h2>
          <ExamList />
        </div>
      </main>
    </div>
  )
}
