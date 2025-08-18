# MVP Tickety - Sistema de Eventos

Sistema de criação e gerenciamento de eventos com venda de ingressos.

## 🚀 Funcionalidades

### **Autenticação Obrigatória**
- ✅ Login/Registro com Supabase Auth
- ✅ Sessões persistentes
- ✅ Logout seguro
- ✅ Sincronização automática de dados do usuário
- ✅ Login obrigatório para compras

### **Gestão de Eventos**
- ✅ Criar eventos com detalhes completos
- ✅ Editar eventos existentes
- ✅ Arquivar eventos (soft delete)
- ✅ Dashboard com estatísticas
- ✅ Validação robusta de datas e URLs
- ✅ Sistema de lotes com períodos de venda

### **Sistema de Ingressos**
- ✅ Múltiplos tipos de ingresso por evento
- ✅ Controle de quantidade disponível
- ✅ Preços personalizados
- ✅ Sistema de reservas temporárias
- ✅ Limpeza automática de reservas expiradas

### **Checkout Autenticado**
- ✅ Compra com conta obrigatória
- ✅ Coleta de dados pessoais
- ✅ Processo simplificado
- ✅ Validação completa de dados (CPF, email, telefone)
- ✅ Verificação de disponibilidade em tempo real
- ✅ Redirecionamento automático para login

### **Relatórios**
- ✅ Dashboard com KPIs
- ✅ Gráficos de vendas
- ✅ Estatísticas em tempo real

### **Validações e Segurança**
- ✅ Validação de datas (futuras, período válido)
- ✅ Validação de URLs únicas
- ✅ Validação de arquivos de imagem
- ✅ Validação de dados pessoais (CPF, email, telefone)
- ✅ Row Level Security (RLS) no banco de dados
- ✅ Proteção contra reservas duplicadas

## 🛠️ Tecnologias

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (Auth + Database)
- **UI**: Tailwind CSS + Shadcn/ui
- **Estados**: React Hooks
- **Roteamento**: React Router
- **Animações**: Lenis (Scroll Suave)

## 📦 Instalação

```bash
# Clonar repositório
git clone [url-do-repositorio]

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local

# Executar em desenvolvimento
npm run dev
```

## 🔧 Configuração

### Variáveis de Ambiente

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

### Banco de Dados

Execute o script `supabase-setup.sql` no SQL Editor do Supabase para criar as tabelas necessárias.

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
├── pages/              # Páginas da aplicação
├── contexts/           # Contextos React (Auth)
├── hooks/              # Hooks personalizados
├── services/           # Lógica de negócio
├── repositories/       # Acesso a dados
├── types/              # Definições TypeScript
├── utils/              # Utilitários (incluindo validações)
└── lib/                # Configurações (Supabase)
```

### **Principais Melhorias Implementadas**

#### **Validações Robustas**
- `src/utils/validations.ts` - Utilitários de validação reutilizáveis
- Validação de datas (futuras, período válido)
- Validação de URLs únicas e formato
- Validação de dados pessoais (CPF, email, telefone)
- Validação de arquivos de imagem

#### **Sistema de Reservas**
- `src/services/reservationService.ts` - Gerenciamento de reservas
- Limpeza automática de reservas expiradas
- Proteção contra reservas duplicadas
- Verificação de disponibilidade em tempo real
- Validação de data do evento (não permite compra de eventos passados)

#### **Melhorias nos Formulários**
- Validação em tempo real nos campos
- Mensagens de erro específicas e amigáveis
- Verificação de mudanças no formulário (incluindo batches)
- Sugestões de URLs alternativas

## 🔐 Autenticação

O sistema usa **Supabase Auth** para autenticação:

- **Registro**: Email + Senha + Nome
- **Login**: Email + Senha
- **Sessões**: Persistentes e seguras
- **Logout**: Limpeza completa da sessão

## 🎫 Sistema de Eventos

### Criação de Eventos
- Título, subtítulo, data, horário
- Localização e endereço
- URL única para o evento
- Imagem de capa
- Capacidade e ingressos

### Gestão de Ingressos
- Múltiplos tipos por evento
- Preços personalizados
- Controle de estoque
- Reservas temporárias

## 💳 Checkout

### Processo Anônimo
1. **Seleção de Ingressos**: Escolha quantidade
2. **Dados Pessoais**: Nome, email, telefone, CPF
3. **Confirmação**: Revisão e finalização

### Dados Coletados
- Nome completo
- Email
- Telefone
- CPF (para emissão de nota fiscal)

## 📊 Dashboard

### KPIs Principais
- Total de eventos
- Vendas do mês
- Ingressos vendidos
- Avaliação média

### Funcionalidades
- Gráficos de vendas
- Tabela de eventos
- Filtros por status
- Ações rápidas

## 🎨 Design System

### Cores
- **Primária**: Verde (#00D4AA)
- **Fundo**: Preto (#000000)
- **Texto**: Branco/Cinza
- **Bordas**: Cinza escuro

### Componentes
- Glass effect (backdrop-blur)
- Bordas arredondadas
- Transições suaves
- Hover states

## 🚀 Deploy

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Outras Plataformas
- Netlify
- Railway
- Heroku

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

**Desenvolvido com ❤️ para simplificar a gestão de eventos**
