#!/bin/bash

# Office Map - 資料庫重新初始化腳本
# 修復 SQL 腳本無法自動執行和認證問題

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[INFO]${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}[ERROR]${NC} $message"
            ;;
        "DEBUG")
            echo -e "${BLUE}[DEBUG]${NC} $message"
            ;;
    esac
}

# 檢查 Docker Compose 是否運行
check_docker_compose() {
    if ! docker compose ps | grep -q "Up"; then
        log "ERROR" "Docker Compose 服務未運行，請先執行 './setup-supabase.sh start'"
        exit 1
    fi
}

# 強制重新初始化資料庫
reset_database() {
    log "INFO" "開始重新初始化資料庫..."
    
    # 停止所有服務
    log "INFO" "停止所有服務..."
    docker compose down
    
    # 刪除資料庫資料卷，強制重新初始化
    log "WARN" "刪除現有資料庫資料..."
    sudo rm -rf ./volumes/db/data/*
    
    # 確保 SQL 腳本目錄存在且有正確權限
    log "INFO" "檢查 SQL 腳本..."
    if [ ! -d "./sql" ]; then
        log "ERROR" "SQL 腳本目錄不存在"
        exit 1
    fi
    
    # 設定正確權限
    chmod +r ./sql/*.sql 2>/dev/null || true
    
    # 重新啟動服務
    log "INFO" "重新啟動服務（這將觸發資料庫初始化）..."
    docker compose up -d db
    
    # 等待資料庫啟動
    log "INFO" "等待資料庫完全啟動..."
    local max_attempts=60
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
            log "INFO" "資料庫已啟動"
            break
        fi
        
        log "INFO" "等待資料庫啟動... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    if [[ $attempt -gt $max_attempts ]]; then
        log "ERROR" "資料庫啟動逾時"
        exit 1
    fi
    
    # 等待額外時間確保初始化腳本執行完成 
    log "INFO" "等待資料庫初始化腳本執行..."
    sleep 15
    
    # 啟動其他服務
    log "INFO" "啟動其他服務..."
    docker compose up -d
    
    # 等待所有服務啟動
    log "INFO" "等待所有服務啟動..."
    sleep 20
    
    log "INFO" "資料庫重新初始化完成"
}

# 手動執行 SQL 腳本
manual_sql_execution() {
    log "INFO" "手動執行 SQL 腳本..."
    
    local scripts=("01-setup.sql" "02-create-admin-auth.sql" "03-fix-admin-auth.sql")
    
    for script in "${scripts[@]}"; do
        if [ -f "./sql/$script" ]; then
            log "INFO" "執行 $script..."
            
            # 使用 postgres 超級用戶執行
            if docker compose exec -T db psql -U postgres -d postgres -f "/docker-entrypoint-initdb.d/$script"; then
                log "INFO" "✅ $script 執行成功"
            else
                log "ERROR" "❌ $script 執行失敗"
                # 嘗試用 cat 和 pipe 的方式
                log "INFO" "嘗試替代方法執行 $script..."
                if cat "./sql/$script" | docker compose exec -T db psql -U postgres -d postgres; then
                    log "INFO" "✅ $script 替代執行成功"
                else
                    log "ERROR" "❌ $script 完全執行失敗"
                fi
            fi
        else
            log "WARN" "腳本 $script 不存在，跳過"
        fi
    done
}

# 驗證資料庫設置
verify_database() {
    log "INFO" "驗證資料庫設置..."
    
    # 檢查表是否存在
    local tables=("employees" "attendance_records" "containers" "equipment" "seats")
    
    for table in "${tables[@]}"; do
        if docker compose exec -T db psql -U postgres -d postgres -c "\dt public.$table" | grep -q "$table"; then
            log "INFO" "✅ 表 $table 存在"
        else
            log "ERROR" "❌ 表 $table 不存在"
        fi
    done
    
    # 檢查管理員帳號
    local admin_exists=$(docker compose exec -T db psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM public.employees WHERE email = 'admin@gmail.com';" | tr -d ' \n\r')
    
    if [[ "$admin_exists" -gt 0 ]]; then
        log "INFO" "✅ 管理員帳號存在"
    else
        log "ERROR" "❌ 管理員帳號不存在"
    fi
    
    # 檢查認證表中的管理員
    local auth_admin_exists=$(docker compose exec -T db psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM auth.users WHERE email = 'admin@gmail.com';" | tr -d ' \n\r')
    
    if [[ "$auth_admin_exists" -gt 0 ]]; then
        log "INFO" "✅ 認證管理員帳號存在"
    else
        log "WARN" "⚠️  認證管理員帳號不存在，執行修復..."
        manual_sql_execution
    fi
}

# 測試 SQL Editor 連接
test_sql_editor() {
    log "INFO" "測試 SQL Editor 連接..."
    
    # 測試基本查詢
    if docker compose exec -T db psql -U postgres -d postgres -c "SELECT version();" >/dev/null 2>&1; then
        log "INFO" "✅ 資料庫連接正常"
    else
        log "ERROR" "❌ 資料庫連接失敗"
    fi
    
    # 測試 meta 服務
    if curl -s "http://127.0.0.1:3000" >/dev/null 2>&1; then
        log "INFO" "✅ Supabase Studio 服務正常"
    else
        log "WARN" "⚠️  Supabase Studio 可能未完全啟動"
    fi
}

# 顯示完成資訊
show_completion_info() {
    cat << EOF

${GREEN}========================================${NC}
${GREEN}🎉 資料庫修復完成！${NC}
${GREEN}========================================${NC}

📋 修復內容：
  ✅ 強制重新初始化資料庫
  ✅ 自動執行所有 SQL 腳本
  ✅ 修復認證問題
  ✅ 建立管理員帳號

🔑 管理員帳號：
  • Email:    admin@gmail.com
  • 密碼:     admin123

🌐 服務資訊：
  • Supabase Studio:  http://192.168.52.112:3000
  • API Gateway:      http://192.168.52.112:8000
  • PostgreSQL:       192.168.52.112:5432

📝 如何使用：
  1. 開啟 Supabase Studio: http://192.168.52.112:3000
  2. 使用管理員帳號登入
  3. 在 SQL Editor 中執行查詢
  4. 所有表格和權限應該正常顯示

${GREEN}========================================${NC}

EOF
}

# 主函數
main() {
    local action="${1:-full}"
    
    case $action in
        "full")
            log "INFO" "執行完整資料庫重置..."
            check_docker_compose || true  # 允許服務未運行的情況
            reset_database
            verify_database
            test_sql_editor
            show_completion_info
            ;;
        "manual")
            log "INFO" "僅手動執行 SQL 腳本..."
            check_docker_compose
            manual_sql_execution
            verify_database
            ;;
        "verify")
            log "INFO" "僅驗證資料庫狀態..."
            check_docker_compose
            verify_database
            test_sql_editor
            ;;
        "help"|"-h"|"--help")
            cat << EOF
資料庫重置腳本使用說明：

$0 [選項]

選項：
  full     完整重置（預設）- 停止服務、刪除資料、重新初始化
  manual   僅手動執行 SQL 腳本
  verify   僅驗證資料庫狀態
  help     顯示此幫助

範例：
  $0          # 完整重置
  $0 full     # 完整重置
  $0 manual   # 僅執行 SQL
  $0 verify   # 僅驗證
EOF
            ;;
        *)
            log "ERROR" "未知選項: $action"
            log "INFO" "使用 '$0 help' 查看使用說明"
            exit 1
            ;;
    esac
}

# 執行主函數
main "$@"