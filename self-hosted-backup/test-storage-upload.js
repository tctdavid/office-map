// 測試腳本：驗證 storage 上傳權限修復
// 使用方式：在瀏覽器開發者工具中執行此腳本

async function testStorageUpload() {
  console.log('🧪 開始測試 Storage 上傳權限...');
  
  try {
    // 創建測試用的圖片 blob
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText('TEST', 30, 55);
    
    // 轉換為 blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/png');
    });
    
    if (!blob) {
      throw new Error('無法創建測試圖片');
    }
    
    console.log('✅ 測試圖片創建成功');
    
    // 測試匿名上傳到 avatars 資料夾
    const testFileName = `avatars/test_${Date.now()}.png`;
    console.log(`📤 嘗試上傳到: ${testFileName}`);
    
    const { data, error } = await supabase.storage
      .from('staff')
      .upload(testFileName, blob, { upsert: true });
    
    if (error) {
      console.error('❌ 上傳失敗:', error);
      return false;
    }
    
    console.log('✅ 上傳成功:', data);
    
    // 測試讀取權限
    const { data: publicUrl } = supabase.storage
      .from('staff')
      .getPublicUrl(testFileName);
    
    console.log('🔗 公開網址:', publicUrl);
    
    // 清理測試檔案
    const { error: deleteError } = await supabase.storage
      .from('staff')
      .remove([testFileName]);
    
    if (deleteError) {
      console.warn('⚠️ 清理測試檔案失敗:', deleteError);
    } else {
      console.log('🗑️ 測試檔案已清理');
    }
    
    console.log('🎉 Storage 權限測試通過！');
    return true;
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
    return false;
  }
}

// 檢查 supabase 客戶端是否可用
if (typeof supabase === 'undefined') {
  console.error('❌ Supabase 客戶端未找到。請確保在應用程式頁面中執行此腳本。');
} else {
  console.log('🚀 執行 Storage 上傳測試...');
  testStorageUpload().then(success => {
    console.log(success ? '✅ 所有測試通過' : '❌ 測試失敗');
  });
}

// 同時提供手動測試函數
window.testStorageUpload = testStorageUpload;
console.log('💡 您也可以手動執行: testStorageUpload()');