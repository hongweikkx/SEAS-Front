# 默认配置
IMAGE_NAME ?= seas-frontend
IMAGE_TAG ?= latest
API_URL ?= http://localhost:8000/seas/api/v1
CONTAINER_NAME ?= seas-frontend
PORT ?= 80

.PHONY: help docker-build docker-run docker-stop docker-clean

help: ## 显示帮助信息
	@echo "SEAS 前端 Docker 部署命令"
	@echo ""
	@echo "用法:"
	@echo "  make docker-build [API_URL=<api-url>]     构建 Docker 镜像"
	@echo "  make docker-run  [PORT=<port>]            运行容器"
	@echo "  make docker-stop                          停止容器"
	@echo "  make docker-clean                         删除镜像和容器"
	@echo ""
	@echo "示例:"
	@echo "  make docker-build API_URL=http://192.168.1.100:8000/seas/api/v1"
	@echo "  make docker-run PORT=8080"

docker-build: ## 构建 Docker 镜像
	docker build \
		--build-arg NEXT_PUBLIC_API_URL=$(API_URL) \
		-t $(IMAGE_NAME):$(IMAGE_TAG) .
	@echo "镜像构建完成: $(IMAGE_NAME):$(IMAGE_TAG)"

docker-run: ## 运行容器
	docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):80 \
		$(IMAGE_NAME):$(IMAGE_TAG)
	@echo "容器已启动，访问 http://localhost:$(PORT)"

docker-stop: ## 停止并删除容器
	docker stop $(CONTAINER_NAME) 2>/dev/null || true
	docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@echo "容器已停止"

docker-clean: docker-stop ## 清理镜像和容器
	docker rmi $(IMAGE_NAME):$(IMAGE_TAG) 2>/dev/null || true
	@echo "镜像已清理"
