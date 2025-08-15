-- Drop and recreate the function with proper error handling
DROP FUNCTION IF EXISTS public.create_auth_for_existing_employees();

CREATE OR REPLACE FUNCTION public.create_auth_for_existing_employees()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    emp_record RECORD;
    result_count INTEGER := 0;
    error_count INTEGER := 0;
    error_msg TEXT;
    result_text TEXT;
    new_user_id UUID;
BEGIN
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
    LOOP
        BEGIN
            -- Generate a new UUID for the user
            new_user_id := gen_random_uuid();
            
            -- Insert into auth.users
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                confirmation_sent_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                new_user_id,
                'authenticated',
                'authenticated',
                emp_record.email,
                crypt('temp123456', gen_salt('bf')),
                now(),
                now(),
                '{"provider": "email", "providers": ["email"]}',
                jsonb_build_object('name', emp_record.name),
                now(),
                now(),
                '',
                '',
                '',
                ''
            );
            
            -- Also insert into auth.identities
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
                new_user_id::text,
                new_user_id,
                jsonb_build_object(
                    'sub', new_user_id::text,
                    'email', emp_record.email,
                    'email_verified', true,
                    'phone_verified', false
                ),
                'email',
                now(),
                now(),
                now(),
                emp_record.email
            );
            
            result_count := result_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            error_msg := SQLERRM;
            RAISE NOTICE 'Error creating auth for %: %', emp_record.email, error_msg;
        END;
    END LOOP;
    
    result_text := format('成功建立 %s 個 Auth 帳號。發生 %s 個錯誤。', result_count, error_count);
    
    RETURN result_text;
END;
$function$;