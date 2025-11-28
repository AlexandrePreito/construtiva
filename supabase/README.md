# Supabase – roteiro futuro

> O Supabase ainda não está configurado. Use este roteiro quando as telas estiverem validadas.

1. Criar um projeto no Supabase e habilitar a extensão `pgcrypto` para `gen_random_uuid()`.
2. Executar o arquivo [`schema.sql`](./schema.sql) no SQL Editor para criar tabelas, enums e relacionamentos.
3. Definir políticas de segurança (RLS) para cada tabela. Sugestão inicial:
   - `obras`: somente membros associados podem visualizar/editar.
   - `servicos`, `etapas`, `cronograma_itens`: leitura para membros, escrita para papéis com permissão específica.
   - `stage_validations`: gravação liberada apenas para usuários com permissão `validar_etapa`.
4. Popular `user_roles` com perfis padrão (Administrador, Engenheiro, Visualizador).
5. Gerar chaves de serviço e configurar as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6. Criar *hooks* compartilhados no front (`lib/supabase/client.ts`) para reaproveitar a instância do Supabase.

Após concluir os passos acima, revisite as telas para conectar os dados reais.



