#!/bin/bash

# Supabase Self-Hosted 啟動腳本
# 官方標準做法

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# 檢查必要檔案
check_requirements() {
    log "檢查必要檔案..."
    
    if [[ ! -f ".env" ]]; then
        error "找不到 .env 檔案"
        echo "請確保 .env 檔案存在並包含正確的配置"
        exit 1
    fi
    
    if [[ ! -f "docker-compose.yml" ]]; then
        error "找不到 docker-compose.yml 檔案"
        exit 1
    fi
    
    if [[ ! -f "volumes/api/kong.yml" ]]; then
        error "找不到 Kong 配置檔案"
        exit 1
    fi
    
    log "所有必要檔案檢查完成 ✓"
}

# 檢查 Docker
check_docker() {
    log "檢查 Docker 環境..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker 未安裝"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error "Docker Compose 未安裝"
        exit 1
    fi
    
    log "Docker 環境檢查完成 ✓"
}

# 創建必要目錄
create_directories() {
    log "創建必要目錄..."
    
    directories=(
        "volumes/db/data"
        "volumes/db/init"
        "volumes/storage"
        "volumes/functions"
        "volumes/logs"
    )
    
    for dir in "${directories[@]}"; do
        mkdir -p "$dir"
        log "創建目錄: $dir"
    done
}

# 複製初始化檔案
setup_init_files() {
    log "設定初始化檔案..."
    
    # 從父目錄複製必要的 SQL 檔案
    if [[ -d "../volumes/db" ]]; then
        cp -r ../volumes/db/*.sql volumes/db/ 2>/dev/null || true
    fi
    
    # 複製項目特定的 SQL 腳本
    if [[ -d "../sql-scripts" ]]; then
        cp ../sql-scripts/*.sql volumes/db/init/ 2>/dev/null || true
    fi
    
    log "初始化檔案設定完成"
}

# 啟動服務
start_services() {
    log "啟動 Supabase 服務..."
    
    # 檢查是否有現有服務在運行
    if docker-compose ps -q | grep -q .; then
        warn "檢測到現有服務正在運行"
        read -p "是否要停止現有服務並重新啟動？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            log "停止現有服務..."
            docker-compose down
        else
            log "取消操作"
            exit 0
        fi
    fi
    
    # 拉取最新映像
    log "拉取 Docker 映像..."
    docker-compose pull
    
    # 啟動服務
    log "啟動服務..."
    docker-compose up -d
    
    log "等待服務啟動..."
    sleep 30
}

# 健康檢查
health_check() {
    log "執行健康檢查..."
    
    # 檢查 Kong API Gateway
    if curl -s http://localhost:8000 >/dev/null 2>&1; then
        log "Kong API Gateway 運行正常 ✓"
    else
        warn "Kong API Gateway 可能未正常啟動"
    fi
    
    # 檢查 Studio
    if curl -s http://localhost:8000 >/dev/null 2>&1; then
        log "Supabase Studio 運行正常 ✓"
    else
        warn "Supabase Studio 可能未正常啟動"
    fi
    
    # 檢查 REST API
    if curl -s -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0" http://localhost:8000/rest/v1/ >/dev/null 2>&1; then
        log "REST API 運行正常 ✓"
    else
        warn "REST API 可能未正常啟動"
    fi
}

# 顯示訪問資訊
show_access_info() {
    log "=== Supabase 自託管環境已啟動 ==="
    echo ""
    echo -e "${BLUE}訪問資訊：${NC}"
    echo "• Supabase Studio: http://localhost:8000"
    echo "• REST API: http://localhost:8000/rest/v1/"
    echo "• Auth API: http://localhost:8000/auth/v1/"
    echo "• Storage API: http://localhost:8000/storage/v1/"
    echo "• Realtime: ws://localhost:8000/realtime/v1/"
    echo ""
    echo -e "${BLUE}API Keys：${NC}"
    echo "• Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
    echo "• Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
    echo ""
    echo -e "${BLUE}管理命令：${NC}"
    echo "• 查看服務狀態: docker-compose ps"
    echo "• 查看日誌: docker-compose logs -f [service_name]"
    echo "• 停止服務: docker-compose down"
    echo "• 重啟服務: docker-compose restart"
    echo ""
    echo -e "${GREEN}設定完成！請等待所有服務完全啟動後再進行操作。${NC}"
}

# 主函數
main() {
    echo -e "${BLUE}=== Supabase 官方自託管環境啟動腳本 ===${NC}"
    echo ""
    
    check_requirements
    check_docker
    create_directories
    setup_init_files
    start_services
    health_check
    show_access_info
}

# 執行主函數
main