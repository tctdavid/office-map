# 自託管 Supabase 設定完成 🎉

> **v2.0 新功能**：自動映像標籤解析、診斷工具、智能錯誤處理
> 
> 受限網路環境建議：在 `.env.local` 設定 `REGISTRY_PREFIX`（例如 `ghcr.io/`），或將 `OFFLINE_MODE=true` 並先在可連網環境 `docker pull` 後用 `docker save`/`docker load` 匯入。

## 🚀 快速開始

### 1. 啟動服務

```bash
# 給予執行權限
chmod +x setup-self-hosted.sh

# 執行自動化設定（包含映像標籤解析）
./setup-self-hosted.sh

# 或跳過標籤解析的快速設定
./setup-self-hosted.sh --no-resolve

# 強制重新設定
./setup-self-hosted.sh --force
```

### 2. 診斷系統狀態

```bash
# 診斷系統、網路、映像和服務狀態
./setup-self-hosted.sh doctor

# 詳細診斷輸出
./setup-self-hosted.sh doctor --debug
```

### 3. 訪問服務

設定完成後，您可以訪問以下服務：

- **Supabase Studio**: http://localhost:3000 (資料庫管理介面)
- **API Gateway**: http://localhost:8000 (所有 API 端點)
- **PostgreSQL**: localhost:5432 (直接資料庫連接)

### 4. 測試環境

```bash
# 測試所有服務是否正常
chmod +x test-self-hosted.js
node test-self-hosted.js
```

## 📁 重要檔案說明

| 檔案 | 用途 | 新增/更新 |
|------|------|----------|
| `docker-compose.yml` | 主要 Docker 服務配置 | ✅ 支援彈性映像解析 |
| `.env.docker` | 環境變數範本 | - |
| `.env.local` | 實際環境變數 (由腳本生成) | ✅ 自動標籤解析 |
| `setup-self-hosted.sh` | 自動化設定腳本 | ✅ v2.0 增強功能 |
| `supabase-doctor.sh` | 診斷工具 | 🆕 新增 |
| `versions-compatibility.json` | 映像版本相容性矩陣 | 🆕 新增 |
| `volumes/` | Docker 數據卷和配置檔案 | - |
| `src/integrations/supabase/client-self-hosted.ts` | 自託管版本的 Supabase 客戶端 | - |

## ⚙️ 新功能說明

### 🎯 自動映像標籤解析

腳本現在會：
1. 檢查 `versions-compatibility.json` 中的相容版本
2. 驗證映像在 GHCR 和 Docker Hub 的可用性  
3. 自動選擇最佳可用標籤
4. 生成 `.env.local.resolved` 供審查

```bash
# 手動觸發標籤解析
./setup-self-hosted.sh --resolve-tags

# 跳過標籤解析
./setup-self-hosted.sh --no-resolve
```

### 🏥 診斷工具

全新的診斷工具可以檢查：
- 系統環境（Docker、記憶體、磁碟）
- 網路連接（DNS、HTTP、端口）
- 映像可用性（本地快取、遠端註冊表）
- 服務狀態（運行狀態、健康檢查）
- 配置正確性

```bash
./setup-self-hosted.sh doctor
```

### 🔧 彈性映像配置

`docker-compose.yml` 現在支援：
- `*_IMAGE` 變數覆寫映像來源
- 智能預設值（GHCR 優先）
- 向後相容現有配置

例如：
```bash
# 使用特定映像來源
export GOTRUE_IMAGE=ghcr.io/supabase/gotrue
export GOTRUE_TAG=v2.158.1
```

## 🔧 常用指令

### Docker 管理
```bash
# 啟動所有服務
docker compose up -d

# 停止所有服務  
docker compose down

# 查看服務狀態
docker compose ps --format table

# 查看日誌
docker compose logs -f [service-name]

# 重啟特定服務
docker compose restart [service-name]

# 驗證配置
docker compose config
```

### 映像管理
```bash
# 檢查映像可用性
docker manifest inspect supabase/gotrue:v2.158.1

# 清理未使用映像
docker image prune

# 批次拉取映像
docker compose pull --no-parallel
```

