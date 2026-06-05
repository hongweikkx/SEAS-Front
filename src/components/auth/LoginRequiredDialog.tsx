import { LogIn, ArrowRight } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface LoginRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLogin: () => void
}

export function LoginRequiredDialog({ open, onOpenChange, onLogin }: LoginRequiredDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader className="items-center text-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-1"
          >
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <AlertDialogTitle className="text-lg"
          >登录后即可创建分析</AlertDialogTitle>
          <AlertDialogDescription className="text-sm"
          >
            上传成绩文件、生成多维分析报告，需要先登录账号。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:justify-center gap-2"
        >
          <AlertDialogCancel variant="outline" className="rounded-lg"
          >
            稍后再说
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onLogin}
            className="rounded-lg gap-1.5"
          >
            立即登录
            <ArrowRight className="h-3.5 w-3.5" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
