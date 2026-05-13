'use client'

import { ExternalLink, MessageCircle } from 'lucide-react'

interface Article {
  title: string
  description: string
  url: string
}

const articles: Article[] = [
  {
    title: '2025 高考数学命题趋势深度解析',
    description: '从近五年真题出发，剖析命题规律与备考策略，助力教师精准把握教学方向。',
    url: 'https://mp.weixin.qq.com/s/aGcq8P2i6LcJKygWvkQqEQ',
  },
  {
    title: '如何用数据驱动课堂提效',
    description: '结合真实教学案例，分享数据可视化在学生分层辅导中的落地实践经验。',
    url: 'https://mp.weixin.qq.com/s/JW-ms23pJmWy3YNH2pZJjA',
  },
]

export function AiInsightBanner() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-[#07C160]" />
        <h3 className="text-sm font-semibold text-foreground">推荐阅读</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {articles.map((article, index) => (
          <a
            key={index}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 pl-5 transition-all hover:border-[#07C160]/30 hover:shadow-sm"
          >
            <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-[#07C160]/60" />
            <div className="flex items-start justify-between gap-2">
              <h4 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-[#07C160] transition-colors">
                {article.title}
              </h4>
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-[#07C160] transition-colors" />
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {article.description}
            </p>
          </a>
        ))}
      </div>
    </div>
  )
}
