# Preparação para APK Android — sem gerar APK

## Estado atual

O projeto está preparado apenas no nível de configuração. O arquivo `capacitor.config.ts` contém o identificador do aplicativo, o nome e o diretório web.

- As dependências do Capacitor ainda não fazem parte do `package.json`.
- A pasta `android/` ainda não foi criada.
- Nenhum APK foi compilado ou assinado.

## Quando iniciar a etapa Android

Em uma alteração dedicada, instalar versões compatíveis de `@capacitor/core`, `@capacitor/cli` e `@capacitor/android`, adicionar scripts de preparação e sincronização, executar o build web e só então criar a plataforma Android.

Depois disso, abrir o projeto no Android Studio e revisar WebView, teclado, safe areas, armazenamento, permissões mínimas e política de privacidade. Testar o APK em dispositivos reais antes de distribuir.

A presença de `capacitor.config.ts` não significa que o projeto nativo já exista.
