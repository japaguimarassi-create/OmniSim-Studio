# OmniSim Studio

**OmniSim Studio** é um ambiente de criação mobile-first para editar código, construir sites e experimentar jogos 2D diretamente no navegador.

- Versão: `0.1.0`
- Interface: português (Brasil)
- Stack: React 18, TypeScript, Vite, CodeMirror 6 e JSZip
- Distribuição: aplicação web estática e PWA
- Automação: GitHub Actions

## Recursos disponíveis

- Editor CodeMirror com destaque de sintaxe para HTML, CSS, JavaScript, TypeScript, JSON, Python, C/C++, Java, Go, Rust, SQL, Markdown, XML e YAML.
- Explorer de arquivos com criação e remoção de arquivos.
- Salvamento automático do workspace no armazenamento local do navegador.
- Prévia HTML/CSS/JavaScript dentro de `iframe` com sandbox e política de conteúdo restritiva.
- Console da prévia com logs, avisos, erros e exceções.
- Modelos iniciais de websites e jogos 2D em Canvas.
- Visualização de assets e importação de arquivos.
- Importação e exportação de workspaces em ZIP, preservando diretórios e assets.
- Layout adaptado para telas móveis e desktops.
- Manifest PWA e service worker para cache da interface.
- Configuração inicial do Capacitor para uma futura plataforma Android.

## Limites explícitos da versão atual

O OmniSim Studio **não é ainda um compilador universal nem uma IDE com execução remota**. Nesta versão:

- A prévia executa HTML, CSS e JavaScript no navegador, isolada em um `iframe`.
- Reconhecer a extensão de Python, C, C++, Rust, Java ou outra linguagem não significa que exista um runtime para executá-la.
- Projetos com `npm`, imports de módulos externos e pipelines complexos ainda não são empacotados pelo editor.
- Não existe execução de binários, terminal remoto, autenticação GitHub dentro da interface, sincronização Git ou colaboração em tempo real.
- O workspace é salvo localmente no navegador. Exporte ZIPs para manter cópias externas.
- O APK Android ainda não foi gerado; o Capacitor está apenas preparado.

Essas capacidades serão adicionadas por etapas e somente serão anunciadas como disponíveis depois de implementadas e testadas.

## Requisitos

- Node.js 22 ou superior.
- npm 10 ou superior recomendado.

A versão Node usada pelo projeto está indicada em `.nvmrc` e no campo `engines` do `package.json`.

## Desenvolvimento

```bash
npm install
npm run dev
```

Verificação e build:

```bash
npm run typecheck
npm run build
```

O build final fica em `dist/`.

## GitHub Actions

O workflow `.github/workflows/ci.yml` executa em pushes, pull requests e execução manual. Ele resolve as dependências, gera e versiona o `package-lock.json` quando ainda não existe, executa uma instalação limpa, verifica o TypeScript e gera o build de produção. O diretório `dist/` é publicado como artefato da execução.

O GitHub Actions é usado como ambiente de compilação e validação. Ele não mantém um servidor online 24 horas por dia. Para publicar a interface, é necessário configurar um host estático; GitHub Pages é uma opção e deve ser habilitado em **Settings → Pages → Build and deployment → Source → GitHub Actions** antes de ativar um workflow de deploy.

## PWA e Android

A aplicação inclui `public/manifest.webmanifest`, ícone SVG, configuração do `vite-plugin-pwa` e `capacitor.config.ts`. Nenhuma plataforma Android foi gerada. Consulte [`docs/APK_PREPARATION.md`](docs/APK_PREPARATION.md) antes de iniciar essa etapa.

## Segurança

O preview executa código do projeto dentro de `iframe sandbox="allow-scripts"`, sem `allow-same-origin`. A CSP do documento bloqueia conexões externas, formulários, objetos e scripts externos. Isso isola a prévia web do contexto principal, mas não substitui uma sandbox de sistema operacional. Não execute binários ou código desconhecido fora de ambientes descartáveis. Consulte [`SECURITY.md`](SECURITY.md).

## Estrutura

```text
.github/workflows/ci.yml
src/
  components/CodeEditor.tsx
  lib/templates.ts
  App.tsx
  main.tsx
  styles.css
  vite-env.d.ts
public/
docs/
capacitor.config.ts
index.html
package.json
vite.config.ts
```

## Licença

MIT. Consulte [`LICENSE`](LICENSE).
