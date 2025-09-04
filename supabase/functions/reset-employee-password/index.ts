import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Parse request body
    const { employeeId, newPassword, adminEmail } = await req.json();

    console.log('Password reset request:', { employeeId, adminEmail });

    // Verify admin permissions
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('employees')
      .select('role, email')
      .eq('email', adminEmail)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle();

    if (adminError) {
      console.error('Admin verification error:', adminError);
      return new Response(JSON.stringify({ error: '管理員驗證失敗' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!adminData) {
      console.error('Admin not found or not authorized:', { adminEmail });
      return new Response(JSON.stringify({ error: '管理員權限不足' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get employee details
    const { data: employeeData, error: employeeError } = await supabaseAdmin
      .from('employees')
      .select('email, name')
      .eq('id', employeeId)
      .eq('is_active', true)
      .maybeSingle();

    if (employeeError || !employeeData) {
      console.error('Employee not found:', employeeError);
      return new Response(JSON.stringify({ error: '找不到員工資料' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Found employee:', { email: employeeData.email, name: employeeData.name });

    // Update password using Supabase Admin API
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      employeeId,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Password update error:', updateError);
      
      // Try to find user by email if direct ID update fails
      const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('Failed to list users:', listError);
        return new Response(JSON.stringify({ error: '密碼更新失敗' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const targetUser = users.users.find(user => user.email === employeeData.email);
      
      if (!targetUser) {
        // User doesn't exist in auth, create one
        console.log('Creating new auth user for employee:', employeeData.email);
        
        const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: employeeData.email,
          password: newPassword,
          email_confirm: true,
          user_metadata: {
            name: employeeData.name
          }
        });

        if (createError) {
          console.error('Failed to create auth user:', createError);
          return new Response(JSON.stringify({ error: '建立認證帳號失敗' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Successfully created auth user:', createData.user?.id);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: '密碼重設成功（新建認證帳號）',
          userId: createData.user?.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Update existing user
        const { error: retryError } = await supabaseAdmin.auth.admin.updateUserById(
          targetUser.id,
          { password: newPassword }
        );

        if (retryError) {
          console.error('Retry password update failed:', retryError);
          return new Response(JSON.stringify({ error: '密碼更新失敗' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        console.log('Successfully updated password for user:', targetUser.id);
        
        return new Response(JSON.stringify({ 
          success: true, 
          message: '密碼重設成功',
          userId: targetUser.id
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('Password updated successfully for user:', updateData.user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: '密碼重設成功',
      userId: updateData.user.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error in reset-employee-password:', error);
    return new Response(JSON.stringify({ error: '系統錯誤' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});