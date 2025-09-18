# Office Map - 自託管 Supabase 指南

這是 Office Map 專案的自託管 Supabase 解決方案，基於官方 Supabase Docker Compose 簡化設計。

## 📋 系統需求

- **作業系統**: Linux/macOS/Windows (建議 Ubuntu 20.04+)
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **記憶體**: 至少 4GB RAM
- **磁碟空間**: 至少 10GB 可用空間
- **網路**: 192.168.52.112 網域

## 🚀 快速開始

### 1. 下載專案檔案

```bash
# 確保您有以下檔案：
# - docker-compose.yml
# - setup-supabase.sh
# - config/kong.yml
# - sql/01-setup.sql
# - sql/02-create-admin-auth.sql
```

### 2. 執行安裝

```bash
# 給予執行權限
chmod +x setup-supabase.sh

# 執行完整安裝
./setup-supabase.sh install
```

### 3. 訪問服務

安裝完成後，您可以訪問：

- **Supabase Studio**: http://192.168.52.112:3000
- **API Gateway**: http://192.168.52.112:8000
- **PostgreSQL**: 192.168.52.112:5432

### 4. 管理員登入

使用以下帳號登入：
- **Email**: admin@gmail.com
- **密碼**: admin123

## 🛠️ 管理命令

### 服務管理

```bash
# 啟動服務
./setup-supabase.sh start

# 停止服務
./setup-supabase.sh stop

# 重新啟動服務
./setup-supabase.sh restart

# 檢查服務狀態
./setup-supabase.sh status
```

### 日誌查看

```bash
# 查看所有服務日誌
./setup-supabase.sh logs

# 查看特定服務日誌
./setup-supabase.sh logs db
./setup-supabase.sh logs kong
./setup-supabase.sh logs auth
```

### 資料清理

```bash
# ⚠️ 危險操作：清理所有資料
./setup-supabase.sh clean
```

## 🔧 前端配置

### 雲端版本 → 自託管版本

如果您的前端目前使用雲端 Supabase，請按照以下步驟切換到自託管版本：

#### 1. 複製客戶端配置檔案

```bash
# 將自託管配置檔案複製到正確位置
cp src/integrations/supabase/client-self-hosted.ts src/integrations/supabase/client.ts
```

#### 2. 驗證配置

確認 `src/integrations/supabase/client.ts` 包含以下配置：

```typescript
const SUPABASE_URL = "http://192.168.52.112:8000";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

#### 3. 測試連接

在瀏覽器控制台中執行：

```javascript
import { runSystemTest } from '@/integrations/supabase/client';
runSystemTest();
```

## 📊 資料庫結構

自託管版本包含完整的 Office Map 資料結構：

### 核心資料表

- `employees` - 員工資訊
- `attendance_records` - 考勤記錄
- `seats` / `seat_coordinates` - 座位管理
- `pcs` / `pc_details` - 電腦設備
- `equipment` - 其他設備
- `containers` / `floor_containers` - 區域容器

### 儲存桶

- `staff` - 員工照片
- `equipment` - 設備照片
- `pcs` - 電腦照片

### 權限系統

- **管理員** (`admin`): 完整存取權限
- **員工** (`employee`): 個人資料存取權限
- **RLS** (Row Level Security): 已完整配置

## 🔐 安全設定

### 預設認證金鑰

```
JWT Secret: your-super-secret-jwt-token-with-at-least-32-characters-long
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
Service Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

> ⚠️ **生產環境警告**: 請更改預設的 JWT Secret 和密碼！

### 建議的安全強化

1. **更改預設密碼**
2. **更新 JWT Secret**
3. **設定防火牆規則**
4. **啟用 SSL/TLS**
5. **定期備份資料**

## 🐛 故障排除

### 常見問題

#### 1. 連接埠被佔用

```bash
# 檢查連接埠使用情況
sudo lsof -i :3000
sudo lsof -i :8000
sudo lsof -i :5432

# 強制停止佔用的程序
sudo kill -9 <PID>
```

#### 2. 資料庫連接失敗

```bash
# 檢查資料庫狀態
docker-compose exec db pg_isready -U postgres

# 重新啟動資料庫
docker-compose restart db
```

#### 3. 認證問題

```bash
# 檢查認證服務日誌
docker-compose logs auth

# 重新建立管理員帳號
docker-compose exec -T db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/02-create-admin-auth.sql
```

#### 4. 前端連接問題

1. 確認 URL 設定正確：`http://192.168.52.112:8000`
2. 檢查 CORS 設定
3. 驗證 Anon Key 正確

### 日誌位置

- **安裝日誌**: `./supabase-setup.log`
- **服務日誌**: `docker-compose logs [service]`
- **資料庫日誌**: `./volumes/db/data/log/`

## 📚 進階配置

### 自訂網域

如需更改為其他網域，請修改：

1. `docker-compose.yml` 中的環境變數
2. `config/kong.yml` 中的 CORS 設定
3. `src/integrations/supabase/client-self-hosted.ts` 中的 URL

### 效能調優

1. **資料庫調優**: 修改 `volumes/db/postgresql.conf`
2. **記憶體設定**: 調整 Docker Compose 中的資源限制
3. **儲存設定**: 配置外部儲存後端

### 備份與還原

```bash
# 資料庫備份
docker-compose exec db pg_dump -U postgres postgres > backup.sql

# 資料庫還原
docker-compose exec -T db psql -U postgres postgres < backup.sql

# 檔案備份
tar -czf backup-$(date +%Y%m%d).tar.gz volumes/
```

## 🆘 支援與社群

如果您遇到問題，請：

1. 檢查本文的故障排除章節
2. 查看 [Supabase 官方文件](https://supabase.com/docs)
3. 搜尋相關的 GitHub Issues
4. 聯繫專案維護者

## 📄 授權條款

本專案遵循原始 Office Map 專案的授權條款。

---

**祝您使用愉快！** 🎉