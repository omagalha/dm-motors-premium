# 🚗 DM Motors Premium

Sistema web desenvolvido para concessionárias com foco em **aumentar vendas, organizar estoque e gerar leads direto no WhatsApp**.

---

## 🎯 Objetivo

Transformar o Instagram da loja em um **canal de vendas estruturado**, onde o cliente:

- visualiza os veículos organizados
- escolhe com facilidade
- entra em contato direto via WhatsApp

---

## 🚀 Funcionalidades

### 🏠 Página Inicial (Home)
- destaque de veículos
- chamada comercial forte
- botões diretos para WhatsApp
- filtros rápidos (preço, SUV, automático)

---

### 🚗 Estoque
- listagem de veículos em formato de cards
- informações principais:
  - nome
  - preço
  - km
  - ano
  - câmbio
- selos de destaque:
  - 🔥 oportunidade
  - 🟢 baixa km
  - ⚡ vende rápido
- botão de contato direto via WhatsApp

---

### 🔍 Página do Veículo
- galeria de imagens
- informações completas
- diferenciais do carro
- botão com mensagem automática para WhatsApp

---

### 📊 Insights (Diferencial)
- cliques no WhatsApp
- visualizações de veículos
- métricas simples de desempenho
- identificação dos carros mais procurados

---

### ⚙️ Painel Administrativo
- cadastro de veículos
- edição
- exclusão
- estrutura preparada para evolução

---

## 💡 Diferencial do Projeto

Este sistema não é apenas um site.

👉 É uma ferramenta para:
- gerar leads
- organizar atendimento
- aumentar conversão de vendas

---

## 🛠️ Tecnologias

- React / Vite
- TypeScript
- Tailwind CSS
- Estrutura modular

---

## Variaveis de ambiente

### Frontend
Use esta estrategia:

- `.env.example`: referencia do projeto
- `.env.local`: desenvolvimento local
- `.env.production`: build/apresentacao

Exemplo:

- `.env.example` -> `VITE_API_URL=https://api.seudominio.com`
- `.env.local` -> `VITE_API_URL=http://localhost:3000`
- `.env.production` -> `VITE_API_URL=https://api.seudominio.com`

Resumo:

- sem backend real, a vitrine usa fallback local
- com backend/admin real, configure `VITE_API_URL` com a URL publica da API

### Backend
Copie `backend/.env.example` para `backend/.env` e ajuste:

- `PORT`
- `MONGO_URI`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `JWT_EXPIRES_IN_HOURS`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `FRONTEND_URL`

Fluxo recomendado:

- `Mongo Atlas` -> entra em `MONGO_URI` no backend
- `Backend online` -> conecta no Atlas e expoe a API
- `Frontend` -> usa apenas `VITE_API_URL` para falar com a API

---

## 📱 Foco

- Mobile-first
- Performance
- Conversão (WhatsApp)
- Experiência simples para o usuário

---

## 🔮 Próximos Passos

- integração com APIs de veículos
- geração de contratos automatizados
- painel completo de métricas
- transformação em SaaS (multiempresas)

---

## 📌 Status

🚧 Em desenvolvimento — versão inicial focada em validação com cliente real.

---

## 🤝 Contato
22 99283074900
Projeto desenvolvido com foco em soluções comerciais para negócios locais.
