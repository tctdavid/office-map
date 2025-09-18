// Office Map - 自託管 Supabase 客戶端配置
// 適用於 192.168.52.112 網域

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 自託管 Supabase 配置
const SUPABASE_URL = "http://192.168.52.112:8000";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// 建立 Supabase 客戶端
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'office-map-self-hosted@2.0.0'
    }
  }
});

// 測試連接函數
export const testConnection = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('employees').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase 連接失敗:', error);
      return false;
    }
    console.log('✅ Supabase 連接成功');
    return true;
  } catch (err) {
    console.error('❌ Supabase 連接測試失敗:', err);
    return false;
  }
};

// 測試認證功能
export const testAuth = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('❌ 認證測試失敗:', error);
      return false;
    }
    console.log('✅ 認證服務正常');
    return true;
  } catch (err) {
    console.error('❌ 認證測試失敗:', err);
    return false;
  }
};

// 測試儲存功能
export const testStorage = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.storage.from('staff').list('', { limit: 1 });
    if (error) {
      console.error('❌ Storage 連接失敗:', error);
      return false;
    }
    console.log('✅ Storage 連接成功');
    return true;
  } catch (err) {
    console.error('❌ Storage 連接測試失敗:', err);
    return false;
  }
};

// 管理員登入測試
export const testAdminLogin = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    
    if (error) {
      console.error('❌ 管理員登入失敗:', error);
      return false;
    }
    
    console.log('✅ 管理員登入成功:', data.user?.email);
    return true;
  } catch (err) {
    console.error('❌ 管理員登入測試失敗:', err);
    return false;
  }
};

// 完整系統測試
export const runSystemTest = async (): Promise<void> => {
  console.log('🧪 開始 Office Map 自託管系統測試...');
  console.log('='.repeat(50));
  
  const tests = [
    { name: '資料庫連接', test: testConnection },
    { name: '認證服務', test: testAuth },
    { name: '儲存服務', test: testStorage },
    { name: '管理員登入', test: testAdminLogin }
  ];
  
  let passedTests = 0;
  
  for (const { name, test } of tests) {
    console.log(`\n🔍 測試 ${name}...`);
    const result = await test();
    if (result) {
      passedTests++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 測試結果: ${passedTests}/${tests.length} 通過`);
  
  if (passedTests === tests.length) {
    console.log('🎉 所有測試通過！系統運行正常。');
  } else {
    console.log('⚠️  部分測試失敗，請檢查系統配置。');
  }
};