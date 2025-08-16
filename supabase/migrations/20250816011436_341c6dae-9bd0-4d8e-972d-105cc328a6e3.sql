-- Delete the problematic auth user and recreate properly
DELETE FROM auth.identities WHERE email = 'david@company.com';
DELETE FROM auth.users WHERE email = 'david@company.com';

-- Create new user with proper structure
DO $$
DECLARE
    new_user_id UUID;
BEGIN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();
    
    -- Insert into auth.users with proper structure
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
        'david@company.com',
        crypt('temp123456', gen_salt('bf')),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('name', '曹大文'),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );
    
    -- Insert into auth.identities
    INSERT INTO auth.identities (
        provider_id,
        user_id,
        identity_data,
        provider,
        last_sign_in_at,
        created_at,
        updated_at
    ) VALUES (
        new_user_id::text,
        new_user_id,
        jsonb_build_object(
            'sub', new_user_id::text,
            'email', 'david@company.com',
            'email_verified', true,
            'phone_verified', false
        ),
        'email',
        now(),
        now(),
        now()
    );
    
    RAISE NOTICE 'Successfully created auth user for david@company.com with ID: %', new_user_id;
END $$;