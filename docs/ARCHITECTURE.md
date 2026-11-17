# Arquitetura do OmniSim Studio

## Princípios

1. Interface e execução dos projetos são camadas distintas.
2. O navegador executa apenas prévias compatíveis com o runtime web.
3. O contexto da aplicação não é compartilhado com o código da prévia.
4. Cada motor futuro deve declarar capacidades, limites, entradas, saídas e testes.
5. O uso móvel e offline é requisito de primeira classe.

## Camadas atuais

- React Workspace: explorer, CodeMirror, painéis e ferramentas.
- Local Project Store: persistência no armazenamento do navegador.
- ZIP Import/Export: empacotamento de arquivos e assets.
- Preview Controller: iframe isolado, HTML, CSS, JavaScript e ponte do console.
- Build and Validation: GitHub Actions, instalação de dependências, TypeScript e Vite.

## Motores futuros

Cada motor deverá declarar linguagens, padrões de arquivo, capacidades de reconhecimento/análise/compilação/execução/depuração, entradas e saídas, runtime, dependências, limites de recursos, política de rede e testes. Motores incompletos não serão apresentados como disponíveis.
