# Meu Treino Full Body 2

Projeto Android gratuito, offline e sem login.

## Recursos

- Treinos A–E, de segunda a sexta, com esteira ou caminhada em cada sessão.
- Fotos e ilustrações de execução incluídas no APK para acesso offline.
- Registro de séries marcadas, repetições e cargas.
- Cronômetros de execução e descanso em cada exercício, com duração ajustável e sinais sonoros distintos. Cardio com registro de duração e distância manual.
- Diário de dor, cansaço, formigamento e anotações.
- Histórico por exercício com gráfico de carga e séries/repetições registradas. Aviso ao fim das oito semanas e início de novo ciclo com confirmação, preservando os anteriores.

## Gerar APK sem pagar

Envie todos os arquivos deste projeto à raiz do repositório GitHub `MeuTreinoFullBody2`, preservando as pastas `.github` e `app`. Cada `push` na branch `main` inicia o workflow **Compilar APK Android**. Na aba **Actions**, abra a execução concluída, baixe o artefato **MeuTreinoFullBody2-APK**, extraia o ZIP e instale `app-debug.apk`.

### Imagens

Antes de compilar localmente, execute `python3 scripts/fetch_exercise_images.py` uma vez. O GitHub Actions já inclui essa etapa. O aplicativo exibe as imagens sem conexão.

- [Free Exercise DB](https://github.com/yuhonas/free-exercise-db), [Unlicense](https://github.com/yuhonas/free-exercise-db/blob/main/LICENSE.md).

### Projeto

- Gradle 8.10.2; Android Gradle Plugin 8.7.3; Java 17; SDK 35.
- Aplicativo Android com tela offline WebView usando origem HTTPS virtual interna.
- Identificador: `br.com.meutreinofullbody2.app`.

**Aviso:** os dados ficam no armazenamento local do aplicativo; a desinstalação pode apagá-los. O conteúdo não substitui acompanhamento de educador físico ou profissionais de saúde.
