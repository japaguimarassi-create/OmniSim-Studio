# OmniSim Studio

Editor mobile-first para criar e experimentar projetos web diretamente no navegador.

## Stack

- React 18 e TypeScript
- Vite 6
- CodeMirror 6
- JSZip
- vite-plugin-pwa
- GitHub Actions para validação e build

## Funcionalidades da versão 0.1.0

- Editor com destaque de sintaxe para HTML, CSS, JavaScript e TypeScript.
- Explorador com seleção, criação e remoção de arquivos.
- Salvamento automático do workspace no armazenamento local do navegador.
- Prévia em iframe com sandbox e Content Security Policy restritiva.
- Modelos iniciais de website e jogo 2D em Canvas.
- Importação e exportação de projetos de código em ZIP.
- Interface adaptada para desktop e celular.
- Manifest e service worker para instalação PWA e cache da interface.

## Limites atuais

O OmniSim Studio ainda não é um compilador universal nem uma IDE com execução remota.

- A prévia executa HTML, CSS e JavaScript no navegador.
- Python, C, C++, Rust, Java e outras linguagens ainda não têm runtime de execução integrado.
- A importação ZIP atual aceita arquivos textuais de projeto; assets binários ainda não são importados.
- Não há terminal remoto, backend de compilação, sincronização Git, colaboração em tempo real ou login GitHub dentro do aplicativo.
- O workspace é salvo localmente no navegador; use exportação ZIP para cópias externas.
- A prévia é um isolamento de navegador, não uma sandbox de sistema operacional.
- O APK Android ainda não foi gerado.

Recursos futuros só serão anunciados como disponíveis depois de implementados e testados.

## Requisitos

- Node.js 22 ou superior
- npm incluído na instalação do Node.js

## Desenvolvimento local

```bash
npm install
npm run dev
```

Validação e build:

```bash
npm run check
```

O resultado de produção é gerado em `dist/`.

## GitHub Actions

O workflow `.github/workflows/ci.yml` executa em pushes, pull requests e manualmente. Ele instala dependências, gera o lockfile inicial quando ausente, executa `npm ci`, a auditoria de dependências, a validação TypeScript e o build de produção. O diretório `dist/` é disponibilizado como artefato da execução.

O workflow não mantém um servidor online. Para publicação estática, GitHub Pages pode ser habilitado em **Settings → Pages → Build and deployment → Source → GitHub Actions**, seguido de um workflow próprio de deploy.

## Estrutura

```text
.github/workflows/ci.yml
docs/
public/
src/
  App.tsx
  main.tsx
  styles.css
  vite-env.d.ts
index.html
package.json
tsconfig.json
vite.config.ts
```

## PWA e Android

O PWA está configurado no Vite. O arquivo `capacitor.config.ts` registra apenas a configuração inicial para uma possível etapa Android futura. As dependências e a plataforma Android ainda não foram adicionadas; nenhum APK foi compilado. Consulte [docs/APK_PREPARATION.md](docs/APK_PREPARATION.md).

## Segurança

Consulte [SECURITY.md](SECURITY.md) antes de usar a prévia com código desconhecido.

## Licença

MIT. Consulte [LICENSE](LICENSE).
