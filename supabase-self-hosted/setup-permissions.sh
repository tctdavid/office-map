#!/bin/bash

# 設定目錄權限腳本

echo "=== 設定 Supabase 自託管目錄權限 ==="

# 設定基本權限
chmod +x start-supabase.sh
chmod +x setup-permissions.sh

# 創建必要目錄並設定權限
mkdir -p volumes/db/data
mkdir -p volumes/db/init
mkdir -p volumes/storage
mkdir -p volumes/functions
mkdir -p volumes/logs

# 設定 PostgreSQL 數據目錄權限 (UID 999 是 postgres 用戶)
sudo chown -R 999:999 volumes/db/data 2>/dev/null || chown -R 999:999 volumes/db/data 2>/dev/null || echo "注意: 無法設定 PostgreSQL 數據目錄權限，可能需要手動設定"

# 設定存儲目錄權限
chmod -R 755 volumes/storage
chmod -R 755 volumes/functions
chmod -R 755 volumes/logs

# 設定配置檔案權限
chmod 644 .env
chmod 644 docker-compose.yml
chmod 644 volumes/api/kong.yml
chmod 644 volumes/logs/vector.yml

# 設定 SQL 檔案權限
chmod 644 volumes/db/*.sql

echo "✅ 權限設定完成"
echo ""
echo "如果遇到權限問題，請手動執行："
echo "  sudo chown -R 999:999 volumes/db/data"
echo "  sudo chown -R $(id -u):$(id -g) volumes/storage"