# 自託管 Supabase 設定完成 🎉

本項目現已包含完整的自託管 Supabase 配置，讓您可以在自己的服務器上運行完整的後端服務。

## 🚀 快速開始

### 1. 啟動服務

```bash
# 給予執行權限
chmod +x setup-self-hosted.sh

# 執行自動化設定
./setup-self-hosted.sh
```

### 2. 訪問服務

設定完成後，您可以訪問以下服務：

- **Supabase Studio**: http://localhost:3000 (資料庫管理介面)
- **API Gateway**: http://localhost:8000 (所有 API 端點)
- **PostgreSQL**: localhost:5432 (直接資料庫連接)

### 3. 測試環境

```bash
# 測試所有服務是否正常
chmod +x test-self-hosted.js
node test-self-hosted.js
```

## 📁 重要檔案說明

| 檔案 | 用途 |
|------|------|
| `docker-compose.yml` | 主要 Docker 服務配置 |
| `.env.docker` | 環境變數範本 |
| `.env.local` | 實際環境變數 (由腳本生成) |
| `setup-self-hosted.sh` | 自動化設定腳本 |
| `volumes/` | Docker 數據卷和配置檔案 |
| `src/integrations/supabase/client-self-hosted.ts` | 自託管版本的 Supabase 客戶端 |

## ⚙️ 配置說明

### 切換到自託管模式

1. **更新 Supabase 客戶端**:
   ```bash
   # 備份原始雲端配置
   mv src/integrations/supabase/client.ts src/integrations/supabase/client-cloud.ts
   
   # 啟用自託管配置
   mv src/integrations/supabase/client-self-hosted.ts src/integrations/supabase/client.ts
   ```

2. **更新環境變數** (如需要):
   編輯 `.env.local` 檔案調整設定

### 服務架構

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │───▶│   Kong Gateway  │───▶│   Supabase      │
│   (React App)   │    │   (Port 8000)   │    │   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                              ┌─────────────────┐
                                              │   PostgreSQL    │
                                              │   (Port 5432)   │
                                              └─────────────────┘
```

## 🔧 常用指令

### Docker 管理
```bash
# 啟動所有服務
docker compose up -d

# 停止所有服務
docker compose down

# 查看服務狀態
docker compose ps

# 查看日誌
docker compose logs -f [service-name]

# 重啟特定服務
docker compose restart [service-name]
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

### 除錯和監控
```bash
# 檢查容器健康狀態
docker compose ps --format table

# 查看資源使用情況
docker stats

# 清理未使用的資源
docker system prune
```

## 🛠️ 疑難排解

### 常見問題

1. **服務無法啟動**
   ```bash
   # 檢查端口是否被占用
   netstat -tulpn | grep :8000
   
    # 查看容器日誌
    docker compose logs kong
   ```

2. **資料庫連接失敗**
   ```bash
    # 檢查資料庫狀態
    docker compose exec db pg_isready -U postgres
    
    # 重設資料庫密碼
    docker compose exec db psql -U postgres -c "ALTER USER postgres PASSWORD 'new_password';"
   ```

3. **檔案上傳失敗**
   ```bash
    # 檢查儲存服務
    docker compose logs storage
   
   # 檢查儲存權限
   ls -la volumes/storage/
   ```

4. **CORS 錯誤**
   - 檢查 `volumes/api/kong.yml` 中的 CORS 設定
   - 確認前端 URL 已加入允許清單

### 效能調整

1. **資料庫效能**:
   - 調整 PostgreSQL 配置參數
   - 增加連接池大小
   - 設定適當的記憶體限制

2. **儲存效能**:
   - 使用 SSD 儲存
   - 調整 Docker 卷配置
   - 設定適當的檔案大小限制

## 🚀 生產環境部署

### 1. 系統服務設定

```bash
# 建立 systemd 服務
sudo tee /etc/systemd/system/office-map.service > /dev/null <<EOF
[Unit]
Description=Office Map Supabase
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/office-map
ExecStart=/usr/local/bin/docker compose up -d
ExecStop=/usr/local/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

# 啟用服務
sudo systemctl enable office-map.service
sudo systemctl start office-map.service
```

## 📚 更多資源

- [Supabase 自託管文檔](https://supabase.com/docs/guides/self-hosting)
- [Docker Compose 文檔](https://docs.docker.com/compose/)
- [Kong Gateway 文檔](https://docs.konghq.com/)
- [PostgreSQL 調整指南](https://pgtune.leopard.in.ua/)

## 🤝 支援

如果遇到問題，請：

1. 檢查 [疑難排解](#疑難排解) 部分
2. 執行測試腳本: `node test-self-hosted.js`
3. 查看相關服務日誌
4. 參考官方文檔

---

**享受您的自託管 Supabase 體驗！** 🎉