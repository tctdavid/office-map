#!/bin/bash
# 重啟 Supabase 服務以應用新的路由配置

echo "=== Supabase 服務重啟腳本 ==="
echo "正在停止所有服務..."

# 停止所有服務
docker-compose down

echo "等待服務完全停止..."
sleep 5

echo "正在啟動服務..."
# 重新啟動服務，順序很重要
docker-compose up -d db

echo "等待資料庫啟動完成..."
sleep 15

echo "啟動 API Gateway (Kong)..."
docker-compose up -d kong

echo "等待 Kong 準備完成..."
sleep 10

echo "啟動其他服務..."
docker-compose up -d auth rest realtime storage imgproxy meta

echo "等待服務準備完成..."
sleep 15

echo "啟動 Studio..."
docker-compose up -d studio

echo "等待所有服務完全啟動..."
sleep 20

echo "=== 檢查服務狀態 ==="
docker-compose ps

echo ""
echo "=== 測試路由配置 ==="
echo "測試根路徑 (應該顯示 Supabase Studio)..."
curl -s -I http://localhost:8000/ | head -n 1

echo ""
echo "測試 REST API 路由..."
curl -s -I http://localhost:8000/rest/v1/ | head -n 1

echo ""
echo "測試 Auth 路由..."
curl -s -I http://localhost:8000/auth/v1/ | head -n 1

echo ""
echo "測試 Meta 路由..."
curl -s -I http://localhost:8000/pg/ | head -n 1

echo ""
echo "=== 配置完成！==="
echo "現在可以透過以下網址存取："
echo "- Supabase Studio: http://localhost:8000 (或 http://您的IP:8000)"
echo "- REST API: http://localhost:8000/rest/v1/"
echo "- Auth API: http://localhost:8000/auth/v1/"
echo "- Meta API: http://localhost:8000/pg/"
echo ""
echo "如果遇到問題，請檢查 troubleshooting-guide.md"