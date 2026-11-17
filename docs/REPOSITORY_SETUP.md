# Organização do repositório

Repositório oficial: `japaguimarassi-create/OmniSim-Studio`.

## Branches

- `main`: versão integrada e validada.
- `development`: linha principal de desenvolvimento.
- Branches curtas podem ser criadas para funcionalidades ou correções específicas.

## Regras

1. Não versionar `node_modules/`, `dist/`, credenciais ou arquivos `.env` reais.
2. Alterações em dependências devem atualizar `package.json` e `package-lock.json`.
3. Toda alteração deve passar por typecheck e build.
4. Mudanças no isolamento da prévia devem atualizar `SECURITY.md` e incluir validação específica.
5. Não declarar runtimes, compiladores ou recursos que ainda não foram implementados e testados.

## Automação

O workflow `.github/workflows/ci.yml` executa validação em pushes, pull requests e manualmente. O build fica disponível como artefato por sete dias.
