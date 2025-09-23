#!/bin/bash

# 讓所有腳本可執行
chmod +x setup-supabase.sh
chmod +x reset-database.sh
chmod +x quick-test.sh
chmod +x make-executable.sh

echo "✅ 所有腳本已設為可執行"
echo ""
echo "可用的腳本："
echo "  ./setup-supabase.sh      - 原始安裝腳本"
echo "  ./reset-database.sh      - 資料庫重置腳本"  
echo "  ./quick-test.sh          - 快速測試腳本"
echo ""
echo "使用範例："
echo "  ./reset-database.sh full    # 完整重置資料庫"
echo "  ./quick-test.sh             # 測試所有服務"