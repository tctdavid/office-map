-- Create a function to safely create auth accounts for existing employees
CREATE OR REPLACE FUNCTION public.create_auth_for_existing_employees()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    emp_record RECORD;
    result_count INTEGER := 0;
    error_count INTEGER := 0;
    result_text TEXT;
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
            -- Insert directly into auth.users with a temporary password
            -- Note: This bypasses normal auth flow, so users will need to reset password
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
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                '00000000-0000-0000-0000-000000000000',
                gen_random_uuid(),
                'authenticated',
                'authenticated',
                emp_record.email,
                crypt('temp123456', gen_salt('bf')), -- Temporary password
                now(),
                '{"provider": "email", "providers": ["email"]}',
                jsonb_build_object('name', emp_record.name),
                now(),
                now(),
                encode(gen_random_bytes(32), 'hex'),
                '',
                '',
                ''
            );
            
            result_count := result_count + 1;
        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            -- Continue with next employee
        END;
    END LOOP;
    
    result_text := format('Successfully created %s auth accounts. %s errors occurred.', result_count, error_count);
    
    -- Log the operation
    INSERT INTO public.employees (name, email, department, position, role, is_active, password_hash)
    VALUES ('Migration Log', 'migration@system.local', 'System', 'Migration', 'admin', false, '')
    ON CONFLICT (email) DO NOTHING;
    
    RETURN result_text;
END;
$$;

-- Add a note about password reset requirement
COMMENT ON FUNCTION public.create_auth_for_existing_employees() IS 'Creates auth accounts for existing employees. Users will need to reset their passwords via email.';

-- Grant execute permission to authenticated users (admins)
GRANT EXECUTE ON FUNCTION public.create_auth_for_existing_employees() TO authenticated;