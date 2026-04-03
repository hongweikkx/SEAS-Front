import type { ChatContext, RatingConfig } from '@/types'

type AnalysisSelection = {
  selectedExamId: string | null
  selectedExamName: string | null
  selectedSubjectId: string | null
  selectedSubjectName: string | null
  selectedScope: 'all_subjects' | 'single_subject'
  ratingConfig?: RatingConfig
}

export function buildChatContext(selection: AnalysisSelection): ChatContext {
  const hasExam = Boolean(selection.selectedExamId)

  return {
    scope: hasExam ? selection.selectedScope : 'exam_list',
    examId: selection.selectedExamId,
    examName: selection.selectedExamName,
    subjectId: hasExam ? selection.selectedSubjectId : null,
    subjectName: hasExam ? selection.selectedSubjectName : null,
    ratingConfig: selection.ratingConfig,
  }
}

export function chatContextKey(context: ChatContext): string {
  return [context.scope, context.examId ?? '', context.subjectId ?? ''].join(':')
}

export function chatContextTitle(context: ChatContext): string {
  if (context.scope === 'exam_list') {
    return '考试列表'
  }

  const examName = context.examName?.trim() || (context.examId ? `考试 ${context.examId}` : '考试')
  if (context.scope === 'single_subject') {
    const subjectName = context.subjectName?.trim() || (context.subjectId ? `学科 ${context.subjectId}` : '某科')
    return `${examName} · ${subjectName}`
  }

  return `${examName} · 全科`
}

export function chatContextSubtitle(context: ChatContext): string {
  if (context.scope === 'exam_list') {
    return '先选考试，再发起自然语言分析。'
  }

  if (context.scope === 'single_subject') {
    return '当前已锁定到某次考试的单科分析。'
  }

  return '当前已锁定到某次考试的全科分析。'
}

export function chatQuickPrompts(context: ChatContext): string[] {
  if (context.scope === 'exam_list') {
    return [
      '最近有哪些考试？',
      '帮我找一场适合分析的考试',
      '我想看某次考试的全科情况',
    ]
  }

  if (context.scope === 'single_subject') {
    const subjectName = context.subjectName?.trim() || '这门学科'
    return [
      `分析${subjectName}的班级差异`,
      `看${subjectName}的四率分析`,
      `找出${subjectName}最薄弱的班级`,
    ]
  }

  const examName = context.examName?.trim() || '这次考试'
  return [
    `概括${examName}的全科表现`,
    '看班级平均分差异',
    '看四率分析',
  ]
}

export function chatContextHint(context: ChatContext): string {
  if (context.scope === 'exam_list') {
    return '当前没有锁定具体考试。你可以先从考试列表选一场，或者直接问“最近有哪些考试”。'
  }

  if (context.scope === 'single_subject') {
    return '你现在在单科模式。切换学科后，聊天会保留当前考试上下文，但会开启新的分析线程。'
  }

  return '你现在在全科模式。若要分析某一科，先切换到对应学科。'
}

export function chatContextSummary(context: ChatContext): string {
  if (context.scope === 'exam_list') {
    return '考试列表'
  }

  const examName = context.examName?.trim() || (context.examId ? `考试 ${context.examId}` : '考试')
  if (context.scope === 'single_subject') {
    const subjectName = context.subjectName?.trim() || (context.subjectId ? `学科 ${context.subjectId}` : '某科')
    return `${examName} · ${subjectName}`
  }

  return `${examName} · 全科`
}

export function chatContextPrompt(context: ChatContext): string {
  const summary = chatContextSummary(context)

  if (context.scope === 'exam_list') {
    return `【分析上下文】\n范围：考试列表\n当前视角：${summary}\n\n`
  }

  if (context.scope === 'single_subject') {
    return `【分析上下文】\n考试：${context.examName?.trim() || context.examId || '未命名考试'}\n范围：单科\n学科：${context.subjectName?.trim() || context.subjectId || '未命名学科'}\n\n`
  }

  return `【分析上下文】\n考试：${context.examName?.trim() || context.examId || '未命名考试'}\n范围：全科\n\n`
}
