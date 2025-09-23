#!/bin/bash

# Office Map - 快速測試腳本
# 用於快速檢查 Supabase 服務狀態

set -euo pipefail

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DOMAIN="192.168.52.112"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🧪 Office Map Supabase 快速測試${NC}"
echo -e "${BLUE}========================================${NC}"

# 測試 1: 檢查 Docker Compose 服務
echo -e "\n📋 檢查 Docker Compose 服務狀態..."
if docker compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker Compose 服務運行中${NC}"
    docker compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${RED}❌ Docker Compose 服務未運行${NC}"
    exit 1
fi

# 測試 2: 檢查 Supabase Studio
echo -e "\n🌐 測試 Supabase Studio (端口 3000)..."
if curl -s "http://$DOMAIN:3000" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Supabase Studio 可訪問${NC}"
else
    echo -e "${RED}❌ Supabase Studio 無法訪問${NC}"
fi

# 測試 3: 檢查 API Gateway
echo -e "\n🚪 測試 API Gateway (端口 8000)..."
if curl -s "http://$DOMAIN:8000" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway 可訪問${NC}"
else
    echo -e "${RED}❌ API Gateway 無法訪問${NC}"
fi

# 測試 4: 檢查 REST API
echo -e "\n🔗 測試 REST API..."
if curl -s "http://$DOMAIN:8000/rest/v1/" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ REST API 可訪問${NC}"
else
    echo -e "${RED}❌ REST API 無法訪問${NC}"
fi

# 測試 5: 檢查 Meta API
echo -e "\n📊 測試 Meta API..."
if curl -s "http://$DOMAIN:8000/pg/" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Meta API 可訪問${NC}"
else
    echo -e "${RED}❌ Meta API 無法訪問${NC}"
fi

# 測試 6: 檢查資料庫連接
echo -e "\n🗄️  測試資料庫連接..."
if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL 資料庫可連接${NC}"
else
    echo -e "${RED}❌ PostgreSQL 資料庫無法連接${NC}"
fi

# 測試 7: 檢查關鍵資料表
echo -e "\n📋 檢查關鍵資料表..."
tables=("employees" "attendance_records" "containers" "seats")
for table in "${tables[@]}"; do
    if docker compose exec -T db psql -U postgres -d postgres -c "\dt public.$table" 2>/dev/null | grep -q "$table"; then
        echo -e "${GREEN}✅ 表 $table 存在${NC}"
    else
        echo -e "${RED}❌ 表 $table 不存在${NC}"
    fi
done

# 測試 8: 檢查管理員帳號
echo -e "\n👤 檢查管理員帳號..."
admin_count=$(docker compose exec -T db psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM public.employees WHERE email = 'admin@gmail.com';" 2>/dev/null | tr -d ' \n\r' || echo "0")

if [[ "$admin_count" -gt 0 ]]; then
    echo -e "${GREEN}✅ 管理員帳號存在於 employees 表中${NC}"
else
    echo -e "${RED}❌ 管理員帳號不存在於 employees 表中${NC}"
fi

auth_admin_count=$(docker compose exec -T db psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM auth.users WHERE email = 'admin@gmail.com';" 2>/dev/null | tr -d ' \n\r' || echo "0")

if [[ "$auth_admin_count" -gt 0 ]]; then
    echo -e "${GREEN}✅ 管理員帳號存在於 auth.users 表中${NC}"
else
    echo -e "${RED}❌ 管理員帳號不存在於 auth.users 表中${NC}"
fi

# 總結
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}📊 測試總結${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n🔑 ${YELLOW}管理員帳號資訊:${NC}"
echo -e "   Email: admin@gmail.com"
echo -e "   密碼:  admin123"

echo -e "\n🌐 ${YELLOW}服務 URL:${NC}"
echo -e "   Supabase Studio: http://$DOMAIN:3000"
echo -e "   API Gateway:     http://$DOMAIN:8000"
echo -e "   PostgreSQL:      $DOMAIN:5432"

echo -e "\n🛠️  ${YELLOW}如果發現問題，請執行:${NC}"
echo -e "   完整重置: ./reset-database.sh full"
echo -e "   手動修復: ./reset-database.sh manual"
echo -e "   查看日誌: ./setup-supabase.sh logs"

echo -e "\n${GREEN}測試完成！${NC}"