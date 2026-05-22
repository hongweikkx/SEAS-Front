import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SEAS - 智能学业分析系统',
  description:
    '专为教师打造的成绩分析平台。Excel 一键导入，AI 自动解读，多维度图表即刻生成。',
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-svh bg-background">{children}</div>
}
