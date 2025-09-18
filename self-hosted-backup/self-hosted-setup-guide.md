# 自託管 Supabase 照片上傳設定指南

## 常見問題和解決方案

### 1. CORS 設定問題
自託管 Supabase 需要正確的 CORS 設定才能處理檔案上傳。

**在你的 `supabase/config.toml` 中確保有以下設定：**

```toml
[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[storage]
enabled = true
port = 54324
# 允許的來源域名（請修改為你的實際域名）
file_size_limit = "50MB"
```

### 2. 儲存服務 CORS 設定
在你的自託管 Supabase 的 Docker 設定中，確保儲存服務有正確的 CORS 設定：

**檢查 `docker-compose.yml` 中的儲存服務：**

```yaml
storage:
  container_name: supabase-storage
  image: supabase/storage-api:v0.40.4
  depends_on:
    - db
    - rest
  restart: unless-stopped
  environment:
    ANON_KEY: ${ANON_KEY}
    SERVICE_KEY: ${SERVICE_ROLE_KEY}
    POSTGREST_URL: http://rest:3000
    PGRST_JWT_SECRET: ${JWT_SECRET}
    DATABASE_URL: ${DATABASE_URL}
    FILE_SIZE_LIMIT: 52428800
    STORAGE_BACKEND: file
    FILE_STORAGE_BACKEND_PATH: /var/lib/storage
    TENANT_ID: stub
    REGION: stub
    GLOBAL_S3_BUCKET: stub
    # CORS 設定 - 重要！
    CORS_ORIGIN: "*"  # 開發環境可用 *, 生產環境請指定具體域名
  volumes:
    - ./volumes/storage:/var/lib/storage
```

### 3. 前端設定檢查
確保前端的 Supabase 客戶端指向正確的自託管 URL：

**檢查 `src/integrations/supabase/client.ts`：**
```typescript
const SUPABASE_URL = "http://your-self-hosted-domain.com"; // 或 https://
const SUPABASE_PUBLISHABLE_KEY = "your-anon-key";
```

### 4. 防火牆和埠口設定
確保以下埠口在防火牆中開放：
- 8000 (Kong API Gateway)
- 3000 (Supabase Studio)
- 5432 (PostgreSQL - 如果需要直接存取)

### 5. 測試儲存功能
執行 SQL 腳本後，你可以使用以下測試：

1. **執行儲存修復腳本：**
   ```sql
   -- 在 Supabase 的 SQL 編輯器中執行 fix-self-hosted-storage.sql
   ```

2. **測試檔案上傳：**
   - 開啟瀏覽器開發者工具
   - 嘗試上傳照片
   - 檢查 Network 選項卡是否有 CORS 錯誤
   - 檢查 Console 選項卡是否有 JavaScript 錯誤

### 6. 常見錯誤訊息和解決方案

**錯誤：`CORS policy: No 'Access-Control-Allow-Origin' header`**
- 解決：檢查 `volumes/api/kong.yml` 中的 CORS 設定
- 檢查 Docker 環境變數 `CORS_ORIGIN` 設定

**錯誤：`413 Request Entity Too Large`**
- 解決：檢查 Kong 的檔案大小限制設定
- 檢查 Supabase 的 `FILE_SIZE_LIMIT` 設定

**錯誤：`Failed to fetch`**
- 解決：檢查儲存服務是否正在運行 (透過 Kong Gateway)
- 檢查防火牆設定

### 7. 偵錯步驟
1. 檢查 Supabase 服務狀態：`docker-compose ps`
2. 查看儲存服務日誌：`docker-compose logs storage`
3. 查看 Kong Gateway 日誌：`docker-compose logs kong`
4. 測試 API：`curl http://localhost:8000/storage/v1/bucket`
5. 檢查資料庫連線和政策設定