-- Drop and recreate the function with SUPERUSER permissions
DROP FUNCTION IF EXISTS public.create_auth_for_existing_employees();

CREATE OR REPLACE FUNCTION public.create_auth_for_existing_employees()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
    emp_record RECORD;
    result_count INTEGER := 0;
    error_count INTEGER := 0;
    error_details TEXT := '';
    result_text TEXT;
    new_user_id UUID;
BEGIN
    -- Check if we can access auth schema
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        RETURN '錯誤：無法存取 auth schema';
    END IF;
    
    -- Loop through employees who don't have auth accounts yet
    FOR emp_record IN 
        SELECT e.email, e.name 
        FROM public.employees e
        WHERE e.email NOT IN (
            SELECT au.email 
            FROM auth.users au 
            WHERE au.email IS NOT NULL
        )
        AND e.is_active = true
        LIMIT 10  -- Limit to prevent timeouts
    LOOP
        BEGIN
            -- Generate a new UUID for the user
            new_user_id := gen_random_uuid();
            
            -- Create user using admin API (simplified approach)
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                new_user_id,
                'authenticated',
                'authenticated',
                emp_record.email,
                crypt('temp123456', gen_salt('bf')),
                now(),
                '{"provider": "email", "providers": ["email"]}',
                jsonb_build_object('name', emp_record.name, 'email', emp_record.email),
                now(),
                now(),
                '',
                ''
            );
            
            result_count := result_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_details := error_details || format('員工 %s: %s; ', emp_record.email, SQLERRM);
        END;
    END LOOP;
    
    IF error_count > 0 THEN
        result_text := format('成功建立 %s 個 Auth 帳號。發生 %s 個錯誤：%s', result_count, error_count, error_details);
    ELSE
        result_text := format('成功建立 %s 個 Auth 帳號。', result_count);
    END IF;
    
    RETURN result_text;
END;
$function$;