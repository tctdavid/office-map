#!/bin/bash

# 自託管 Supabase 設定腳本
# 此腳本會初始化並啟動自託管 Supabase 環境

set -e

echo "🚀 開始設定自託管 Supabase 環境..."

# 檢查必要的依賴
check_dependencies() {
    echo "📋 檢查依賴項目..."
    
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        echo "❌ Docker Compose 未安裝，請先安裝 Docker Compose"
        exit 1
    fi
    
    echo "✅ 依賴檢查完成"
}

# 生成 JWT 密鑰
generate_jwt_secret() {
    echo "🔐 生成 JWT 密鑰..."
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    echo "JWT_SECRET: $JWT_SECRET"
}

# 設定環境變數
setup_env() {
    echo "⚙️  設定環境變數..."
    
    # 如果 .env.local 不存在，從範本複製
    if [ ! -f .env.local ]; then
        cp .env.docker .env.local
        echo "📝 已建立 .env.local 檔案"
    fi
    
    # 生成新的 JWT 密鑰並更新 .env.local
    generate_jwt_secret
    
    # 替換 .env.local 中的 JWT_SECRET
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.local
    else
        # Linux
        sed -i "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env.local
    fi
    
    echo "✅ 環境變數設定完成"
}

# 建立必要的目錄
create_directories() {
    echo "📁 建立必要的目錄..."
    
    mkdir -p volumes/db/data
    mkdir -p volumes/db/init
    mkdir -p volumes/storage
    mkdir -p volumes/api
    mkdir -p volumes/logs
    
    # 設定正確的權限
    chmod -R 755 volumes/
    
    echo "✅ 目錄建立完成"
}

# 初始化資料庫腳本
setup_database_scripts() {
    echo "📚 設定資料庫初始化腳本..."
    
    # 複製 SQL 腳本到 init 目錄
    if [ -d "sql-scripts" ]; then
        echo "複製 SQL 腳本..."
        # 按照順序複製腳本
        cp sql-scripts/stage-1-basic-setup.sql volumes/db/init/02-stage-1-basic-setup.sql
        cp sql-scripts/stage-2-employees-table.sql volumes/db/init/03-stage-2-employees-table.sql
        cp sql-scripts/stage-3-main-tables.sql volumes/db/init/04-stage-3-main-tables.sql
        cp sql-scripts/stage-4-relational-tables.sql volumes/db/init/05-stage-4-relational-tables.sql
        cp sql-scripts/stage-5-seating-tables.sql volumes/db/init/06-stage-5-seating-tables.sql
        cp sql-scripts/stage-6-advanced-permissions.sql volumes/db/init/07-stage-6-advanced-permissions.sql
        cp sql-scripts/stage-7-final-setup.sql volumes/db/init/08-stage-7-final-setup.sql
        cp sql-scripts/fix-self-hosted-storage.sql volumes/db/init/09-fix-storage.sql
        
        echo "✅ SQL 腳本複製完成"
    else
        echo "⚠️  警告：sql-scripts 目錄不存在，請確保已有資料庫腳本"
    fi
}

# 啟動服務
start_services() {
    echo "🚀 啟動 Supabase 服務..."
    
    # 使用 .env.local 作為環境變數檔案
    docker-compose --env-file .env.local up -d
    
    echo "✅ 服務啟動完成"
}

# 等待服務就緒
wait_for_services() {
    echo "⏳ 等待服務就緒..."
    
    # 等待資料庫就緒
    echo "等待資料庫啟動..."
    timeout=300
    while ! docker-compose exec -T db pg_isready -U postgres > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            echo "❌ 資料庫啟動超時"
            exit 1
        fi
    done
    
    echo "✅ 資料庫已就緒"
    
    # 等待 Kong API Gateway 就緒
    echo "等待 API Gateway 啟動..."
    timeout=60
    while ! curl -f http://localhost:8000/health > /dev/null 2>&1; do
        sleep 2
        timeout=$((timeout - 2))
        if [ $timeout -le 0 ]; then
            echo "⚠️  API Gateway 可能需要更多時間啟動"
            break
        fi
    done
    
    echo "✅ 服務就緒檢查完成"
}

# 顯示設定資訊
show_info() {
    echo ""
    echo "🎉 自託管 Supabase 設定完成！"
    echo ""
    echo "📊 服務存取資訊："
    echo "  • Supabase Studio: http://localhost:3000"
    echo "  • API Gateway: http://localhost:8000"
    echo "  • PostgreSQL: localhost:5432"
    echo ""
    echo "🔑 重要資訊："
    echo "  • JWT Secret: $JWT_SECRET"
    echo "  • 資料庫密碼：請查看 .env.local 檔案"
    echo ""
    echo "📝 下步驟："
    echo "  1. 開啟 Studio 查看資料庫狀態"
    echo "  2. 建立管理員帳號"
    echo "  3. 測試檔案上傳功能"
    echo "  4. 更新前端應用的 Supabase 設定"
    echo ""
    echo "🔧 有用的指令："
    echo "  • 查看日誌: docker-compose logs -f [service-name]"
    echo "  • 停止服務: docker-compose down"
    echo "  • 重啟服務: docker-compose restart"
    echo ""
}

# 主執行流程
main() {
    check_dependencies
    setup_env
    create_directories
    setup_database_scripts
    start_services
    wait_for_services
    show_info
}

# 執行主函數
main "$@"