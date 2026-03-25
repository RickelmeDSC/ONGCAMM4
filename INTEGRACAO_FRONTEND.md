# Guia de Integração — Frontend × Backend ONG CAMM4

---

## 1. INFORMAÇÕES GERAIS

| Item | Valor |
|---|---|
| URL base (desenvolvimento) | `http://localhost:3000/api/v1` |
| Documentação interativa (Swagger) | `http://localhost:3000/api/docs` |
| Formato de dados | JSON |
| Autenticação | JWT via header `Authorization: Bearer <token>` |

---

## 2. AUTENTICAÇÃO

### 2.1 Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "usuario@ong.com",
  "senha": "senha123"
}
```

**Resposta de sucesso (200):**
```json
{
  "access_token": "eyJhbGci...",
  "expires_in": 86400,
  "usuario": {
    "id": 1,
    "nome": "Rickelme",
    "email": "rickelme@ong.com",
    "nivel_acesso": 3
  }
}
```

### 2.2 Como usar o token

Salve o `access_token` no `localStorage` e envie em **todas** as requisições protegidas:

```javascript
// Salvar após login
localStorage.setItem('token', response.access_token);
localStorage.setItem('usuario', JSON.stringify(response.usuario));

// Enviar nas requisições
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
}
```

### 2.3 Logout

Basta apagar o token do localStorage — não há endpoint de logout:

```javascript
localStorage.removeItem('token');
localStorage.removeItem('usuario');
// Redirecionar para a tela de login
```

### 2.4 Verificar usuário logado

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "id_usuario": 1,
  "nome": "Rickelme",
  "nivel_acesso": 3
}
```

---

## 3. NÍVEIS DE ACESSO

O campo `nivel_acesso` retornado no login define o que o usuário pode fazer:

| Nível | Perfil | Permissões |
|---|---|---|
| 1 | Voluntário | Visualizar dados, registrar frequência |
| 2 | Gestor | Cadastrar e editar dados, gerar relatórios |
| 3 | Diretor | Acesso total, incluindo exclusão e emissão de declarações |

Use o `nivel_acesso` para mostrar ou ocultar botões/telas no frontend.

---

## 4. TRATAMENTO DE ERROS

Todos os erros seguem o mesmo formato:

```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "UnauthorizedException",
  "timestamp": "2026-03-25T19:00:00.000Z",
  "path": "/api/v1/criancas"
}
```

| Status | Significado | Ação no frontend |
|---|---|---|
| 401 | Token inválido ou ausente | Redirecionar para login |
| 403 | Sem permissão suficiente | Exibir mensagem "Acesso negado" |
| 404 | Recurso não encontrado | Exibir mensagem "Não encontrado" |
| 409 | CPF ou email duplicado | Exibir mensagem de conflito |
| 400 | Dados inválidos | Exibir erros de validação |
| 500 | Erro interno | Exibir mensagem genérica de erro |

---

## 5. ENDPOINTS DISPONÍVEIS

### 5.1 Usuários
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /usuarios | 2 | Listar usuários |
| GET | /usuarios/:id | 2 | Buscar por ID |
| POST | /usuarios | 3 | Criar usuário |
| PATCH | /usuarios/:id | 3 | Atualizar usuário |
| DELETE | /usuarios/:id | 3 | Remover usuário |

### 5.2 Crianças
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /criancas | 1 | Listar crianças |
| GET | /criancas/busca?nome=&matricula= | 1 | Buscar por nome ou matrícula |
| GET | /criancas/:id | 1 | Buscar por ID |
| POST | /criancas | 2 | Cadastrar criança |
| PATCH | /criancas/:id | 2 | Atualizar criança |
| DELETE | /criancas/:id | 3 | Remover criança |

### 5.3 Responsáveis
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /responsaveis | 1 | Listar responsáveis |
| GET | /responsaveis/:id | 1 | Buscar por ID |
| POST | /responsaveis | 2 | Cadastrar responsável |
| PATCH | /responsaveis/:id | 2 | Atualizar responsável |
| DELETE | /responsaveis/:id | 3 | Remover responsável |