### 資料庫管理
```bash
# 連接到資料庫
docker compose exec db psql -U postgres

# 執行 SQL 腳本
docker compose exec db psql -U postgres -f /path/to/script.sql

# 備份資料庫
docker compose exec db pg_dump -U postgres > backup.sql
```

## 🛠️ 疑難排解

### 映像拉取問題

**問題**: 映像標籤不存在或網路受限

**解決方案**:
```bash
# 1. 運行診斷
./setup-self-hosted.sh doctor

# 2. 使用 GHCR 映像源
echo "REGISTRY_PREFIX=ghcr.io/" >> .env.local

# 3. 自動解析可用標籤
./setup-self-hosted.sh --resolve-tags

# 4. 離線環境設定
echo "OFFLINE_MODE=true" >> .env.local
```

**中國大陸環境**:
```bash
# 使用 DaoCloud 鏡像
echo "REGISTRY_PREFIX=docker.m.daocloud.io/" >> .env.local
```

### 服務啟動問題

1. **端口衝突**
   ```bash
   # 檢查占用端口
   ./setup-self-hosted.sh doctor
   
   # 修改端口
   echo "STUDIO_PORT=3001" >> .env.local
   echo "KONG_HTTP_PORT=8001" >> .env.local
   ```

2. **資料庫連接失敗**
   ```bash
   # 檢查資料庫狀態
   docker compose exec db pg_isready -U postgres
   
   # 查看資料庫日誌
   docker compose logs db
   ```

3. **記憶體不足**
   ```bash
   # 檢查系統資源
   ./setup-self-hosted.sh doctor
   
   # 只啟動核心服務
   docker compose up -d db kong auth rest
   ```

### 配置檢查

```bash
# 驗證 Docker Compose 配置
docker compose config

# 檢查環境變數
./setup-self-hosted.sh doctor

# 驗證映像存在
docker compose pull --dry-run
```

## 📈 效能最佳化

### 映像快取策略
```bash
# 預先拉取所有映像
docker compose pull

# 使用本地映像快取
echo "SKIP_PULL=true" >> .env.local
```

### 資料庫調整
```bash
# 增加連接池
echo "PGBOUNCER_POOL_SIZE=25" >> .env.local

# 調整記憶體設定
echo "POSTGRES_SHARED_BUFFERS=256MB" >> .env.local
```

## 🚀 生產環境部署

### 系統服務設定

```bash
# 建立 systemd 服務
sudo tee /etc/systemd/system/office-map.service > /dev/null <<EOF
[Unit]
Description=Office Map Supabase v2.0
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/office-map
ExecStart=/usr/local/bin/docker compose up -d
ExecStop=/usr/local/bin/docker compose down
ExecReload=/path/to/office-map/setup-self-hosted.sh --resolve-tags
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# 啟用服務
sudo systemctl enable office-map.service
sudo systemctl start office-map.service
```

### 自動更新腳本

```bash
# 建立更新腳本
cat > update-supabase.sh << 'EOF'
#!/bin/bash
cd /path/to/office-map
git pull
./setup-self-hosted.sh --resolve-tags --force
docker system prune -f
EOF

chmod +x update-supabase.sh
```

## 📚 更多資源

- [Supabase 自託管文檔](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose 文檔](https://docs.docker.com/compose/)
- [Kong Gateway 文檔](https://docs.konghq.com/)
- [PostgreSQL 調整指南](https://pgtune.leopard.in.ua/)
- [GHCR 官方說明](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

## 🤝 支援

如果遇到問題，請按順序嘗試：

1. 🏥 **運行診斷**: `./setup-self-hosted.sh doctor`
2. 📋 **檢查日誌**: `docker compose logs -f [service-name]`
3. 🔄 **重新解析標籤**: `./setup-self-hosted.sh --resolve-tags`
4. 🔧 **檢查 [疑難排解](#疑難排解) 部分**
5. 🧪 **執行測試腳本**: `node test-self-hosted.js`

### 常見解決流程

```bash
# 完整診斷和修復流程
./setup-self-hosted.sh doctor --debug          # 診斷問題
./setup-self-hosted.sh --resolve-tags --force  # 解析標籤並強制重設
docker system prune -f                         # 清理資源
docker compose up -d                          # 重新啟動
node test-self-hosted.js                      # 驗證功能
```

---

**享受您的自託管 Supabase v2.0 體驗！** 🎉🚀