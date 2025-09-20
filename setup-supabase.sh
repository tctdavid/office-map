#!/bin/bash

# Office Map - Supabase 自託管安裝腳本
# 基於官方 Supabase Self-Hosting Docker Compose 簡化版本
# 目標網域：192.168.52.112

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 全域變數
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/supabase-setup.log"
DOMAIN="192.168.52.112"

# 日誌函數
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE"
            ;;
    esac
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# 顯示幫助資訊
show_help() {
    cat << EOF
Office Map - Supabase 自託管安裝腳本

使用方法: $0 [選項] [命令]

命令:
  install     完整安裝 Supabase 自託管環境
  start       啟動 Supabase 服務
  stop        停止 Supabase 服務
  restart     重新啟動 Supabase 服務
  status      顯示服務狀態
  logs        顯示服務日誌
  clean       清理所有資料（危險操作）
  help        顯示此幫助資訊

選項:
  --force     強制執行（覆蓋現有配置）
  --debug     啟用除錯模式

範例:
  $0 install              # 完整安裝
  $0 start                # 啟動服務
  $0 logs kong            # 顯示 Kong 服務日誌
  $0 clean --force        # 強制清理所有資料

EOF
}

# 檢查依賴項
check_dependencies() {
    log "INFO" "檢查系統依賴項..."
    
    # 檢查 Docker
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker 未安裝。請先安裝 Docker。"
        exit 1
    fi
    
    # 檢查 Docker Compose
    if ! docker compose version &> /dev/null; then
        log "ERROR" "Docker Compose 未安裝。請先安裝 Docker Compose。"
        exit 1
    fi
    
    # 檢查磁碟空間
    local available_space=$(df -BG "$SCRIPT_DIR" | awk 'NR==2{print $4}' | sed 's/G//')
    if [[ $available_space -lt 5 ]]; then
        log "WARN" "可用磁碟空間不足 5GB，可能影響安裝"
    fi
    
    log "INFO" "依賴項檢查完成"
}

