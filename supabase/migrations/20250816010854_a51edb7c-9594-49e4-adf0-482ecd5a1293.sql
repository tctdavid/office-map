-- Fix missing auth.identities for david@company.com (without email column)
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT 
    au.id::text,
    au.id,
    jsonb_build_object(
        'sub', au.id::text,
        'email', au.email,
        'email_verified', true,
        'phone_verified', false
    ),
    'email',
    now(),
    now(),
    now()
FROM auth.users au
WHERE au.email = 'david@company.com'
AND NOT EXISTS (
    SELECT 1 FROM auth.identities ai 
    WHERE ai.user_id = au.id
);