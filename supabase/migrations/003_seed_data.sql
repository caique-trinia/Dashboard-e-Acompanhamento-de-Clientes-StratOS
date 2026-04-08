-- ============================================================
-- StratOS Dashboard — Seed: criar usuários internos
-- ============================================================
-- IMPORTANTE: Execute este script no Supabase SQL Editor com
-- permissão de service_role, pois insere diretamente em auth.users.
--
-- Alternativa mais simples: criar os usuários pelo painel do Supabase
-- em Authentication > Users > "Invite user" ou "Add user".
--
-- As senhas abaixo são exemplos. Troque por senhas seguras antes de rodar.
-- ============================================================

-- Nota: Supabase gerencia auth.users internamente.
-- Para criar usuários via SQL, use a função auth.create_user() do Supabase.
-- Execute no SQL Editor do Supabase Dashboard:

/*
SELECT auth.create_user(
  '{"email": "caique@stratos.com.br", "password": "TroqueEstaSenh@1!", "email_confirmed": true}'::jsonb
);

SELECT auth.create_user(
  '{"email": "marcos@stratos.com.br", "password": "TroqueEstaSenh@2!", "email_confirmed": true}'::jsonb
);

SELECT auth.create_user(
  '{"email": "patrick@stratos.com.br", "password": "TroqueEstaSenh@3!", "email_confirmed": true}'::jsonb
);
*/

-- Após criar os usuários, desabilite o signup público em:
-- Supabase Dashboard > Authentication > Settings > "Enable email signup" → OFF
