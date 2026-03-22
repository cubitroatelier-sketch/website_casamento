# Wedding RSVP Form

Website de RSVP para casamento com frontend em React/Vite e backend em FastAPI + SQLite.

## Frontend

```bash
npm i
npm run dev
```

Se o backend não estiver no URL por defeito, define `VITE_API_BASE_URL` antes de arrancar o frontend.

## Backend

O backend expõe:
- `POST /submissoes`: endpoint público para enviar RSVP
- `POST /auth/login`: autenticação administrativa
- `GET /submissoes`: lista de respostas, protegido por token admin
- `GET /estatisticas`: estatísticas, protegido por token admin
- `DELETE /submissoes`: remoção de respostas, protegido por token admin

## Segurança

As seguintes variáveis de ambiente são obrigatórias no backend:

```bash
ADMIN_PASSWORD="defina-uma-password-forte"
ADMIN_TOKEN_SECRET="defina-um-segredo-longo-e-aleatorio"
ADMIN_TOKEN_TTL_SECONDS="28800"
```

Notas:
- A password admin deixou de estar hardcoded no frontend.
- O frontend deixou de enviar `x-api-key` pública para o browser.
- A área administrativa usa agora token assinado no backend.
- O formulário RSVP público usa um campo honeypot (`website`) para rejeitar submissões automáticas simples.
