# Política de segurança

## Prévia web

O código do usuário é renderizado em um `iframe` com `sandbox="allow-scripts"`, sem `allow-same-origin`. A comunicação com o console usa mensagens verificadas pela janela do iframe atual. A Content Security Policy da prévia restringe conexões externas, formulários, objetos e recursos externos.

## Limites

- A prévia não é uma sandbox de sistema operacional.
- Não execute binários, instaladores ou scripts de shell.
- Esta versão não fornece execução remota de código.
- O armazenamento do workspace é local ao navegador e pode ser apagado.

## Execução remota futura

Antes de executar código de terceiros, implemente workers ou microVMs efêmeros, usuário sem privilégios, filesystem temporário, rede bloqueada por padrão, limites de CPU/memória/tempo, ausência de segredos, logs com redação e destruição do worker após o resultado.

Reporte vulnerabilidades sem publicar detalhes exploráveis em issues públicas.
