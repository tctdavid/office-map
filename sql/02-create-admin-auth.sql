-- 建立管理員認證帳號
-- 在 auth.users 表中建立 admin@gmail.com 帳號，密碼為 admin123

DO $$
DECLARE
    admin_user_id uuid;
    admin_email text := 'admin@gmail.com';
    admin_password text := 'admin123';
    hashed_password text;
BEGIN
    -- 檢查管理員帳號是否已存在
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = admin_email;
    
    IF admin_user_id IS NULL THEN
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
            '00000000-0000-0000-0000-000000000000', -- instance_id
            admin_user_id,                          -- id
            'authenticated',                        -- aud
            'authenticated',                        -- role
            admin_email,                           -- email
            hashed_password,                       -- encrypted_password
            now(),                                 -- email_confirmed_at
            now(),                                 -- invited_at
            '',                                    -- confirmation_token
            now(),                                 -- confirmation_sent_at
            '',                                    -- recovery_token
            null,                                  -- recovery_sent_at
            '',                                    -- email_change_token_new
            '',                                    -- email_change
            null,                                  -- email_change_sent_at
            null,                                  -- last_sign_in_at
            '{"provider": "email", "providers": ["email"]}', -- raw_app_meta_data
            jsonb_build_object(
                'name', '系統管理員',
                'email', admin_email
            ),                                     -- raw_user_meta_data
            false,                                 -- is_super_admin
            now(),                                 -- created_at
            now(),                                 -- updated_at
            null,                                  -- phone
            null,                                  -- phone_confirmed_at
            '',                                    -- phone_change
            '',                                    -- phone_change_token
            null,                                  -- phone_change_sent_at
            '',                                    -- email_change_token_current
            0,                                     -- email_change_confirm_status
            null,                                  -- banned_until
            '',                                    -- reauthentication_token
            null,                                  -- reauthentication_sent_at
            false,                                 -- is_sso_user
            null                                   -- deleted_at
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
            admin_user_id::text,                  -- provider_id
            admin_user_id,                        -- user_id
            jsonb_build_object(
                'sub', admin_user_id::text,
                'email', admin_email,
                'email_verified', true,
                'phone_verified', false
            ),                                    -- identity_data
            'email',                              -- provider
            now(),                                -- last_sign_in_at
            now(),                                -- created_at
            now(),                                -- updated_at
            admin_email                           -- email
        );
        
        RAISE NOTICE '✅ 管理員認證帳號建立成功';
        RAISE NOTICE '   Email: %', admin_email;
        RAISE NOTICE '   密碼: %', admin_password;
        RAISE NOTICE '   User ID: %', admin_user_id;
    ELSE
        RAISE NOTICE '⚠️  管理員帳號已存在，跳過建立';
        RAISE NOTICE '   Email: %', admin_email;
        RAISE NOTICE '   User ID: %', admin_user_id;
    END IF;
    
END $$;