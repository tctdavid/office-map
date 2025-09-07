# 自託管 Supabase 資料庫設定腳本

基於雲端 Supabase 結構的完整 SQL 腳本，分為 7 個階段執行。

## 📋 執行順序

### 必須按順序執行的階段：

1. **stage-1-basic-setup.sql** - 基礎設定與類型定義
2. **stage-2-employees-table.sql** - 核心員工表格
3. **stage-3-main-tables.sql** - 主要業務表格
4. **stage-4-relational-tables.sql** - 關聯表格
5. **stage-5-seating-tables.sql** - 座位相關表格
6. **stage-6-advanced-permissions.sql** - 完整權限管理
7. **stage-7-final-setup.sql** - 進階功能與索引

## ⚠️ 重要注意事項

- **必須按順序執行**，每個階段完成後檢查結果無誤再繼續
- 每個腳本都有內建的檢查機制
- 如果某個階段失敗，請查看錯誤訊息後重新執行該階段
- 建議在測試環境先執行一遍

## 🔄 回滾與清除

- **rollback-scripts.sql** - 完整清除所有建立的物件
- ⚠️ 使用前請備份重要資料

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

如果執行過程中出現錯誤：

1. 檢查錯誤訊息中的具體問題
2. 確認是否有權限問題
3. 檢查是否有重複物件
4. 如需重新開始，先執行 rollback-scripts.sql

## 📝 自定義修改

如需修改結構：
1. 建議先在測試環境測試
2. 注意表格間的依賴關係
3. 確保 RLS 政策的一致性
4. 更新相關索引