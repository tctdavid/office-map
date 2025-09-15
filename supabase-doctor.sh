#!/bin/bash

# Supabase 自託管診斷工具
# 用於檢查系統狀態、映像可用性和服務健康

# 引入主腳本的函數
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/setup-self-hosted.sh" 2>/dev/null || true

# 診斷報告
run_doctor() {
    log "INFO" "🏥 Supabase 自託管診斷工具"
    log "INFO" "==============================="
    echo ""
    
    # 1. 系統檢查
    doctor_check_system
    echo ""
    
    # 2. 網路連接檢查
    doctor_check_network
    echo ""
    
    # 3. 映像可用性檢查
    doctor_check_images
    echo ""
    
    # 4. 服務狀態檢查
    doctor_check_services
    echo ""
    
    # 5. 配置檢查
    doctor_check_config
    echo ""
    
    # 6. 建議
    doctor_recommendations
}

# 系統檢查
doctor_check_system() {
    log "INFO" "🔧 系統環境檢查"
    
    # Docker 版本
    if command -v docker &> /dev/null; then
        local docker_version=$(docker --version)
        log "INFO" "✅ Docker: $docker_version"
    else
        log "ERROR" "❌ Docker 未安裝"
        return 1
    fi
    
    # Docker Compose 版本
    if docker compose version &> /dev/null; then
        local compose_version=$(docker compose version)
        log "INFO" "✅ Docker Compose: $compose_version"
    else
        log "ERROR" "❌ Docker Compose 未安裝或版本過舊"
        return 1
    fi
    
    # jq 可用性
    if command -v jq &> /dev/null; then
        local jq_version=$(jq --version)
        log "INFO" "✅ jq: $jq_version"
    else
        log "WARN" "⚠️  jq 未安裝（標籤解析功能將受限）"
    fi
    
    # 磁碟空間
    local available_space=$(df . | awk 'NR==2 {print $4}')
    local space_gb=$((available_space / 1024 / 1024))
    if [[ $space_gb -lt 2 ]]; then
        log "WARN" "⚠️  可用磁碟空間: ${space_gb}GB（建議至少 2GB）"
    else
        log "INFO" "✅ 磁碟空間充足: ${space_gb}GB"
    fi
    
    # 記憶體
    if [[ -f /proc/meminfo ]]; then
        local mem_total=$(grep MemTotal /proc/meminfo | awk '{print $2}')
        local mem_gb=$((mem_total / 1024 / 1024))
        if [[ $mem_gb -lt 4 ]]; then
            log "WARN" "⚠️  系統記憶體: ${mem_gb}GB（建議至少 4GB）"
        else
            log "INFO" "✅ 記憶體充足: ${mem_gb}GB"
        fi
    fi
}

