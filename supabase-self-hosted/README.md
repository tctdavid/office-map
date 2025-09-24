# Supabase 官方自託管環境

這是按照 Supabase 官方標準設定的自託管環境，與前端應用程式完全分離。

## 目錄結構

```
supabase-self-hosted/
├── docker-compose.yml      # 官方 Docker Compose 配置
├── .env                   # 環境變數配置
├── start-supabase.sh      # 啟動腳本
├── README.md              # 說明文件
└── volumes/               # 持久化數據目錄
    ├── api/
    │   └── kong.yml       # Kong API Gateway 配置
    ├── db/
    │   ├── data/          # PostgreSQL 數據
    │   └── init/          # 初始化 SQL 腳本
    ├── storage/           # 文件存儲
    ├── functions/         # Edge Functions
    └── logs/              # 日誌文件
```

## 快速開始

### 1. 準備環境

確保已安裝：
- Docker
- Docker Compose

### 2. 配置環境變數

編輯 `.env` 檔案，修改以下關鍵設定：

```bash
# 更新為您的 IP 地址或域名
API_EXTERNAL_URL=http://YOUR_IP:8000
SUPABASE_PUBLIC_URL=http://YOUR_IP:8000

# 前端應用程式 URL
SITE_URL=http://YOUR_IP:3000

# 設定強密碼
POSTGRES_PASSWORD=your-super-secret-password
JWT_SECRET=your-super-secret-jwt-token-with-at-least-32-characters-long
```

### 3. 啟動服務

```bash
# 設定執行權限
chmod +x start-supabase.sh

# 啟動 Supabase 服務
./start-supabase.sh
```

### 4. 訪問服務

- **Supabase Studio**: http://localhost:8000
- **REST API**: http://localhost:8000/rest/v1/
- **Auth API**: http://localhost:8000/auth/v1/
- **Storage API**: http://localhost:8000/storage/v1/
- **Realtime**: ws://localhost:8000/realtime/v1/

## API Keys

```bash
# Anonymous Key (前端用)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Service Role Key (後端用)
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
```

## 前端配置

在您的前端應用程式中，更新 Supabase 客戶端配置：

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://YOUR_IP:8000'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

## 常用命令

```bash
# 查看服務狀態
docker-compose ps

# 查看所有服務日誌
docker-compose logs -f

# 查看特定服務日誌
docker-compose logs -f [service_name]

# 重啟特定服務
docker-compose restart [service_name]

# 停止所有服務
docker-compose down

# 停止並清除數據
docker-compose down -v

# 重新啟動所有服務
docker-compose down && docker-compose up -d
```

## 服務說明

- **db**: PostgreSQL 資料庫
- **studio**: Supabase Studio 管理介面
- **kong**: API Gateway (路由和認證)
- **auth**: 用戶認證服務 (GoTrue)
- **rest**: REST API 服務 (PostgREST)
- **realtime**: 即時通訊服務
- **storage**: 文件存儲服務
- **imgproxy**: 圖片處理服務
- **meta**: 資料庫管理服務
- **functions**: Edge Functions 運行時
- **analytics**: 日誌和分析服務
- **vector**: 日誌收集服務

## 故障排除

### 服務無法啟動
1. 檢查 Docker 是否正在運行
2. 檢查端口是否被占用 (`netstat -tulpn | grep :8000`)
3. 查看服務日誌 (`docker-compose logs [service_name]`)

### 無法訪問 Studio
1. 確認 Kong 服務正常運行
2. 檢查防火牆設置
3. 驗證 `.env` 中的 URL 配置

### 數據庫連接問題
1. 檢查 `POSTGRES_PASSWORD` 是否一致
2. 確認數據庫容器健康狀態
3. 檢查數據庫初始化日誌

## 生產環境注意事項

1. **更改預設密碼**: 修改 `POSTGRES_PASSWORD` 和 `JWT_SECRET`
2. **配置 HTTPS**: 使用反向代理（如 Nginx）配置 SSL
3. **備份策略**: 定期備份 `volumes/db/data` 目錄
4. **監控**: 設定服務監控和告警
5. **資源限制**: 在 `docker-compose.yml` 中設定資源限制

## 支援

如果遇到問題，請參考：
- [Supabase 官方文檔](https://supabase.com/docs)
- [Self-hosting 指南](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose 文檔](https://docs.docker.com/compose/)