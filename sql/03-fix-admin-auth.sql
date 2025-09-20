-- 修復管理員認證帳號
-- 確保 admin@gmail.com 帳號能正常運作

DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'admin@gmail.com';
    admin_password text := 'admin123';
    hashed_password text;
    existing_user_count integer;
BEGIN
    -- 檢查現有的管理員帳號
    SELECT COUNT(*) INTO existing_user_count 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF existing_user_count > 0 THEN
        RAISE NOTICE '管理員帳號已存在，正在更新密碼...';
        
        -- 更新現有帳號的密碼
        hashed_password := crypt(admin_password, gen_salt('bf'));
        
        UPDATE auth.users 
        SET 
            encrypted_password = hashed_password,
            email_confirmed_at = now(),
            updated_at = now()
        WHERE email = admin_email;
        
        RAISE NOTICE '✅ 管理員帳號密碼已更新';
    ELSE
        RAISE NOTICE '管理員帳號不存在，正在建立...';
        
        -- 生成新的 UUID
        admin_user_id := gen_random_uuid();
        
        -- 使用 crypt 函數加密密碼
        hashed_password := crypt(admin_password, gen_salt('bf'));
        
        -- 建立管理員認證帳號
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            admin_user_id,
            'authenticated',
            'authenticated',
            admin_email,
            hashed_password,
            now(),
            now(),
            '',
            now(),
            '',
            null,
            '',
            '',
            null,
            null,
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object(
                'name', '系統管理員',
                'email', admin_email
            ),
            false,
            now(),
            now(),
            null,
            null,
            '',
            '',
            null,
            '',
            0,
            null,
            '',
            null,
            false,
            null
        );
        
        -- 建立對應的身份記錄
        INSERT INTO auth.identities (
            provider_id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at,
            email
        ) VALUES (
            admin_user_id::text,
            admin_user_id,
            jsonb_build_object(
                'sub', admin_user_id::text,
                'email', admin_email,
                'email_verified', true,
                'phone_verified', false
            ),
            'email',
            now(),
            now(),
            now(),
            admin_email
        );
        
        RAISE NOTICE '✅ 管理員認證帳號建立成功';
    END IF;
    
    -- 確保管理員在 employees 表中也存在
    INSERT INTO public.employees (
        email,
        name,
        role,
        is_active,
        department,
        position
    ) VALUES (
        admin_email,
        '系統管理員',
        'admin',
        true,
        'IT',
        '系統管理員'
    ) ON CONFLICT (email) DO UPDATE SET
        role = 'admin',
        is_active = true,
        updated_at = now();
    
    RAISE NOTICE '✅ 管理員員工記錄已確保存在';
    RAISE NOTICE '帳號資訊:';
    RAISE NOTICE '  Email: %', admin_email;
    RAISE NOTICE '  密碼: %', admin_password;
    
END $$;

-- 檢查認證配置
DO $$
BEGIN
    -- 確保認證 schema 的 users 表有適當的索引
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE schemaname = 'auth' 
        AND tablename = 'users' 
        AND indexname = 'users_email_idx'
    ) THEN
        CREATE INDEX CONCURRENTLY users_email_idx ON auth.users(email);
        RAISE NOTICE '✅ 建立 email 索引';
    END IF;
    
    RAISE NOTICE '✅ 認證配置檢查完成';
END $$;