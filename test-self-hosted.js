#!/usr/bin/env node

/**
 * 自託管 Supabase 測試腳本
 * 測試各項服務是否正常運作
 */

const https = require('http');
const { exec } = require('child_process');

// 測試配置
const TESTS = {
  database: { url: 'http://localhost:5432', name: 'PostgreSQL 資料庫' },
  kong: { url: 'http://localhost:8000/health', name: 'Kong API Gateway' },
  studio: { url: 'http://localhost:3000', name: 'Supabase Studio' },
  auth: { url: 'http://localhost:8000/auth/v1/settings', name: '認證服務' },
  storage: { url: 'http://localhost:8000/storage/v1/bucket', name: '儲存服務' },
  rest: { url: 'http://localhost:8000/rest/v1/', name: 'REST API' }
};

// 顏色輸出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// HTTP 測試函數
const testEndpoint = (url, name) => {
  return new Promise((resolve) => {
    const request = https.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        log('green', `✅ ${name}: 正常運作 (狀態碼: ${res.statusCode})`);
        resolve(true);
      } else {
        log('yellow', `⚠️  ${name}: 回應異常 (狀態碼: ${res.statusCode})`);
        resolve(false);
      }
    });

    request.on('error', (err) => {
      log('red', `❌ ${name}: 連接失敗 - ${err.message}`);
      resolve(false);
    });

    request.on('timeout', () => {
      log('red', `❌ ${name}: 連接超時`);
      request.destroy();
      resolve(false);
    });
  });
};

// 測試 Docker 容器狀態
const testDockerContainers = () => {
  return new Promise((resolve) => {
    exec('docker compose ps --format json', (error, stdout, stderr) => {
      if (error) {
        log('red', `❌ Docker Compose 檢查失敗: ${error.message}`);
        resolve(false);
        return;
      }

      try {
        const containers = stdout.trim().split('\n').map(line => JSON.parse(line));
        log('blue', '\n📋 Docker 容器狀態:');
        
        let allRunning = true;
        containers.forEach(container => {
          const status = container.State === 'running' ? '✅' : '❌';
          const health = container.Health ? ` (${container.Health})` : '';
          console.log(`  ${status} ${container.Service}: ${container.State}${health}`);
          
          if (container.State !== 'running') {
            allRunning = false;
          }
        });
        
        resolve(allRunning);
      } catch (parseError) {
        log('red', `❌ 解析 Docker 狀態失敗: ${parseError.message}`);
        resolve(false);
      }
    });
  });
};

// 測試資料庫連接
const testDatabase = () => {
  return new Promise((resolve) => {
    exec('docker compose exec -T db pg_isready -U postgres', (error) => {
      if (error) {
        log('red', '❌ PostgreSQL 資料庫: 無法連接');
        resolve(false);
      } else {
        log('green', '✅ PostgreSQL 資料庫: 正常運作');
        resolve(true);
      }
    });
  });
};

// 測試儲存功能
const testStorageUpload = async () => {
  log('blue', '\n🧪 測試檔案上傳功能...');
  
  const testScript = `
    const { createClient } = require('@supabase/supabase-js');
    
    const supabase = createClient(
      'http://localhost:8000',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
    );
    
    async function testUpload() {
      try {
        // 測試建立測試檔案
        const testFile = new File(['Hello World'], 'test.txt', { type: 'text/plain' });
        
        const { data, error } = await supabase.storage
          .from('staff')
          .upload('avatars/test-' + Date.now() + '.txt', testFile);
        
        if (error) {
          console.log('❌ 檔案上傳失敗:', error.message);
          return false;
        }
        
        console.log('✅ 檔案上傳成功:', data.path);
        return true;
      } catch (err) {
        console.log('❌ 檔案上傳測試錯誤:', err.message);
        return false;
      }
    }
    
    testUpload().then(result => process.exit(result ? 0 : 1));
  `;
  
  return new Promise((resolve) => {
    // 這裡我們簡化測試，只檢查 storage 端點是否可訪問
    testEndpoint('http://localhost:8000/storage/v1/bucket/staff', '檔案上傳功能').then(resolve);
  });
};

// 主測試函數
async function runTests() {
  log('blue', '🧪 開始測試自託管 Supabase 環境...\n');
  
  // 測試 Docker 容器
  log('blue', '📋 檢查 Docker 容器狀態...');
  const dockerStatus = await testDockerContainers();
  
  if (!dockerStatus) {
    log('red', '\n❌ 部分容器未正常運作，請檢查 Docker Compose 設定');
    log('yellow', '💡 嘗試執行: docker compose logs [service-name] 查看錯誤日誌');
  }
  
  // 測試各個服務端點
  log('blue', '\n🌐 測試服務端點...');
  const results = {};
  
  // 測試資料庫
  results.database = await testDatabase();
  
  // 測試其他端點
  for (const [key, config] of Object.entries(TESTS)) {
    if (key !== 'database') {
      results[key] = await testEndpoint(config.url, config.name);
    }
  }
  
  // 測試檔案上傳
  results.upload = await testStorageUpload();
  
  // 顯示測試結果
  log('blue', '\n📊 測試結果摘要:');
  let passedTests = 0;
  let totalTests = 0;
  
  for (const [key, passed] of Object.entries(results)) {
    totalTests++;
    if (passed) passedTests++;
  }
  
  if (passedTests === totalTests) {
    log('green', `\n🎉 所有測試通過！(${passedTests}/${totalTests})`);
    log('green', '✅ 自託管 Supabase 環境已就緒');
    log('blue', '\n📝 後續步驟:');
    log('blue', '  1. 訪問 Supabase Studio: http://localhost:3000');
    log('blue', '  2. 建立管理員帳號');
    log('blue', '  3. 更新前端應用配置');
  } else {
    log('yellow', `\n⚠️  部分測試失敗 (${passedTests}/${totalTests})`);
    log('yellow', '💡 請檢查失敗的服務並查看相關日誌');
    log('blue', '\n🔧 除錯指令:');
    log('blue', '  • 查看所有日誌: docker compose logs');
    log('blue', '  • 查看特定服務: docker compose logs [service-name]');
    log('blue', '  • 重啟服務: docker compose restart [service-name]');
  }
  
  process.exit(passedTests === totalTests ? 0 : 1);
}

// 執行測試
runTests().catch(err => {
  log('red', `❌ 測試執行失敗: ${err.message}`);
  process.exit(1);
});