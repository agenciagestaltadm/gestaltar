# GUESTALT AR

Experiência de Realidade Aumentada WebAR onde vídeos "vivos" são ancorados em fotos/quadros físicos.

## 🚀 Setup Rápido

### 1. Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)
- Conta na [Vercel](https://vercel.com) (para deploy)

### 2. Configurar Supabase

1. Crie um novo projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor** e execute o conteúdo de `supabase/migrations/001_initial.sql`
3. Crie um bucket de storage chamado `videos` (privado)
4. Configure as políticas de storage (veja abaixo)

### 3. Configurar Variáveis de Ambiente

```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais do Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_SITE_URL=https://seu-dominio.com
```

### 4. Instalar Dependências

```bash
npm install
```

### 5. Rodar Localmente

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📁 Estrutura do Projeto

```
guestaltar/
├── src/
│   ├── app/                    # Páginas (App Router)
│   │   ├── page.tsx           # Home
│   │   ├── upload/            # Upload de vídeo
│   │   ├── success/           # Sucesso pós-upload
│   │   ├── ar/                # Leitor AR
│   │   └── api/               # API Routes
│   ├── components/            # Componentes React
│   │   ├── ui/               # Componentes base
│   │   ├── home/             # Componentes da Home
│   │   ├── upload/           # Componentes de Upload
│   │   └── ar/               # Componentes AR
│   ├── lib/                   # Utilitários
│   │   └── supabase/         # Cliente Supabase
│   └── types/                 # Tipos TypeScript
├── public/                    # Arquivos estáticos
│   ├── logo.svg              # Logo GUESTALT AR
│   ├── targets.mind          # Arquivo de tracking AR
│   └── demo-video.mp4        # Vídeo demo (opcional)
├── supabase/
│   └── migrations/           # SQL migrations
└── plans/                     # Documentação
```

## 🎯 Configurar o AR

### Criar o targets.mind

O arquivo `targets.mind` é essencial para o tracking AR. Você precisa:

1. **Escolher uma imagem-alvo** com:
   - Alto contraste
   - Muitos detalhes/bordas
   - Resolução mínima de 1000x1000px
   - Sem reflexos

2. **Gerar o arquivo** usando o [MindAR Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile/)

3. **Salvar** em `public/targets.mind`

### Adicionar Vídeo Demo (opcional)

Coloque um vídeo de demonstração em `public/demo-video.mp4`

## 🗄️ Políticas do Supabase Storage

Execute no SQL Editor:

```sql
-- Permitir upload
CREATE POLICY "Anyone can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos');

-- Bloquear download direto (apenas signed URLs)
CREATE POLICY "No public download" ON storage.objects
  FOR SELECT USING (FALSE);
```

## 🚢 Deploy na Vercel

1. Conecte seu repositório GitHub à Vercel
2. Configure as variáveis de ambiente
3. Deploy automático a cada push

```bash
# Ou use o CLI da Vercel
npm i -g vercel
vercel
```

## 📱 Testando o AR

1. Acesse `/ar` ou `/ar?vid=<id-do-video>`
2. Permita o acesso à câmera
3. Aponte para o quadro/imagem-alvo
4. O vídeo aparecerá ancorado na imagem

### iOS Safari

- O autoplay pode ser bloqueado
- Um botão "Toque para iniciar" aparecerá
- O vídeo precisa estar `muted` para autoplay

## 🔧 Troubleshooting

### Câmera não abre
- Verifique se está usando HTTPS
- Verifique permissões do navegador
- Teste em outro navegador

### Tracking não funciona
- Verifique se `targets.mind` existe
- Teste com melhor iluminação
- Verifique qualidade da imagem-alvo impressa

### Upload falha
- Verifique as credenciais do Supabase
- Verifique se o bucket `videos` existe
- Verifique as políticas de storage

## 📄 Licença

Privado - Gestalt Comunicação

---

Desenvolvido com ❤️ para GUESTALT AR
