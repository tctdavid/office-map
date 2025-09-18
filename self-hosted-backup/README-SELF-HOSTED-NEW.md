# 自託管 Supabase 設定指南

本專案提供完整的自託管 Supabase 解決方案，包含自動化安裝腳本和資料庫設定。

## 快速開始

### 1. 官方 Docker Compose 安裝（推薦）

使用 Supabase 官方的 Docker Compose 配置：

```bash
# 全新安裝
./setup-self-hosted.sh official

# 應用 SQL 更新到現有資料庫
./setup-self-hosted.sh official migrate

# 重新初始化資料庫（清除所有資料）
./setup-self-hosted.sh official reinit
```

### 2. 自訂安裝

使用專案自訂的配置：

```bash
# 互動式安裝
./setup-self-hosted.sh

# 強制重新安裝
./setup-self-hosted.sh --force
```

## 安裝模式比較

| 特性 | 官方模式 | 自訂模式 |
|------|----------|----------|
| 配置來源 | Supabase 官方儲存庫 | 專案自訂配置 |
| 更新頻率 | 跟隨官方更新 | 專案控制 |
| 穩定性 | 官方維護 | 專案測試 |
| 客製化 | 有限 | 高度可訂 |
| 建議用途 | 生產環境 | 開發/測試 |

## 常用命令

### 系統診斷

```bash
# 執行完整系統檢查
./setup-self-hosted.sh doctor

# 除錯模式診斷
./setup-self-hosted.sh --debug doctor
```

### 服務管理

```bash
# 檢查服務狀態
cd supabase-official && docker compose ps

# 檢視日誌
cd supabase-official && docker compose logs -f

# 停止服務
cd supabase-official && docker compose down

# 重新啟動服務
cd supabase-official && docker compose restart
```

## 故障排除

### 常見問題

#### 1. 安裝後資料庫為空

**問題**: 執行 `./setup-self-hosted.sh official` 後資料庫沒有專案資料表

**解決方案**:
```bash
# 如果是重新執行安裝，Docker volumes 已存在，需要應用 SQL
./setup-self-hosted.sh official migrate

# 或者完全重新初始化
./setup-self-hosted.sh official reinit
```

#### 2. SQL 腳本錯誤

**問題**: `case` 欄位名稱衝突或 `table_name` 模糊錯誤

**解決方案**: 
- 已修復 `pc_details.case` → `pc_details.pc_case`
- 已修復 DO 區塊中的變數名稱衝突
- 使用最新版本的 SQL 腳本

#### 3. 連接失敗

**問題**: 前端無法連接到自託管 Supabase

**檢查清單**:
```bash
# 檢查服務是否運行
docker compose ps

# 檢查網路連接
curl http://localhost:8000/health

# 檢查設定檔
cat .env | grep -E "(ANON_KEY|SERVICE_ROLE_KEY)"
```

#### 4. 權限問題

**問題**: 檔案上傳失敗

**解決方案**:
```bash
# 應用儲存權限修復
cd supabase-official
docker compose exec -T db psql -U postgres -d postgres -f /dev/stdin < ../sql-scripts/fix-self-hosted-storage.sql
```

### 日誌檢查

```bash
# 查看安裝日誌
tail -f setup-self-hosted.log

# 查看資料庫日誌
cd supabase-official && docker compose logs db

# 查看 API 日誌
cd supabase-official && docker compose logs kong
```

## 資料庫管理

### 手動 SQL 執行

```bash
# 連接到資料庫
cd supabase-official
docker compose exec db psql -U postgres -d postgres

# 執行 SQL 檔案
docker compose exec -T db psql -U postgres -d postgres -f /dev/stdin < ../database-setup-corrected.sql
```

### 備份與還原

```bash
# 備份資料庫
cd supabase-official
docker compose exec db pg_dump -U postgres postgres > backup.sql

# 還原資料庫
docker compose exec -T db psql -U postgres -d postgres -f /dev/stdin < backup.sql
```

## 前端整合

### 環境變數設定

安裝完成後，更新前端專案的環境變數：

```env
# .env.local 或 .env
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlnbmVmZG9zY2V3a2VsbnhoZHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDEyNzE2MDAsImV4cCI6MjAxNjg0NzYwMH0.kL8r7_MCMR8gfzxIVp9Sb8Np5EfEOY4VTxvDhSuHQwE
```

### 連接測試

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:8000'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

const supabase = createClient(supabaseUrl, supabaseKey)

// 測試連接
const { data, error } = await supabase.from('employees').select('count', { count: 'exact' })
console.log('連接測試:', { data, error })
```

## 安全注意事項

### 生產環境設定

1. **修改預設密碼**:
   ```bash
   # 編輯 .env 檔案
   POSTGRES_PASSWORD=your-secure-password
   DASHBOARD_PASSWORD=your-secure-dashboard-password
   ```

2. **JWT 密鑰**:
   ```bash
   # 生成新的 JWT 密鑰
   openssl rand -base64 32
   ```

3. **網路安全**:
   - 使用反向代理 (nginx)
   - 設定 SSL 憑證
   - 限制對外開放的連接埠

### 權限檢查

```sql
-- 檢查 RLS 政策
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public';

-- 檢查儲存權限
SELECT bucket_id, name, owner 
FROM storage.objects 
LIMIT 10;
```

## 更新與維護

### 定期維護

```bash
# 清理 Docker 映像
docker system prune -a

# 更新 Docker 映像
cd supabase-official && docker compose pull && docker compose up -d

# 資料庫清理
docker compose exec db psql -U postgres -c "VACUUM ANALYZE;"
```

### 版本更新

```bash
# 取得最新的官方配置
rm -rf supabase-official
./setup-self-hosted.sh official

# 或者只更新 SQL 腳本
./setup-self-hosted.sh official migrate
```

## 支援與幫助

- 執行診斷：`./setup-self-hosted.sh doctor`
- 檢查日誌：`tail -f setup-self-hosted.log`
- GitHub Issues: [專案儲存庫問題追蹤]
- Supabase 官方文件: https://supabase.com/docs

---

**提示**: 安裝完成後會生成 `frontend-config.md` 檔案，包含詳細的前端連接資訊。