# Análise Técnica do Sistema TEXTOVOX

## 1. Visão Geral
O sistema TEXTOVOX utiliza a API de Text-to-Speech (TTS) da OpenAI para gerar áudio a partir de texto. A arquitetura atual é robusta e utiliza modelos de alta definição (`tts-1-hd`) para garantir a clareza do áudio.

## 2. Diagnóstico de Vozes e Identidade
Realizamos uma reestruturação completa no mapeamento de vozes para garantir que cada personagem tenha uma identidade sonora única, utilizando os modelos nativos da OpenAI sem distorções artificiais de pitch (que causam artefatos robóticos).

### Mapeamento Atualizado (Versão Comercial):
| Personagem | Perfil | Modelo OpenAI | Justificativa |
| :--- | :--- | :--- | :--- |
| **PEDRO** | Homem Adulto (Padrão) | **Echo** | Voz masculina equilibrada e versátil. |
| **ELOY** | Homem Maduro/Profundo | **Onyx** | Voz mais grave e autoritária. |
| **RICK** | Jovem/Criança | **Fable** | A voz masculina mais aguda disponível. *Nota: A OpenAI não possui vozes infantis nativas.* |
| **PATY** | Mulher (Neutra) | **Alloy** | Voz feminina padrão, clara e profissional. |
| **LIA** | Mulher (Energética) | **Nova** | Voz feminina dinâmica, ideal para narrações vivas. |
| **EVELIN** | Mulher (Suave) | **Shimmer** | Voz feminina calma e aveludada. |

## 3. Análise de Nuances Emocionais (TAGs)
O usuário solicitou o uso de TAGs (ex: `[sussurro]`, `[risos]`) para controle emocional.

### Limitação Técnica Atual
O modelo padrão da OpenAI (`tts-1` e `tts-1-hd`) **não suporta nativamente** tags de emoção ou SSML. Ele lê o texto de forma linear.

### Soluções Tentadas (e Descartadas)
1. **Injeção de Prompt (GPT-4o Audio):** Tentamos usar o modelo `gpt-4o-audio-preview` para "atuar" as emoções.
   - *Problema:* O modelo é instável, caro e muitas vezes ignora instruções em português ou alucina o texto.
2. **Manipulação de Velocidade:** O sistema atual possui uma lógica simples que altera a velocidade quando encontra tags (ex: sussurro = mais lento).
   - *Veredito:* Funcional, mas limitado. Não altera o timbre ou a "atuação" real.

### Recomendação Comercial (Roadmap)
Para um produto comercial que exige **atuação real** (choro, riso, sussurro real) e **vozes infantis genuínas**, a tecnologia da OpenAI não é suficiente no momento.

**Recomendação:** Integração com **ElevenLabs**.
- **Vozes Infantis:** A ElevenLabs possui modelos treinados especificamente para vozes de crianças.
- **Controle Emocional:** Permite ajustes de estabilidade e similaridade que, combinados com a funcionalidade "Speech-to-Speech", permitem "atuar" o áudio de entrada.
- **Custo:** É mais caro que a OpenAI, mas é o padrão da indústria para audiolivros e dublagem com emoção.

## 4. Conclusão e Próximos Passos
O sistema foi atualizado para a melhor configuração possível dentro do ecossistema OpenAI (`tts-1-hd` + Mapeamento Distinto). Para avançar para o próximo nível de realismo emocional, recomenda-se planejar a migração ou adição da API da ElevenLabs.
