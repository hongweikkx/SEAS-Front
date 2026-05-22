import { Github, GraduationCap, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-card/50 px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* CTA 区域 */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            开始使用 SEAS
          </h2>
          <p className="mt-3 text-muted-foreground">
            开源免费，本地部署，数据完全自主掌控
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              asChild
              size="lg"
            >
              <a
                href="https://github.com/hongweikkx/seas-frontend"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-5 w-5" />
                查看前端仓库
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
            >
              <a
                href="https://github.com/hongweikkx/SEAS"
                target="_blank"
                rel="noopener noreferrer"
              >
                查看后端仓库
              </a>
            </Button>
          </div>
        </div>

        {/* 底部栏 */}
        <div className="flex flex-col items-center gap-4 border-t border-border/40 pt-8 md:flex-row md:justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <GraduationCap className="h-5 w-5" />
            <span>SEAS 智能学业分析系统</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-3 w-3 fill-red-400 text-red-400" />
            <span>· MIT License © 2025</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
