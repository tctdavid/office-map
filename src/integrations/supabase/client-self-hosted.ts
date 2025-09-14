// 自託管 Supabase 客戶端配置
// 當使用自託管 Supabase 時，將此檔案重命名為 client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 自託管 Supabase URL 和金鑰
// 請根據您的實際設定修改這些值
const SUPABASE_URL = "http://localhost:8000";  // Kong API Gateway 地址
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

// 生產環境請使用正確的 URL 和金鑰
// const SUPABASE_URL = "https://your-domain.com";  // 您的網域
// const SUPABASE_PUBLISHABLE_KEY = "your-anon-key"; // 您的匿名金鑰

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'office-map-self-hosted@1.0.0'
    }
  }
});

// 測試連接函數
export const testConnection = async () => {
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

// 測試儲存功能
export const testStorage = async () => {
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