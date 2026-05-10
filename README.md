# Website de RSVP de Casamento

Aplicação para gestão de confirmações de presença de casamento, com frontend em React/Vite e backend em FastAPI + SQLite.

O projeto tem 2 áreas principais:
- área pública de RSVP para convidados
- área administrativa para consultar, exportar e apagar respostas

## O que o site faz

### Área pública
- apresenta a informação principal do evento
- permite confirmar ou recusar presença
- recolhe nomes, contacto, email, número de convidados, restrições alimentares e mensagem
- permite abrir a localização no Google Maps
- permite adicionar a data ao calendário
- mostra IBAN e contactos dos noivos

### Área administrativa
- login administrativo com password validada no backend
- consulta de respostas
- estatísticas básicas
- exportação para Excel
- remoção de uma resposta ou limpeza total

## Arquitetura

### Frontend
- React 18
- Vite
- componentes UI baseados em Radix
- Tailwind utilities

Ficheiros principais:
- `src/app/App.tsx`: alterna entre RSVP, login e painel admin
- `src/app/components/WeddingRSVP.tsx`: página pública
- `src/app/components/AdminLogin.tsx`: login admin
- `src/app/components/AdminPanel.tsx`: painel admin
- `src/app/lib/api.ts`: URL base da API
- `src/app/lib/adminSession.ts`: persistência segura da sessão admin

### Backend
- FastAPI
- Turso/libSQL em produção, quando `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` estão configurados
- SQLite local em `data/wedding.db` como fallback de desenvolvimento

Ficheiro principal:
- `main.py`

## Estrutura funcional atual

### RSVP público
Quando o utilizador submete o formulário:
1. o frontend monta o payload
2. envia `POST /submissoes`
3. o backend valida a submissão
4. o backend guarda os dados em SQLite

Proteções já implementadas:
- bloqueio de duplo clique no botão de submissão
- estado visual `A enviar...`
- honeypot simples no campo oculto `website`

### Calendário
Ao clicar no cartão da data:
- abre um modal com 2 opções
- `Google Calendar`: melhor para Android e browser no PC
- `.ics`: melhor para iPhone, iPad, Mac, Outlook e importação manual

O site tenta recomendar automaticamente a melhor opção consoante o dispositivo.

Ficheiro do evento:
- `public/calendar/catarina-diogo-2026.ics`

### Login admin
O login administrativo já não é validado no browser.

Fluxo atual:
1. o frontend envia a password para `POST /auth/login`
2. o backend valida `ADMIN_PASSWORD`
3. o backend devolve um token assinado
4. o frontend guarda o token em `sessionStorage`
5. o painel admin usa `Authorization: Bearer ...`

## Segurança atual

Melhorias já implementadas:
- a password admin deixou de estar hardcoded no frontend
- a antiga `x-api-key` pública deixou de ser usada no browser
- a autenticação admin passou para o backend
- o backend usa token assinado com HMAC
- a sessão admin expira automaticamente
- o frontend tolera falhas de `sessionStorage` em Safari/WebKit
- CORS ajustado para o domínio principal, `www` e localhost

### Variáveis de ambiente obrigatórias no backend

Tens de definir estas 3 variáveis:

```bash
ADMIN_PASSWORD=uma-password-forte
ADMIN_TOKEN_SECRET=um-segredo-longo-e-aleatorio
ADMIN_TOKEN_TTL_SECONDS=28800
```

Significado:
- `ADMIN_PASSWORD`: password da área admin
- `ADMIN_TOKEN_SECRET`: segredo usado para assinar tokens
- `ADMIN_TOKEN_TTL_SECONDS`: duração da sessão admin em segundos

Recomendação:
- usa uma password forte
- usa um segredo aleatório longo para `ADMIN_TOKEN_SECRET`
- mantém `28800` se 8 horas de sessão fizer sentido
- nunca coloques estas variáveis em ficheiros versionados no Git

### Variáveis de ambiente da base de dados

Em produção, define também:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

Se estas variáveis existirem, o backend usa Turso. Se não existirem, usa SQLite local em `data/wedding.db`.

## Endpoints da API

### Público
- `POST /submissoes`

### Protegidos por token admin
- `POST /auth/login`
- `GET /submissoes`
- `GET /estatisticas`
- `DELETE /submissoes`