# 網路連接檢查
doctor_check_network() {
    log "INFO" "🌐 網路連接檢查"
    
    # DNS 解析檢查
    local registries=(
        "registry-1.docker.io"
        "ghcr.io"
        "github.com"
    )
    
    for registry in "${registries[@]}"; do
        if nslookup "$registry" >/dev/null 2>&1; then
            log "INFO" "✅ DNS 解析正常: $registry"
        else
            log "ERROR" "❌ DNS 解析失敗: $registry"
        fi
    done
    
    # HTTP 連接檢查
    local endpoints=(
        "https://registry-1.docker.io/v2/"
        "https://ghcr.io/v2/"
        "https://api.github.com"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s --max-time 10 "$endpoint" >/dev/null 2>&1; then
            log "INFO" "✅ HTTP 連接正常: $endpoint"
        else
            log "WARN" "⚠️  HTTP 連接失敗: $endpoint"
        fi
    done
    
    # 端口檢查
    local ports=(3000 8000 5432 8443)
    for port in "${ports[@]}"; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log "WARN" "⚠️  端口 $port 已被占用"
        else
            log "INFO" "✅ 端口 $port 可用"
        fi
    done
}

# 映像可用性檢查
doctor_check_images() {
    log "INFO" "🐳 映像可用性檢查"
    
    # 載入環境變數
    if [[ -f "$ENV_FILE" ]]; then
        set -a
        source "$ENV_FILE"
        set +a
        log "INFO" "✅ 已載入環境配置: $ENV_FILE"
    else
        log "WARN" "⚠️  環境配置不存在: $ENV_FILE"
        return 1
    fi
    
    local prefix="${REGISTRY_PREFIX:-}"
    if [[ -n "$prefix" ]]; then
        log "INFO" "🔄 使用映像前綴: $prefix"
    fi
    
    # 檢查核心映像
    local critical_images=(
        "${prefix}supabase/postgres:${POSTGRES_TAG:-15.1.1.78}"
        "${prefix}kong:${KONG_TAG:-3.7}"
        "${prefix}supabase/gotrue:${GOTRUE_TAG:-v2.158.1}"
        "${prefix}postgrest/postgrest:${POSTGREST_TAG:-v12.2.3}"
    )
    
    log "INFO" "檢查核心映像..."
    local failed_critical=0
    for image in "${critical_images[@]}"; do
        if docker manifest inspect "$image" >/dev/null 2>&1; then
            log "INFO" "✅ $image"
        else
            log "ERROR" "❌ $image"
            ((failed_critical++))
            
            # 嘗試尋找替代標籤
            local base_image=$(echo "$image" | cut -d':' -f1)
            log "DEBUG" "嘗試尋找 $base_image 的可用標籤..."
            
            # 嘗試常見的替代標籤
            local fallback_tags=("latest" "stable")
            for tag in "${fallback_tags[@]}"; do
                if docker manifest inspect "${base_image}:${tag}" >/dev/null 2>&1; then
                    log "INFO" "  💡 可用替代: ${base_image}:${tag}"
                    break
                fi
            done
        fi
    done
    
    if [[ $failed_critical -gt 0 ]]; then
        log "ERROR" "❌ $failed_critical 個核心映像無法存取"
        log "INFO" "💡 建議解決方案:"
        log "INFO" "  1. 檢查網路連接"
        log "INFO" "  2. 嘗試設定 REGISTRY_PREFIX（如 'ghcr.io/'）"
        log "INFO" "  3. 運行 './setup-self-hosted.sh --resolve-tags' 自動解析可用標籤"
    else
        log "INFO" "✅ 所有核心映像都可存取"
    fi
    
    # 檢查本地映像
    log "INFO" "檢查本地映像快取..."
    local local_images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(supabase|kong|postgrest)" | wc -l)
    log "INFO" "📦 本地已快取 $local_images 個相關映像"
}

# 服務狀態檢查
doctor_check_services() {
    log "INFO" "🔍 服務狀態檢查"
    
    # 檢查 Docker Compose 配置
    if [[ -f "docker-compose.yml" ]]; then
        log "INFO" "✅ Docker Compose 配置存在"
        
        # 驗證配置語法
        if docker compose config >/dev/null 2>&1; then
            log "INFO" "✅ Docker Compose 配置語法正確"
        else
            log "ERROR" "❌ Docker Compose 配置語法錯誤"
            docker compose config 2>&1 | head -5
        fi
    else
        log "ERROR" "❌ docker-compose.yml 不存在"
        return 1
    fi
    
    # 檢查運行中的服務
    local running_services=$(docker compose ps --services --filter status=running 2>/dev/null | wc -l)
    if [[ $running_services -gt 0 ]]; then
        log "INFO" "✅ 發現 $running_services 個運行中的服務"
        docker compose ps --format table
    else
        log "INFO" "ℹ️  沒有運行中的 Supabase 服務"
    fi
    
    # 健康檢查 URL
    if [[ $running_services -gt 0 ]]; then
        log "INFO" "進行服務健康檢查..."
        
        local endpoints=(
            "http://localhost:3000:Studio"
            "http://localhost:8000/health:API Gateway"
            "http://localhost:5432:PostgreSQL"
        )
        
        for endpoint in "${endpoints[@]}"; do
            local url=$(echo "$endpoint" | cut -d':' -f1-2)
            local name=$(echo "$endpoint" | cut -d':' -f3)
            
            if [[ "$name" == "PostgreSQL" ]]; then
                # 特殊處理 PostgreSQL
                if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
                    log "INFO" "✅ $name 健康"
                else
                    log "WARN" "⚠️  $name 無回應"
                fi
            else
                if curl -f -s --max-time 5 "$url" >/dev/null 2>&1; then
                    log "INFO" "✅ $name 健康"
                else
                    log "WARN" "⚠️  $name 無回應"
                fi
            fi
        done
    fi
}

# 配置檢查
doctor_check_config() {
    log "INFO" "⚙️  配置檢查"
    
    # 檢查環境檔案
    local env_files=(".env.docker" ".env.local")
    for file in "${env_files[@]}"; do
        if [[ -f "$file" ]]; then
            log "INFO" "✅ $file 存在"
            
            # 檢查關鍵設定
            local jwt_secret=$(grep "JWT_SECRET=" "$file" | cut -d'=' -f2)
            if [[ -n "$jwt_secret" && "$jwt_secret" != "your-jwt-secret-here" ]]; then
                log "INFO" "✅ JWT Secret 已設定"
            else
                log "WARN" "⚠️  JWT Secret 未設定或使用預設值"
            fi
            
            local postgres_pass=$(grep "POSTGRES_PASSWORD=" "$file" | cut -d'=' -f2)
            if [[ -n "$postgres_pass" && "$postgres_pass" != "your_super_secret_password" ]]; then
                log "INFO" "✅ PostgreSQL 密碼已設定"
            else
                log "WARN" "⚠️  PostgreSQL 密碼使用預設值"
            fi
        else
            log "WARN" "⚠️  $file 不存在"
        fi
    done
    
    # 檢查 SQL 腳本
    if [[ -d "sql-scripts" ]]; then
        local script_count=$(find sql-scripts -name "*.sql" | wc -l)
        log "INFO" "✅ SQL 腳本目錄存在 ($script_count 個檔案)"
    else
        log "WARN" "⚠️  sql-scripts 目錄不存在"
    fi
    
    # 檢查 volumes 目錄
    if [[ -d "volumes" ]]; then
        local volume_size=$(du -sh volumes 2>/dev/null | cut -f1)
        log "INFO" "✅ volumes 目錄存在 ($volume_size)"
    else
        log "INFO" "ℹ️  volumes 目錄尚未建立"
    fi
}

# 建議和解決方案
doctor_recommendations() {
    log "INFO" "💡 建議和解決方案"
    
    log "INFO" "快速修復指令:"
    log "INFO" "  ./setup-self-hosted.sh --resolve-tags  # 自動解析可用映像標籤"
    log "INFO" "  ./setup-self-hosted.sh --force        # 強制重新設定"
    log "INFO" "  docker system prune -f               # 清理 Docker 資源"
    echo ""
    
    log "INFO" "常見問題解決:"
    log "INFO" "  映像拉取失敗 → 設定 REGISTRY_PREFIX=ghcr.io/ 或使用鏡像倉庫"
    log "INFO" "  端口被占用   → 停止衝突服務或修改 .env.local 中的端口設定"  
    log "INFO" "  DNS 解析失敗  → 檢查 /etc/resolv.conf 或使用公共 DNS"
    log "INFO" "  記憶體不足   → 關閉不必要的服務或增加交換空間"
    echo ""
    
    log "INFO" "網路限制環境建議:"
    log "INFO" "  1. 設定 REGISTRY_PREFIX 使用可存取的鏡像倉庫"
    log "INFO" "  2. 使用 OFFLINE_MODE=true 並預先準備映像"
    log "INFO" "  3. 考慮使用代理伺服器"
    echo ""
    
    log "INFO" "診斷完成！運行 './setup-self-hosted.sh --help' 查看更多選項。"
}

# 如果腳本被直接執行（不是被 source）
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    # 設定全域變數（如果沒有從主腳本繼承）
    [[ -z "$SCRIPT_DIR" ]] && SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    [[ -z "$ENV_FILE" ]] && ENV_FILE="${SCRIPT_DIR}/.env.local" 
    [[ -z "$LOG_FILE" ]] && LOG_FILE="${SCRIPT_DIR}/setup.log"
    [[ -z "$DEBUG_MODE" ]] && DEBUG_MODE=false
    
    # 簡單的日誌函數（如果沒有從主腳本繼承）
    if ! declare -f log >/dev/null; then
        log() {
            local level=$1
            shift
            local message="$*"
            case $level in
                "INFO") echo -e "\033[0;32m[INFO]\033[0m $message" ;;
                "WARN") echo -e "\033[1;33m[WARN]\033[0m $message" ;;
                "ERROR") echo -e "\033[0;31m[ERROR]\033[0m $message" ;;
                "DEBUG") [[ $DEBUG_MODE == true ]] && echo -e "\033[0;34m[DEBUG]\033[0m $message" ;;
            esac
        }
    fi
    
    # 解析參數
    while [[ $# -gt 0 ]]; do
        case $1 in
            --debug) DEBUG_MODE=true; shift ;;
            *) shift ;;
        esac
    done
    
    run_doctor
fi