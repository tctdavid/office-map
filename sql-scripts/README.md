# 自託管 Supabase 資料庫設定腳本

基於雲端 Supabase 結構的完整 SQL 腳本，包含完整的 13 個腳本檔案。

## 📋 執行順序

### 🚀 核心資料庫建置（必須按順序執行）

1. **stage-1-basic-setup.sql** - 基礎設定與類型定義
2. **stage-2-employees-table.sql** - 核心員工表格
3. **stage-3-main-tables.sql** - 主要業務表格
4. **stage-4-relational-tables.sql** - 關聯表格
5. **stage-5-seating-tables.sql** - 座位相關表格
6. **stage-6-advanced-permissions.sql** - 完整權限管理
7. **stage-7-final-setup.sql** - 進階功能與索引

### 🔧 選擇性功能增強（依需求執行）

8. **foreign-keys-setup.sql** - 外鍵約束設定（建議執行，增強資料完整性）
9. **rls-performance-optimization.sql** - RLS 效能優化（大量資料時建議執行）
10. **fix-storage-permissions.sql** - 修復雲端儲存權限（雲端版本用）
11. **fix-self-hosted-storage.sql** - 修復自託管儲存設定（自託管版本用）

### 🔄 回滾與故障排除

12. **rollback-rls-optimization.sql** - RLS 效能優化回滾（僅當步驟9出現問題時使用）
13. **rollback-scripts.sql** - 完整清除所有建立的物件（重新開始時使用）

## ⚠️ 重要注意事項

### 基礎建置規則
- **步驟 1-7 必須按順序執行**，每個階段完成後檢查結果無誤再繼續
- 每個腳本都有內建的檢查機制
- 如果某個階段失敗，請查看錯誤訊息後重新執行該階段

### 儲存設定選擇
- **雲端 Supabase**：執行步驟 10 (fix-storage-permissions.sql)
- **自託管 Supabase**：執行步驟 11 (fix-self-hosted-storage.sql)
- **兩者擇一**，不要同時執行

### 效能優化建議
- 資料量小於 1萬筆：可跳過步驟 8 和 9
- 資料量大於 1萬筆：建議執行步驟 8 和 9
- 建議在測試環境先執行一遍

## 📊 建立的資料庫物件

### 表格 (9個)
- `employees` - 員工資料
- `containers` - 容器配置
- `equipment` - 設備管理
- `pcs` - 電腦資料
- `floor_containers` - 樓層容器
- `attendance_records` - 出勤記錄
- `pc_details` - 電腦詳細規格
- `seat_coordinates` - 座位座標
- `seats` - 座位配置

### 函數 (3個)
- `update_updated_at_column()` - 自動更新時間戳
- `is_admin()` - 管理員權限檢查
- `create_auth_for_existing_employees()` - 為現有員工建立認證帳號

### 類型定義
- `user_role` ENUM ('admin', 'employee')

### RLS 政策
- 每個表格都有完整的 Row Level Security 政策
- 支援公開存取和用戶特定存取控制

### 效能索引
- 關鍵欄位的查詢索引
- 複合索引用於常見查詢模式

## 🚀 執行後步驟

1. 在 `employees` 表格新增管理員帳號
2. 測試 RLS 政策是否正常運作
3. 設定前端應用程式連接到此資料庫
4. 測試所有功能模組

## 🔧 故障排除

### 常見問題解決

如果執行過程中出現錯誤：

1. **檢查錯誤訊息中的具體問題**
2. **確認是否有權限問題**
3. **檢查是否有重複物件**
4. **如需重新開始，先執行 rollback-scripts.sql**

### 特定問題處理

#### 🔄 效能問題回滾
- 如果執行 `rls-performance-optimization.sql` 後系統變慢
- 執行 `rollback-rls-optimization.sql` 回到優化前狀態
- 此腳本會移除所有效能優化但保持核心功能

#### 📁 儲存上傳問題
- **雲端版本**：照片上傳失敗 → 執行 `fix-storage-permissions.sql`
- **自託管版本**：照片上傳失敗 → 執行 `fix-self-hosted-storage.sql`
- 兩個腳本功能不同，請勿混用

#### 🗃️ 完整系統重置
- 使用 `rollback-scripts.sql` 完全清除所有資料庫物件
- ⚠️ **此操作會刪除所有資料，請務必先備份**
- 執行後可重新從步驟 1 開始建置

### 腳本執行檢查清單

每個階段執行後請確認：
- [ ] 沒有錯誤訊息
- [ ] 檢查腳本最後的驗證結果都顯示 "✓ 存在"
- [ ] 相關表格、函數、政策已正確建立

## 📊 進階功能說明

### 外鍵約束 (foreign-keys-setup.sql)
- 建立表格間的參照完整性
- 防止資料不一致問題
- 增強資料庫結構的可靠性
- **建議執行**，除非有特殊需求

### RLS 效能優化 (rls-performance-optimization.sql)
- 建立效能索引和優化的權限檢查函數
- 適用於大量資料環境（1萬筆以上）
- 包含效能監控和測試函數
- 如有問題可使用對應的回滾腳本還原

### 儲存權限設定
- **fix-storage-permissions.sql**：適用於雲端 Supabase 環境
- **fix-self-hosted-storage.sql**：適用於自託管 Docker 環境
- 解決照片上傳權限問題
- 兩者設定方式不同，請依據環境選擇

## 🔍 效能監控

執行效能優化後，可使用以下 SQL 查詢監控系統：

```sql
-- 檢查 RLS 效能狀態
SELECT * FROM check_rls_performance();

-- 測試查詢效能
SELECT * FROM test_rls_performance();
```

## 📝 自定義修改

如需修改結構：
1. 建議先在測試環境測試
2. 注意表格間的依賴關係
3. 確保 RLS 政策的一致性
4. 更新相關索引