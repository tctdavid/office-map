#!/bin/bash

# 自託管 Supabase 設定腳本 (改進版)
# 此腳本會初始化並啟動自託管 Supabase 環境
# 支援重複執行和智能檢查

set -e

# 全域變數
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/.env.local"
BACKUP_DIR="${SCRIPT_DIR}/backups"
LOG_FILE="${SCRIPT_DIR}/setup.log"
FORCE_MODE=false
SILENT_MODE=false
DEBUG_MODE=false

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日誌函數
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO") echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
        "WARN") echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        "DEBUG") [[ $DEBUG_MODE == true ]] && echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
    esac
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# 處理命令列參數
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE_MODE=true
                shift
                ;;
            --silent)
                SILENT_MODE=true
                shift
                ;;
            --debug)
                DEBUG_MODE=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log "ERROR" "未知參數: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# 顯示說明
show_help() {
    cat << EOF
自託管 Supabase 設定腳本

使用方法:
  $0 [選項]

選項:
  --force     強制重新設定（跳過所有確認）
  --silent    靜默模式（最少輸出）
  --debug     除錯模式（詳細輸出）
  --help      顯示此說明

範例:
  $0                    # 互動式設定
  $0 --force           # 強制重新設定
  $0 --silent --force  # 靜默強制設定
EOF
}

# 檢查必要的依賴
check_dependencies() {
    log "INFO" "📋 檢查依賴項目..."
    
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log "ERROR" "Docker Compose 未安裝，請先安裝 Docker Compose"
        exit 1
    fi
    
    # 檢查 Docker 版本
    local docker_version=$(docker --version | grep -o '[0-9]\+\.[0-9]\+' | head -1)
    log "DEBUG" "Docker 版本: $docker_version"
    
    # 檢查可用磁碟空間（至少需要 2GB）
    local available_space=$(df . | awk 'NR==2 {print $4}')
    local required_space=2097152  # 2GB in KB
    
    if [[ $available_space -lt $required_space ]]; then
        log "WARN" "可用磁碟空間不足 2GB，可能會影響運行"
    fi
    
    log "INFO" "✅ 依賴檢查完成"
}

# 檢查端口可用性
check_ports() {
    log "INFO" "🔌 檢查必要端口..."
    local ports=(3000 8000 5432)
    local occupied_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            occupied_ports+=($port)
            log "WARN" "端口 $port 已被占用"
        else
            log "DEBUG" "端口 $port 可用"
        fi
    done
    
    if [[ ${#occupied_ports[@]} -gt 0 ]] && [[ $FORCE_MODE != true ]]; then
        log "WARN" "以下端口被占用: ${occupied_ports[*]}"
        if [[ $SILENT_MODE != true ]]; then
            read -p "是否繼續？可能會造成衝突 (y/N): " continue_setup
            if [[ ! $continue_setup =~ ^[Yy]$ ]]; then
                log "INFO" "設定已取消"
                exit 0
            fi
        fi
    fi
}

# 檢查服務狀態
check_service_status() {
    log "INFO" "🔍 檢查現有服務狀態..."
    
    if docker compose ps --format json 2>/dev/null | jq -e '.[] | select(.State == "running")' >/dev/null 2>&1; then
        log "INFO" "發現運行中的服務"
        
        if [[ $FORCE_MODE != true ]] && [[ $SILENT_MODE != true ]]; then
            echo ""
            echo "發現以下服務正在運行："
            docker compose ps --format table
            echo ""
            echo "選項："
            echo "1) 重啟服務"
            echo "2) 停止服務並重新設定"
            echo "3) 保持現有服務不變"
            echo "4) 取消設定"
            echo ""
            read -p "請選擇 (1-4): " choice
            
            case $choice in
                1)
                    log "INFO" "重啟現有服務..."
                    docker compose restart
                    return 0
                    ;;
                2)
                    log "INFO" "停止現有服務..."
                    docker compose down
                    ;;
                3)
                    log "INFO" "保持現有服務，跳過啟動步驟"
                    SKIP_START=true
                    return 0
                    ;;
                4)
                    log "INFO" "設定已取消"
                    exit 0
                    ;;
                *)
                    log "WARN" "無效選擇，繼續設定..."
                    ;;
            esac
        elif [[ $FORCE_MODE == true ]]; then
            log "INFO" "強制模式：停止現有服務"
            docker compose down
        fi
    else
        log "DEBUG" "沒有發現運行中的服務"
    fi
}

