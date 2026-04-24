import type { AnalysisView, AIAnalysisResult, AILink } from '@/types'

/**
 * 根据视图生成模拟 AI 分析结果
 */
export function generateMockAIAnalysis(
  view: AnalysisView,
  _examId: string,
  _params: Record<string, string | undefined>
): AIAnalysisResult {
  const now = Date.now()

  const makeLink = (label: string, targetView: AnalysisView, params?: AILink['params']): AIAnalysisResult['segments'][number] => ({
    type: 'link' as const,
    content: label,
    link: { label, targetView, params },
  })

  const makeText = (content: string): AIAnalysisResult['segments'][number] => ({
    type: 'text' as const,
    content,
  })

  switch (view) {
    case 'class-summary':
      return {
        segments: [
          makeText('本次考试班级整体表现平稳，'),
          makeLink('高三1班', 'single-class-summary', { classId: '1' }),
          makeText('平均分领先，'),
          makeLink('高三3班', 'single-class-summary', { classId: '3' }),
          makeText('标准差较大，建议关注两极分化。'),
        ],
        generatedAt: now,
      }
    case 'subject-summary':
      return {
        segments: [
          makeText('数学学科难度系数0.72，区分度良好。'),
          makeLink('数学', 'single-class-summary', { subjectId: 'math' }),
          makeText('高分段人数占比15%，建议加强压轴题训练。'),
        ],
        generatedAt: now,
      }
    case 'rating-analysis':
      return {
        segments: [
          makeText('四率分布显示：优秀率12%，良好率35%，及格率78%。'),
          makeLink('查看班级详情', 'class-subject-summary'),
          makeText('以了解各班级四率差异。'),
        ],
        generatedAt: now,
      }
    case 'class-subject-summary':
      return {
        segments: [
          makeText('班级学科交叉分析表明，'),
          makeLink('高三1班数学', 'single-class-summary', { classId: '1', subjectId: 'math' }),
          makeText('表现突出，可作为教学案例。'),
        ],
        generatedAt: now,
      }
    case 'single-class-summary':
      return {
        segments: [
          makeText('该班级各题得分率分布均匀，'),
          makeLink('查看题目详情', 'single-class-question', { classId: '1' }),
          makeText('以定位具体薄弱知识点。'),
        ],
        generatedAt: now,
      }
    case 'single-class-question':
      return {
        segments: [
          makeText('第12题得分率仅32%，'),
          makeLink('查看题目汇总', 'single-question-summary', { questionId: '12' }),
          makeText('发现多数学生在此失分。'),
        ],
        generatedAt: now,
      }
    case 'single-question-summary':
      return {
        segments: [
          makeText('该题在'),
          makeLink('高三1班', 'single-question-detail', { classId: '1', questionId: '12' }),
          makeText('的得分率最低，建议重点讲评。'),
        ],
        generatedAt: now,
      }
    case 'single-question-detail':
      return {
        segments: [
          makeText('本题考查函数单调性，班级得分率42%，建议回归教材例题3-5进行针对性训练。'),
        ],
        generatedAt: now,
      }
    default:
      return {
        segments: [makeText('暂无分析数据。')],
        generatedAt: now,
      }
  }
}
