'use client'

import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { RecentExamList } from '@/components/dashboard/RecentExamList'
import { AiInsightBanner } from '@/components/dashboard/AiInsightBanner'

export default function Home() {
  return (
    <div className="space-y-8">
      <WelcomeBanner />
      <RecentExamList />
      <AiInsightBanner />
    </div>
  )
}