# 備份現有配置
backup_config() {
    if [[ -f "$ENV_FILE" ]]; then
        log "INFO" "🗂️  備份現有配置..."
        
        mkdir -p "$BACKUP_DIR"
        local backup_file="$BACKUP_DIR/.env.local.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$ENV_FILE" "$backup_file"
        
        log "INFO" "配置已備份至: $backup_file"
        echo "$backup_file" > "$BACKUP_DIR/latest_backup.txt"
    fi
}

# 管理 JWT Secret
manage_jwt_secret() {
    log "INFO" "🔐 管理 JWT 密鑰..."
    
    # 檢查現有的 JWT Secret
    if [[ -f "$ENV_FILE" ]] && grep -q "JWT_SECRET=" "$ENV_FILE"; then
        local existing_jwt=$(grep "JWT_SECRET=" "$ENV_FILE" | cut -d'=' -f2)
        
        if [[ -n "$existing_jwt" ]] && [[ "$existing_jwt" != "your-jwt-secret-here" ]]; then
            log "INFO" "發現現有的 JWT Secret"
            
            if [[ $FORCE_MODE != true ]] && [[ $SILENT_MODE != true ]]; then
                read -p "是否保留現有的 JWT Secret？(保留可避免使用者重新登入) (Y/n): " keep_jwt
                if [[ $keep_jwt =~ ^[Nn]$ ]]; then
                    generate_new_jwt_secret
                else
                    JWT_SECRET="$existing_jwt"
                    log "INFO" "保留現有 JWT Secret"
                fi
            else
                JWT_SECRET="$existing_jwt"
                log "INFO" "保留現有 JWT Secret"
            fi
        else
            generate_new_jwt_secret
        fi
    else
        generate_new_jwt_secret
    fi
}

# 生成新的 JWT 密鑰
generate_new_jwt_secret() {
    log "INFO" "生成新的 JWT 密鑰..."
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    log "DEBUG" "JWT_SECRET: $JWT_SECRET"
}

# 設定環境變數
setup_env() {
    log "INFO" "⚙️  設定環境變數..."
    
    # 檢查 .env.docker 範本
    if [[ ! -f .env.docker ]]; then
        log "ERROR" ".env.docker 範本檔案不存在"
        exit 1
    fi
    
    # 如果 .env.local 不存在，從範本複製
    if [[ ! -f "$ENV_FILE" ]]; then
        cp .env.docker "$ENV_FILE"
        log "INFO" "📝 已建立 .env.local 檔案"
    fi
    
    # 管理 JWT Secret
    manage_jwt_secret
    
    # 更新 .env.local 中的 JWT_SECRET
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" "$ENV_FILE"
    fi
    
    log "INFO" "✅ 環境變數設定完成"
}

# 檢查資料庫狀態
check_database_status() {
    log "INFO" "🗃️  檢查資料庫狀態..."
    
    if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
        log "INFO" "資料庫正在運行，檢查初始化狀態..."
        
        # 檢查是否已有員工表（表示已初始化）
        if docker compose exec -T db psql -U postgres -d postgres -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema='public' AND table_name='employees');" 2>/dev/null | grep -q "t"; then
            log "INFO" "資料庫已初始化"
            
            if [[ $FORCE_MODE != true ]] && [[ $SILENT_MODE != true ]]; then
                read -p "資料庫已存在數據，是否重新初始化？(y/N): " reinit_db
                if [[ $reinit_db =~ ^[Yy]$ ]]; then
                    FORCE_DB_INIT=true
                else
                    SKIP_DB_INIT=true
                fi
            else
                SKIP_DB_INIT=true
            fi
        else
            log "INFO" "資料庫未初始化，將執行初始化腳本"
        fi
    else
        log "DEBUG" "資料庫未運行"
    fi
}

# 建立必要的目錄
create_directories() {
    log "INFO" "📁 建立必要的目錄..."
    
    local directories=(
        "volumes/db/data"
        "volumes/db/init"
        "volumes/storage"
        "volumes/api"
        "volumes/logs"
        "$BACKUP_DIR"
    )
    
    for dir in "${directories[@]}"; do
        if [[ ! -d "$dir" ]]; then
            mkdir -p "$dir"
            log "DEBUG" "建立目錄: $dir"
        else
            log "DEBUG" "目錄已存在: $dir"
        fi
    done
    
    # 設定正確的權限
    chmod -R 755 volumes/ 2>/dev/null || log "WARN" "無法設定 volumes 目錄權限"
    
    log "INFO" "✅ 目錄建立完成"
}

