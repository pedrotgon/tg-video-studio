# Componentes TG: fontes e adaptações

Consulta ao catálogo 21st.dev via Context7. O endpoint de instalação do 21st.dev retornou HTTP 403; o código do autor foi consultado diretamente, sem executar instaladores remotos.

- Etapas: Ruixen UI WizardStepper, https://github.com/ruixenui/ruixen.com/blob/main/registry/ruixenui/wizard-stepper.tsx. Adaptação TG: botões nativos, navegação controlada, etapas bloqueadas por estado real e sem dependência de animação. Referência de stepper do catálogo: https://21st.dev/community/components/reui/stepper/states.
- Seleção em cards: referência https://21st.dev/community/components/ruixenui/radio-group-card/default, consultada via Context7. A implementação existente ainda precisa de revisão de acessibilidade e origem.
- Expansão da copy: referência https://21st.dev/community/components/shadcn/accordion/with-inputs. O details nativo existente ainda não foi substituído por componente desse catálogo.

Não é uma declaração de migração completa: apenas o componente de etapas foi adaptado nesta rodada.

## Licença do componente adaptado

MIT License

Copyright (c) 2025 Ruixen UI

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
