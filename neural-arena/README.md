# Neural Arena

Aplicativo web instalável (PWA) + HUD Android flutuante para um laboratório local de redes neurais evolutivas.

## O que funciona nesta versão

- Simulação evolutiva de 10.000 agentes por geração, em um Worker separado da interface.
- Rede feed-forward 6 → 8 → 3, seleção dos melhores 12%, preservação de elite e mutação dos pesos.
- Novo ciclo automático após a população morrer ou atingir o limite de distância.
- Histórico de fitness e persistência local do melhor genoma no navegador.
- Arena Canvas que representa o enxame de agentes simultâneos sem criar 10.000 elementos HTML.
- Biblioteca de pesquisa pré-programada, perfis de Minecraft e exportação de planos JSON.
- PWA com cache offline após a primeira visita.
- App Android com permissão de sobreposição e WebView flutuante para abrir o HUD sobre outros aplicativos.

## Limites conhecidos

O treinador ativo desta versão executa o Dino Runner simulado que acompanha o projeto. Minecraft recebe captura manual, análise local simples de dimensões e cor média, consulta da biblioteca e exportação de planos. Não há leitura dos dados internos do Minecraft, controle automático do personagem ou modificação de arquivos do jogo nesta versão. Jogos online, incluindo Roblox, não são suportados.

A simulação de 10.000 agentes é computacionalmente real dentro do ambiente artificial integrado; ela não equivale a 10.000 instâncias completas do Minecraft. Para ligar uma rede a uma versão real do Minecraft será necessário desenvolver um adaptador autorizado para essa versão e definir observações e ações suportadas.

## Site na Vercel

Configure a raiz do projeto Vercel como `neural-arena/site`. Não há etapa de build nem dependências de pacote; é um site estático.

## Android

O projeto Android está em `neural-arena/android`. O serviço de HUD usa `TYPE_APPLICATION_OVERLAY`, então o usuário precisa conceder manualmente a permissão de sobreposição nas configurações Android. O WebView abre a versão web publicada em `SITE_URL`.

O workflow `.github/workflows/neural-arena-apk.yml` compila o APK debug e publica o arquivo como artefato do GitHub Actions. Ele não assina uma versão de distribuição.

## Privacidade

A simulação, os pesos, o histórico e a biblioteca de estratégias rodam localmente no aparelho. A imagem selecionada é lida no navegador para obter dimensões e cor média; ela não é enviada a um servidor. A aplicação não solicita credenciais nem injeta código em processos de jogos.
