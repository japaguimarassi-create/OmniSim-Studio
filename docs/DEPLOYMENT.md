# Compilação e publicação

## Compilação oficial

GitHub Actions é o ambiente oficial de compilação e validação. Em pushes, pull requests e execução manual, o workflow:

1. Faz checkout do código.
2. Configura Node.js 22.
3. Resolve dependências e cria o lockfile quando ainda não existe.
4. Executa `npm ci`.
5. Verifica dependências vulneráveis.
6. Executa a validação TypeScript.
7. Gera o build de produção.
8. Publica `dist/` como artefato da execução.

## GitHub Pages (opcional)

A aplicação é estática e pode ser publicada no GitHub Pages. Antes de configurar deploy, habilite **Settings → Pages → Build and deployment → Source → GitHub Actions**. A compilação de CI atual não publica o site automaticamente.

## Limites

GitHub Actions executa jobs por evento; não é servidor persistente. A aplicação atual funciona no navegador e salva o workspace no dispositivo. A prévia suporta HTML, CSS e JavaScript básico. Outras linguagens necessitam de motores próprios. APK é etapa futura.
