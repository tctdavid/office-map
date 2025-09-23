# Office Map Supabase 自託管故障排除指南

## 常見問題和解決方案

### 1. SQL 腳本無法自動執行

**症狀**: 啟動 Supabase 後，資料表不存在或管理員帳號未建立

**原因**: Docker 的 `docker-entrypoint-initdb.d` 只在資料庫首次初始化時執行腳本

**解決方案**:
```bash
# 使用資料庫重置腳本
./reset-database.sh full

# 或手動執行
./reset-database.sh manual
```

### 2. SQL Editor 認證失敗

**症狀**: `password authentication failed for user "supabase_admin"`

**原因**: 
- Supabase Studio 無法連接到 pg-meta 服務
- Kong Gateway 配置問題
- 密碼配置不一致

**解決方案**:
1. 檢查服務狀態:
```bash
docker compose ps
```

2. 重新啟動服務:
```bash
docker compose restart
```

3. 檢查 Kong 和 meta 服務日誌:
```bash
docker compose logs kong
docker compose logs meta
```

### 3. "Failed to retrieve tables" 錯誤

**症狀**: Supabase Studio 無法顯示資料表

**原因**: 
- pg-meta 服務無法連接
- CORS 配置問題
- 網路連接問題

**解決方案**:
```bash
# 1. 檢查 meta 服務健康狀態
curl -i http://192.168.52.112:8000/pg/

# 2. 測試直接連接 meta 服務
docker compose exec meta curl -i http://localhost:8080/

# 3. 重新啟動相關服務
docker compose restart kong meta studio
```

### 4. 管理員帳號無法登入

**症狀**: 使用 admin@gmail.com / admin123 無法登入

**解決方案**:
```bash
# 1. 檢查員工表中的管理員記錄
docker compose exec -T db psql -U postgres -d postgres -c "SELECT * FROM public.employees WHERE email = 'admin@gmail.com';"

# 2. 檢查認證表中的管理員記錄
docker compose exec -T db psql -U postgres -d postgres -c "SELECT email FROM auth.users WHERE email = 'admin@gmail.com';"

# 3. 如果不存在，執行修復腳本
./reset-database.sh manual
```

### 5. 服務無法啟動

**症狀**: docker compose up 失敗或服務狀態顯示 "Exited"

**檢查步驟**:
```bash
# 1. 檢查連接埠佔用
sudo lsof -i :3000 -i :8000 -i :5432

# 2. 檢查磁碟空間
df -h

# 3. 檢查 Docker 資源
docker system df

# 4. 查看詳細錯誤日誌
docker compose logs [service_name]
```

### 6. 網路連接問題

**症狀**: 服務間無法互相通信

**解決方案**:
```bash
# 1. 檢查 Docker 網路
docker network ls
docker network inspect [network_name]

# 2. 測試服務間連接
docker compose exec studio ping db
docker compose exec kong ping meta

# 3. 重建網路
docker compose down
docker compose up -d
```

## 完整重置流程

如果遇到嚴重問題，可以執行完整重置:

```bash
# 1. 停止所有服務
docker compose down

# 2. 清理所有資料（注意：這會刪除所有資料！）
sudo rm -rf ./volumes/db/data/*
sudo rm -rf ./volumes/storage/*

# 3. 重新啟動
./reset-database.sh full
```

## 檢查清單

### 服務啟動檢查
- [ ] 所有服務都顯示 "Up" 狀態
- [ ] 沒有連接埠衝突
- [ ] 有足夠的磁碟空間和記憶體

### 資料庫檢查
- [ ] 可以連接到 PostgreSQL (port 5432)
- [ ] 所有必要的表格都存在
- [ ] 管理員帳號存在於 employees 和 auth.users 表中

### API 檢查
- [ ] Kong Gateway 運行正常 (http://192.168.52.112:8000)
- [ ] REST API 可訪問 (http://192.168.52.112:8000/rest/v1/)
- [ ] Meta API 可訪問 (http://192.168.52.112:8000/pg/)

### Studio 檢查
- [ ] Supabase Studio 可訪問 (http://192.168.52.112:3000)
- [ ] 可以查看資料表
- [ ] SQL Editor 可以執行查詢
- [ ] 可以使用管理員帳號登入

## 有用的命令

```bash
# 查看所有服務狀態
./setup-supabase.sh status

# 查看特定服務日誌
./setup-supabase.sh logs [service_name]

# 重新啟動服務
./setup-supabase.sh restart

# 驗證資料庫狀態
./reset-database.sh verify

# 測試資料庫連接
docker compose exec -T db pg_isready -U postgres

# 直接進入資料庫
docker compose exec db psql -U postgres -d postgres
```

## 聯繫支援

如果問題仍然存在，請提供以下資訊：
1. 錯誤訊息截圖
2. 相關服務的日誌輸出
3. 系統環境資訊 (OS, Docker版本等)
4. 執行的命令和結果