## Arranque rapido local

### Linux / Ubuntu / WSL

Para Linux, usa os scripts dedicados:

```bash
./setup-local-linux.sh
./start-local-linux.sh
```

O `setup-local-linux.sh` faz estas validacoes antes do setup local:
- confirma que estas em Linux
- tenta instalar `python3`, `python3-venv`, `nodejs` e `npm` com `apt` quando necessario
- valida que tens Node.js 18+
- depois executa o setup comum em `./setup-local.sh`

O `start-local-linux.sh` arranca o mesmo fluxo local comum de frontend + backend.

### macOS

Para macOS, usa os scripts dedicados:

```bash
./setup-local-macos.sh
./start-local-macos.sh
```

O `setup-local-macos.sh` faz estas validacoes antes do setup local:
- confirma que estas em macOS
- confirma que tens `Xcode Command Line Tools`
- confirma que tens `Homebrew`
- instala `python3` com `brew` se faltar
- instala `node`/`npm` com `brew` se faltar
- depois executa o mesmo setup local usado nos outros ambientes

Os scripts `setup-local.sh` e `start-local.sh` continuam a existir como base comum usada pelos wrappers de Linux e macOS.


O `start-local.sh` arranca:
- backend em `http://127.0.0.1:8000`
- frontend em `http://127.0.0.1:5173`

Importante:
- o script nao altera o codigo do frontend
- o frontend continua a ter como fallback o backend remoto
- em modo local, o script injeta `VITE_API_BASE_URL=http://127.0.0.1:8000` no arranque do Vite
- a janela do terminal onde corres `./start-local.sh` tem de ficar aberta; se a fechares ou fizeres `Ctrl+C`, os dois servidores param

Credenciais locais por defeito do admin:

```bash
LocalAdmin-2026
```

Podes alterar estes valores ao arrancar:

```bash
ADMIN_PASSWORD='outra-password' BACKEND_PORT=8001 FRONTEND_PORT=5174 ./start-local.sh
```

Em Linux, o arranque equivalente e:

```bash
ADMIN_PASSWORD='outra-password' BACKEND_PORT=8001 FRONTEND_PORT=5174 ./start-local-linux.sh
```

Em macOS, o arranque equivalente e:

```bash
ADMIN_PASSWORD='outra-password' BACKEND_PORT=8001 FRONTEND_PORT=5174 ./start-local-macos.sh
```

## Como correr o frontend localmente

Pré-requisitos:
- Node.js 18+
- npm

Instalação:

```bash
npm install
```

Arranque em desenvolvimento:

```bash
npm run dev
```

Build de produção:

```bash
npm run build
```

### Configuração do frontend
Por defeito, o frontend usa este backend:

```bash
https://backend-7ej1.onrender.com
```

Isto vem do fallback em `src/app/lib/api.ts`. Ou seja:
- se correres apenas `npm run dev`, o frontend continua a falar com o backend remoto
- se definires `VITE_API_BASE_URL`, o frontend passa a usar esse backend sem precisares de mudar o codigo

Exemplo para apontar o frontend ao backend local:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173
```

Exemplo genérico para outro backend:

```bash
VITE_API_BASE_URL=https://o-teu-backend.com
```

## Como correr o backend localmente

Pré-requisitos:
- Python 3.10+
- pip

Instala dependências mínimas:

```bash
pip install fastapi uvicorn pydantic
```

Define as variáveis de ambiente:

```bash
export ADMIN_PASSWORD='uma-password-forte'
export ADMIN_TOKEN_SECRET='um-segredo-longo-e-aleatorio'
export ADMIN_TOKEN_TTL_SECONDS='28800'
```

Arranque local:

```bash
uvicorn main:api --host 0.0.0.0 --port 8000 --reload
```

Se quiseres correr backend e frontend manualmente, sem scripts:

Terminal 1:

```bash
export ADMIN_PASSWORD='uma-password-forte'
export ADMIN_TOKEN_SECRET='um-segredo-longo-e-aleatorio'
export ADMIN_TOKEN_TTL_SECONDS='28800'
uvicorn main:api --host 127.0.0.1 --port 8000 --reload
```

Terminal 2:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000 npm run dev -- --host 127.0.0.1 --port 5173
```

## Base de dados

