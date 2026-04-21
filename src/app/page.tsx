'use client'

import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { AiAssistantCard } from '@/components/dashboard/AiAssistantCard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { NewAnalysisCTA } from '@/components/dashboard/NewAnalysisCTA'
import { RecentExamList } from '@/components/dashboard/RecentExamList'

export default function Home() {
  return (
    <div className="space-y-6">
      <WelcomeBanner />
      <NewAnalysisCTA />
      <AiAssistantCard />
      <QuickStats />
      <RecentExamList />
    </div>
  )
}