### 5.4 Documentos (upload)
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| POST | /documentos/upload/foto/:id | 2 | Upload de foto |
| POST | /documentos/upload/certidao/:id | 2 | Upload de certidão |
| POST | /documentos/upload/vacina/:id | 2 | Upload de cartão de vacina |
| GET | /documentos/:id | 1 | Listar documentos da criança |

**Upload de arquivo:**
```javascript
const formData = new FormData();
formData.append('file', arquivo);

fetch('/api/v1/documentos/upload/foto/1', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
  // NÃO definir Content-Type — o browser define automaticamente com boundary
});
```

### 5.5 Frequência
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /frequencia | 1 | Listar todos os registros |
| GET | /frequencia/crianca/:id | 1 | Histórico por criança |
| GET | /frequencia/data/:data | 1 | Frequência de uma data (YYYY-MM-DD) |
| POST | /frequencia | 1 | Registrar presença/ausência |
| PATCH | /frequencia/:id | 2 | Corrigir registro |
| DELETE | /frequencia/:id | 3 | Remover registro |

### 5.6 Atividades
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /atividades | 1 | Listar atividades |
| GET | /atividades/:id | 1 | Buscar por ID |
| POST | /atividades | 2 | Registrar atividade |
| PATCH | /atividades/:id | 2 | Atualizar atividade |
| DELETE | /atividades/:id | 3 | Remover atividade |

### 5.7 Eventos
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /eventos | 1 | Listar eventos |
| GET | /eventos/:id | 1 | Buscar por ID |
| POST | /eventos | 2 | Registrar evento |
| PATCH | /eventos/:id | 2 | Atualizar evento |
| DELETE | /eventos/:id | 3 | Remover evento |

### 5.8 Doações
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /doacoes | 2 | Listar doações |
| GET | /doacoes/:id | 2 | Buscar por ID |
| POST | /doacoes | 2 | Registrar doação |
| PATCH | /doacoes/:id | 2 | Atualizar doação |
| DELETE | /doacoes/:id | 3 | Remover doação |

### 5.9 Declarações
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /declaracoes | 2 | Listar declarações |
| GET | /declaracoes/:id | 2 | Buscar por ID |
| POST | /declaracoes | 3 | Emitir declaração |
| GET | /declaracoes/:id/pdf | 2 | Download do PDF |

**Download de PDF:**
```javascript
const response = await fetch(`/api/v1/declaracoes/1/pdf`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const blob = await response.blob();
const url = URL.createObjectURL(blob);
window.open(url); // abre o PDF em nova aba
```

### 5.10 Relatórios
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /relatorios | 2 | Listar relatórios gerados |
| POST | /relatorios/frequencia | 2 | Gerar relatório de frequência |
| POST | /relatorios/doacoes | 2 | Gerar relatório de doações |
| POST | /relatorios/atividades | 2 | Gerar relatório de atividades |
| POST | /relatorios/auditoria | 3 | Gerar relatório de auditoria |
| GET | /relatorios/:id/download | 2 | Download do relatório |

### 5.11 Auditoria
| Método | Rota | Nível | Descrição |
|---|---|---|---|
| GET | /auditoria/logs | 3 | Todos os logs |
| GET | /auditoria/logs/usuario/:id | 3 | Logs por usuário |
| GET | /auditoria/logs/periodo?inicio=&fim= | 3 | Logs por período |

---

## 6. EXEMPLOS DE INTEGRAÇÃO

### Interceptor global (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// Adiciona token automaticamente em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redireciona para login se token expirar
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Exemplo de login completo

```javascript
async function login(email, senha) {
  const { data } = await api.post('/auth/login', { email, senha });
  localStorage.setItem('token', data.access_token);
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
  return data.usuario;
}
```

### Verificar permissão no frontend

```javascript
function temPermissao(nivelMinimo) {
  const usuario = JSON.parse(localStorage.getItem('usuario'));
  return usuario?.nivel_acesso >= nivelMinimo;
}

// Uso nos componentes:
// temPermissao(2) → true se Gestor ou Diretor
// temPermissao(3) → true somente se Diretor
```

---

## 7. CORS

O backend está configurado para aceitar requisições de qualquer origem em desenvolvimento (`*`). Em produção, configurar a origem específica do frontend.

---

*Documento gerado em 25/03/2026. Para dúvidas, consultar o Swagger em `/api/docs` ou entrar em contato com Rickelme.*