# 初始化資料庫腳本
setup_database_scripts() {
    if [[ $SKIP_DB_INIT == true ]]; then
        log "INFO" "跳過資料庫腳本設定"
        return 0
    fi
    
    log "INFO" "📚 設定資料庫初始化腳本..."
    
    # 如果強制重新初始化，清空 init 目錄
    if [[ $FORCE_DB_INIT == true ]]; then
        log "INFO" "清空現有初始化腳本..."
        rm -f volumes/db/init/*-stage-*.sql
        rm -f volumes/db/init/*-fix-*.sql
    fi
    
    # 複製 SQL 腳本到 init 目錄
    if [[ -d "sql-scripts" ]]; then
        log "INFO" "複製 SQL 腳本..."
        
        local scripts=(
            "stage-1-basic-setup.sql:02-stage-1-basic-setup.sql"
            "stage-2-employees-table.sql:03-stage-2-employees-table.sql"
            "stage-3-main-tables.sql:04-stage-3-main-tables.sql"
            "stage-4-relational-tables.sql:05-stage-4-relational-tables.sql"
            "stage-5-seating-tables.sql:06-stage-5-seating-tables.sql"
            "stage-6-advanced-permissions.sql:07-stage-6-advanced-permissions.sql"
            "stage-7-final-setup.sql:08-stage-7-final-setup.sql"
            "fix-self-hosted-storage.sql:09-fix-storage.sql"
        )
        
        for script_mapping in "${scripts[@]}"; do
            local source_script=$(echo "$script_mapping" | cut -d':' -f1)
            local target_script=$(echo "$script_mapping" | cut -d':' -f2)
            
            if [[ -f "sql-scripts/$source_script" ]]; then
                cp "sql-scripts/$source_script" "volumes/db/init/$target_script"
                log "DEBUG" "複製: $source_script -> $target_script"
            else
                log "WARN" "腳本不存在: sql-scripts/$source_script"
            fi
        done
        
        log "INFO" "✅ SQL 腳本複製完成"
    else
        log "WARN" "⚠️  警告：sql-scripts 目錄不存在，請確保已有資料庫腳本"
        
        if [[ $SILENT_MODE != true ]]; then
            read -p "是否繼續設定？(y/N): " continue_without_scripts
            if [[ ! $continue_without_scripts =~ ^[Yy]$ ]]; then
                log "INFO" "設定已取消"
                exit 1
            fi
        fi
    fi
}

# 啟動服務
start_services() {
    if [[ $SKIP_START == true ]]; then
        log "INFO" "跳過服務啟動"
        return 0
    fi
    
    log "INFO" "🚀 啟動 Supabase 服務..."
    
    # 檢查環境檔案
    if [[ ! -f "$ENV_FILE" ]]; then
        log "ERROR" "環境檔案不存在: $ENV_FILE"
        exit 1
    fi
    
    # 使用 .env.local 作為環境變數檔案
    if docker compose --env-file "$ENV_FILE" up -d; then
        log "INFO" "✅ 服務啟動完成"
    else
        log "ERROR" "服務啟動失敗"
        exit 1
    fi
}

# 等待服務就緒
wait_for_services() {
    if [[ $SKIP_START == true ]]; then
        log "INFO" "跳過服務等待"
        return 0
    fi
    
    log "INFO" "⏳ 等待服務就緒..."
    
    # 等待資料庫就緒
    log "INFO" "等待資料庫啟動..."
    local timeout=300
    local count=0
    
    while ! docker compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        count=$((count + 1))
        
        if [[ $count -eq 30 ]]; then  # 每60秒顯示一次進度
            log "INFO" "仍在等待資料庫啟動... (${timeout}s 剩餘)"
            count=0
        fi
        
        if [[ $timeout -le 0 ]]; then
            log "ERROR" "資料庫啟動超時"
            log "INFO" "嘗試查看資料庫日誌："
            docker compose logs db | tail -20
            exit 1
        fi
    done
    
    log "INFO" "✅ 資料庫已就緒"
    
    # 等待 Kong API Gateway 就緒
    log "INFO" "等待 API Gateway 啟動..."
    timeout=120
    count=0
    
    while ! curl -f http://localhost:8000/health > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        count=$((count + 1))
        
        if [[ $count -eq 15 ]]; then  # 每30秒顯示一次進度
            log "INFO" "仍在等待 API Gateway 啟動... (${timeout}s 剩餘)"
            count=0
        fi
        
        if [[ $timeout -le 0 ]]; then
            log "WARN" "API Gateway 啟動超時，但可能仍在初始化中"
            log "INFO" "嘗試查看 Kong 日誌："
            docker compose logs kong | tail -10
            break
        fi
    done
    
    # 健康檢查
    perform_health_check
    
    log "INFO" "✅ 服務就緒檢查完成"
}

# 執行健康檢查
perform_health_check() {
    log "INFO" "🏥 執行健康檢查..."
    
    local services=(
        "http://localhost:3000:Studio"
        "http://localhost:8000/health:API Gateway"
    )
    
    for service in "${services[@]}"; do
        local url=$(echo "$service" | cut -d':' -f1-2)
        local name=$(echo "$service" | cut -d':' -f3)
        
        if curl -f "$url" > /dev/null 2>&1; then
            log "INFO" "✅ $name 健康"
        else
            log "WARN" "⚠️ $name 可能未完全就緒"
        fi
    done
}

# 顯示設定資訊
show_info() {
    log "INFO" ""
    log "INFO" "🎉 自託管 Supabase 設定完成！"
    log "INFO" ""
    log "INFO" "📊 服務存取資訊："
    log "INFO" "  • Supabase Studio: http://localhost:3000"
    log "INFO" "  • API Gateway: http://localhost:8000"
    log "INFO" "  • PostgreSQL: localhost:5432"
    log "INFO" ""
    log "INFO" "🔑 重要資訊："
    if [[ -n "$JWT_SECRET" ]]; then
        log "INFO" "  • JWT Secret: $JWT_SECRET"
    fi
    log "INFO" "  • 資料庫密碼：請查看 $ENV_FILE 檔案"
    log "INFO" "  • 設定日誌：$LOG_FILE"
    if [[ -f "$BACKUP_DIR/latest_backup.txt" ]]; then
        local latest_backup=$(cat "$BACKUP_DIR/latest_backup.txt")
        log "INFO" "  • 配置備份：$latest_backup"
    fi
    log "INFO" ""
    log "INFO" "📝 下步驟："
    log "INFO" "  1. 開啟 Studio 查看資料庫狀態"
    log "INFO" "  2. 建立管理員帳號"
    log "INFO" "  3. 測試檔案上傳功能"
    log "INFO" "  4. 更新前端應用的 Supabase 設定"
    log "INFO" ""
    log "INFO" "🔧 有用的指令："
    log "INFO" "  • 查看日誌: docker compose logs -f [service-name]"
    log "INFO" "  • 停止服務: docker compose down"
    log "INFO" "  • 重啟服務: docker compose restart"
    log "INFO" "  • 測試服務: node test-self-hosted.js"
    log "INFO" ""
    
    # 執行快速測試
    if command -v node &> /dev/null && [[ -f "test-self-hosted.js" ]]; then
        log "INFO" "🧪 執行快速健康檢查..."
        if timeout 30 node test-self-hosted.js 2>/dev/null; then
            log "INFO" "✅ 所有服務健康檢查通過"
        else
            log "WARN" "⚠️ 部分服務可能需要更多時間初始化"
        fi
    fi
}

# 錯誤處理
handle_error() {
    local exit_code=$?
    log "ERROR" "設定過程中發生錯誤 (退出代碼: $exit_code)"
    
    if [[ -f "$BACKUP_DIR/latest_backup.txt" ]]; then
        local latest_backup=$(cat "$BACKUP_DIR/latest_backup.txt")
        log "INFO" "可以使用以下指令恢復配置："
        log "INFO" "cp '$latest_backup' '$ENV_FILE'"
    fi
    
    log "INFO" "查看日誌了解詳細錯誤信息：cat '$LOG_FILE'"
    exit $exit_code
}

# 清理函數
cleanup() {
    log "INFO" "執行清理..."
    # 可以在這裡添加清理邏輯
}

# 主執行流程
main() {
    # 設定錯誤處理
    trap handle_error ERR
    trap cleanup EXIT
    
    # 初始化日誌
    echo "# Supabase 自託管設定日誌 - $(date)" > "$LOG_FILE"
    
    log "INFO" "🚀 開始設定自託管 Supabase 環境..."
    log "DEBUG" "腳本參數: $*"
    
    # 解析命令列參數
    parse_arguments "$@"
    
    # 執行設定步驟
    check_dependencies
    check_ports
    check_service_status
    backup_config
    setup_env
    create_directories
    check_database_status
    setup_database_scripts
    start_services
    wait_for_services
    show_info
    
    log "INFO" "🎊 設定完成！"
}

# 執行主函數
main "$@"