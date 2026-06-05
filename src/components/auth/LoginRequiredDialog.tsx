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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>登录后即可创建分析</AlertDialogTitle>
          <AlertDialogDescription>
            上传成绩文件、生成多维分析报告，需要先登录账号。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <AlertDialogAction onClick={onLogin}>
            去登录
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
