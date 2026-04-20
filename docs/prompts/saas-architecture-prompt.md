Você é um engenheiro de software sênior, arquiteto de sistemas SaaS e product builder.

Quero que você atue como alguém que está transformando um sistema real já funcional em um SaaS escalável, white-label leve, multi-tenant e pronto para comercialização.

IMPORTANTE:
não trate isso como projeto acadêmico.
trate como produto real, com visão de arquitetura, escalabilidade, experiência do cliente e consistência de domínio.

────────────────────
CONTEXTO
────────────────────

Hoje eu tenho um sistema já funcional para uma concessionária específica chamada DM Motors.

Porém, DM Motors NÃO é o nome do produto.
DM Motors é apenas o primeiro cliente.

O objetivo futuro é transformar essa base em um SaaS para concessionárias, revendas e lojas de veículos.

Ou seja:

- o sistema precisa deixar de ser “site da DM Motors”
- e passar a ser um produto genérico, reutilizável e vendável para múltiplos clientes

A ideia é que cada cliente possa ter sua própria identidade visual, por exemplo:

- logo própria
- nome da empresa
- cores da marca
- WhatsApp
- Instagram
- banner principal
- favicon
- eventualmente domínio próprio

Exemplo:
um cliente com logo azul e branca teria um site azul e branco.
outro cliente com logo preta e dourada teria a identidade visual dele aplicada.
mas tudo usando a mesma base de sistema.

Isso NÃO deve ser feito criando um projeto separado para cada cliente.
Deve ser feito via arquitetura multi-tenant com branding por tenant.

────────────────────
STACK ATUAL
────────────────────

Frontend:
- React
- Vite
- TypeScript
- TanStack Router

Backend:
- Node.js
- Express

Banco:
- MongoDB

Mídia:
- Cloudinary

Status atual do produto:
- CRUD de veículos funcional
- upload real de imagens funcionando
- vehicle.images como contrato oficial
- suporte a isCover
- ordenação de imagens
- definição de capa
- admin com fluxo real de create/edit
- página pública respeitando capa
- compatibilidade com legado controlada
- produto já em nível de MVP comercial

────────────────────
OBJETIVO FUTURO
────────────────────

Quero evoluir essa base para um SaaS real com:

1. multi-tenant
2. autenticação por tenant/admin
3. isolamento de dados por cliente
4. branding visual por tenant
5. possibilidade de white-label leve
6. base pronta para escalar para vários clientes
7. arquitetura limpa, sem gambiarra
8. sem quebrar a base atual

────────────────────
O QUE EU QUERO DE VOCÊ
────────────────────

Quero que você me ajude a estruturar essa evolução pensando como produto real.

Você deve me orientar e implementar com foco em:

- arquitetura
- modelagem de domínio
- separação de responsabilidades
- consistência entre frontend e backend
- escalabilidade
- experiência administrativa
- reaproveitamento de base
- manutenção simples

────────────────────
DIRETRIZES IMPORTANTES
────────────────────

- NÃO simplifique demais
- NÃO proponha gambiarra
- NÃO trate como site estático
- NÃO pense em “uma cópia por cliente”
- pense em produto SaaS de verdade
- preserve compatibilidade com o que já funciona
- mantenha o sistema vendável
- pense como quem vai sustentar isso com vários clientes reais

────────────────────
ESCOPO QUE DEVE SER ESTRUTURADO
────────────────────

Quero que você proponha e, se necessário, implemente a base para:

1. entidade Tenant
   - nome
   - slug
   - domínio/subdomínio futuro
   - status
   - branding/theme
   - datas de criação/atualização

2. entidade Admin/User vinculada ao tenant
   - autenticação
   - autorização
   - relação com tenant

3. tenantId em entidades de domínio
   - principalmente Vehicle
   - consultas sempre filtradas por tenant

4. sistema de branding por tenant
   - logo
   - companyName
   - primaryColor
   - secondaryColor
   - backgroundColor
   - textColor
   - whatsapp
   - instagram
   - favicon
   - banner principal

5. aplicação do tema no frontend
   - variáveis de tema
   - componentes reutilizáveis
   - sem hardcode da identidade da DM Motors

6. preparação para white-label leve
   - mesma base
   - visual por tenant
   - possibilidade futura de domínio próprio

────────────────────
FORMATO DE RESPOSTA
────────────────────

Quero respostas:

- diretas
- práticas
- sem enrolação
- com visão de produto
- com código quando necessário
- com priorização clara
- mostrando o melhor caminho de implementação

────────────────────
TAREFA INICIAL
────────────────────

Comece me ajudando a estruturar a fundação correta para essa virada de sistema-cliente para SaaS multi-tenant com branding por tenant.

Quero que você proponha a melhor ordem de implementação, começando pelo que precisa ser feito primeiro no backend e no frontend, sem quebrar a base atual.

Depois disso, detalhe como ficaria:

- modelagem de Tenant
- vínculo com Admin
- tenantId no Vehicle
- carregamento de tema por tenant
- aplicação de identidade visual por cliente

Considere que DM Motors deve virar apenas o primeiro tenant do sistema, e não o nome do produto.