# 檢查連接埠
check_ports() {
    log "INFO" "檢查連接埠可用性..."
    
    local ports=(3000 8000 5432)
    local blocked_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            blocked_ports+=($port)
        fi
    done
    
    if [[ ${#blocked_ports[@]} -gt 0 ]]; then
        log "WARN" "以下連接埠已被佔用: ${blocked_ports[*]}"
        read -p "是否繼續安裝？[y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "安裝已取消"
            exit 0
        fi
    fi
    
    log "INFO" "連接埠檢查完成"
}

# 建立目錄結構
create_directories() {
    log "INFO" "建立必要的目錄..."
    
    mkdir -p "$SCRIPT_DIR/volumes/db/data"
    mkdir -p "$SCRIPT_DIR/volumes/storage"
    mkdir -p "$SCRIPT_DIR/config"
    mkdir -p "$SCRIPT_DIR/sql"
    
    log "INFO" "目錄建立完成"
}

# 拉取 Docker 映像檔
pull_images() {
    log "INFO" "拉取 Docker 映像檔..."
    
    docker compose pull
    
    log "INFO" "映像檔拉取完成"
}

# 啟動服務
start_services() {
    log "INFO" "啟動 Supabase 服務..."
    
    docker compose up -d
    
    log "INFO" "等待服務啟動..."
    sleep 30
    
    # 檢查服務狀態
    if docker compose ps | grep -q "Up"; then
        log "INFO" "Supabase 服務啟動成功"
    else
        log "ERROR" "服務啟動失敗，請檢查日誌"
        return 1
    fi
}

# 等待服務就緒
wait_for_services() {
    log "INFO" "等待服務就緒..."
    
    local max_attempts=30
    local attempt=1
    
    # 等待資料庫
    while [[ $attempt -le $max_attempts ]]; do
        if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
            log "INFO" "資料庫已就緒"
            break
        fi
        
        log "INFO" "等待資料庫啟動... ($attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log "ERROR" "資料庫啟動逾時"
        return 1
    fi
    
    # 等待 API Gateway
    attempt=1
    while [[ $attempt -le $max_attempts ]]; do
        if curl -s "http://$DOMAIN:8000/health" >/dev/null 2>&1; then
            log "INFO" "API Gateway 已就緒"
            break
        fi
        
        log "INFO" "等待 API Gateway 啟動... ($attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log "WARN" "API Gateway 可能未完全啟動，但繼續進行"
    fi
}

# 執行健康檢查
health_check() {
    log "INFO" "執行健康檢查..."
    
    # 檢查 Studio
    if curl -s "http://$DOMAIN:3000" >/dev/null 2>&1; then
        log "INFO" "✅ Supabase Studio 運行正常"
    else
        log "WARN" "⚠️  Supabase Studio 可能未就緒"
    fi
    
    # 檢查 API Gateway
    if curl -s "http://$DOMAIN:8000" >/dev/null 2>&1; then
        log "INFO" "✅ API Gateway 運行正常"
    else
        log "WARN" "⚠️  API Gateway 可能未就緒"
    fi
    
    # 檢查資料庫
    if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
        log "INFO" "✅ PostgreSQL 資料庫運行正常"
    else
        log "WARN" "⚠️  PostgreSQL 資料庫可能未就緒"
    fi
}

# 顯示完成資訊
show_completion_info() {
    cat << EOF

${GREEN}========================================${NC}
${GREEN}🎉 Office Map Supabase 安裝完成！${NC}
${GREEN}========================================${NC}

📋 服務資訊：
  • Supabase Studio:  http://$DOMAIN:3000
  • API Gateway:      http://$DOMAIN:8000
  • PostgreSQL:       $DOMAIN:5432

🔑 管理員帳號：
  • Email:    admin@gmail.com
  • 密碼:     admin123

🔧 有用的命令：
  • 檢視狀態:   $0 status
  • 檢視日誌:   $0 logs
  • 停止服務:   $0 stop
  • 重新啟動:   $0 restart

📚 前端連接配置：
請將前端的 Supabase 客戶端設定為：
  • URL: http://$DOMAIN:8000
  • Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

${GREEN}========================================${NC}

EOF
}

# 主要安裝函數
install() {
    log "INFO" "開始 Office Map Supabase 安裝..."
    
    check_dependencies
    check_ports
    create_directories
    pull_images
    start_services
    wait_for_services
    health_check
    show_completion_info
    
    log "INFO" "安裝完成！"
}

# 啟動服務
start() {
    log "INFO" "啟動 Supabase 服務..."
    docker compose up -d
    wait_for_services
    log "INFO" "服務啟動完成"
}

# 停止服務
stop() {
    log "INFO" "停止 Supabase 服務..."
    docker compose down
    log "INFO" "服務已停止"
}

# 重新啟動服務
restart() {
    log "INFO" "重新啟動 Supabase 服務..."
    docker compose restart
    wait_for_services
    log "INFO" "服務重新啟動完成"
}

# 顯示服務狀態
status() {
    log "INFO" "檢查服務狀態..."
    docker compose ps
}

# 顯示日誌
logs() {
    local service="${1:-}"
    if [[ -n "$service" ]]; then
        docker compose logs -f "$service"
    else
        docker compose logs -f
    fi
}

# 清理資料
clean() {
    log "WARN" "⚠️  這將刪除所有 Supabase 資料！"
    read -p "確定要繼續嗎？請輸入 'YES' 確認: " confirm
    
    if [[ "$confirm" != "YES" ]]; then
        log "INFO" "清理已取消"
        return 0
    fi
    
    log "INFO" "停止所有服務..."
    docker compose down -v
    
    log "INFO" "刪除資料目錄..."
    sudo rm -rf "$SCRIPT_DIR/volumes/db/data"
    sudo rm -rf "$SCRIPT_DIR/volumes/storage"
    
    log "INFO" "清理 Docker 映像檔..."
    docker compose down --rmi all
    
    log "INFO" "清理完成"
}

# 主程式
main() {
    # 解析命令列參數
    local command=""
    local force=false
    local debug=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            install|start|stop|restart|status|logs|clean|help)
                command="$1"
                shift
                ;;
            --force)
                force=true
                shift
                ;;
            --debug)
                debug=true
                set -x
                shift
                ;;
            *)
                if [[ -z "$command" ]]; then
                    command="$1"
                fi
                shift
                ;;
        esac
    done
    
    # 如果沒有指定命令，顯示幫助
    if [[ -z "$command" ]]; then
        show_help
        exit 0
    fi
    
    # 切換到腳本目錄
    cd "$SCRIPT_DIR"
    
    # 執行命令
    case $command in
        install)
            install
            ;;
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            status
            ;;
        logs)
            logs "${@}"
            ;;
        clean)
            clean
            ;;
        help)
            show_help
            ;;
        *)
            log "ERROR" "未知的命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 執行主程式
main "$@"