Em produção, a aplicação deve usar Turso/libSQL:

```bash
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
```

Em desenvolvimento local, se essas variáveis não existirem, a aplicação usa SQLite em:

```bash
data/wedding.db
```

Notas importantes:
- SQLite local serve para desenvolvimento, mas não deve ser a persistência de produção em Vercel/serverless
- Turso guarda os dados fora do filesystem efémero do backend
- `data/wedding.db` pode ser usado como origem para migrar dados antigos

### Inicializar ou migrar dados para Turso

Instala as dependências:

```bash
./setup-local.sh
```

Define as variáveis no terminal, sem as gravar em ficheiros:

```bash
export TURSO_DATABASE_URL='libsql://...'
export TURSO_AUTH_TOKEN='...'
```

Em alternativa, corre o script sem exports e ele pede o URL e o token no terminal.

Para criar a tabela no Turso sem importar dados locais:

```bash
.venv/bin/python scripts/migrate_sqlite_to_turso.py --init-only
```

Para criar a tabela e importar as linhas existentes em `data/wedding.db`:

```bash
.venv/bin/python scripts/migrate_sqlite_to_turso.py
```

O script usa `INSERT OR IGNORE`, por isso pode ser corrido novamente sem duplicar linhas com o mesmo `int_SubmissaoID`.

## Deploy

### Frontend
Pode ser servido como site estático após `npm run build`.

### Backend
O backend precisa de:
- uma base de dados persistente, preferencialmente Turso em produção
- variáveis de ambiente configuradas
- `TURSO_DATABASE_URL` e `TURSO_AUTH_TOKEN` definidos no serviço de backend

### Render
Se usares Render para o backend:
1. abre o serviço
2. vai a `Environment`
3. cria `ADMIN_PASSWORD`
4. cria `ADMIN_TOKEN_SECRET`
5. cria `ADMIN_TOKEN_TTL_SECONDS`
6. cria `TURSO_DATABASE_URL`
7. cria `TURSO_AUTH_TOKEN`
8. faz deploy

### Vercel
Se usares Vercel para o backend:
1. abre o projeto do backend
2. vai a `Settings` > `Environment Variables`
3. cria `ADMIN_PASSWORD`
4. cria `ADMIN_TOKEN_SECRET`
5. cria `ADMIN_TOKEN_TTL_SECONDS`
6. cria `TURSO_DATABASE_URL`
7. cria `TURSO_AUTH_TOKEN`
8. faz novo deploy do backend

Importante: SQLite local não é persistente em serverless. Usa Turso ou outra base remota.

## Safari / WebKit

Foram introduzidos ajustes específicos para melhorar compatibilidade:
- tratamento seguro de `sessionStorage`
- CORS explícita no backend
- fluxo de login menos sensível a comportamentos de WebKit

## Limitações atuais

Estas limitações continuam a existir ou podem merecer melhoria futura:
- SQLite é simples e adequado para volume pequeno, mas não é ideal para crescimento ou maior concorrência
- não existe ainda rate limiting no login nem no RSVP
- a deduplicação está forte no frontend, mas ainda pode ser reforçada no backend
- o bundle do frontend continua com aviso de chunk acima de `500 kB`
- o repositório ainda contém diretórios gerados/versionados como `dist/` e `node_modules/`, o que complica o git

## Melhorias recomendadas no futuro
- rate limiting no backend
- deduplicação por `requestId` no RSVP
- backups da base de dados
- migrações de schema
- possível migração para Postgres se o projeto crescer
- code splitting da área admin e do `xlsx`

## Comandos úteis

Frontend:

```bash
npm install
npm run dev
npm run build
```

Backend:

```bash
export ADMIN_PASSWORD='uma-password-forte'
export ADMIN_TOKEN_SECRET='um-segredo-longo-e-aleatorio'
export ADMIN_TOKEN_TTL_SECONDS='28800'
export TURSO_DATABASE_URL='libsql://...'
export TURSO_AUTH_TOKEN='...'
uvicorn main:api --host 0.0.0.0 --port 8000 --reload
```

## Estado do projeto

Neste momento o projeto já inclui:
- autenticação admin no backend
- proteção básica contra submissões repetidas
- suporte de calendário multi-dispositivo
- exportação Excel no painel admin
- compatibilidade melhorada com Safari/WebKit
