# 09 · Teste de carga

Pergunta: na abertura do evento, com cerca de 700 pessoas entrando no mesmo minuto pelo Wi-Fi do campus, o app aguenta?
E os limites de tentativas e a fila do SUAP estão bons?

## Como roda

```sh
scripts/carga/rodar-local.sh --pessoas 700 --chegada 60 --json resultado.json
SUAP_ATRASO=1.5 ETAL_SUAP_SIMULTANEOS=16 scripts/carga/rodar-local.sh --pessoas 700 --chegada 30
```

Tudo na própria máquina, montado como em produção: PostgreSQL 16 no Docker, a API com um processo só e um SUAP de
mentira (`scripts/carga/suap_falso.py`) que responde ao login com senha com um atraso parecido com o real (0,8 s por
chamada, variando de 50% a 150%; cada login faz duas chamadas). Nenhuma senha real, nenhuma chamada ao SUAP de verdade.
O teste também roda contra uma API de teste já no ar (`carga.py --api URL`), desde que ela aceite a entrada de teste
(`ETAL_LOGIN_DEV=1`), que produção não tem.

Cada pessoa simulada faz o que o app faz na abertura: abre o app (programação e avisos), entra pelo SUAP com senha (5%
erram a senha antes) e tenta de novo quando a fila está cheia, como o app; abre o perfil; fica ouvindo o ao vivo;
credencia; salva 3 atividades; registra presença numa atividade; abre as publicações (10% publicam); depois de 5 a 20 s,
confere as publicações de novo. No fim, a organização manda um aviso e o teste mede quantos celulares receberam.

Todas as pessoas saem pelo mesmo endereço de rede (`--ips 1`), o pior caso para os tetos por rede: é o que acontece se
o Wi-Fi do campus chega ao servidor por um IP só.

## Resultados (15/11/2026)

Máquina do teste: computador de mesa com 8 núcleos e 16 GB, rodando ao mesmo tempo a API, o banco, o SUAP de mentira e
as 700 pessoas simuladas (os tempos do servidor de verdade tendem a ser melhores).

| Rodada | Entraram | Tempo até entrar (mediana · 95% · pior) |
|---|---|---|
| Fila de 8, teto de 120 logins por minuto por rede | **202 de 700** (498 barradas pelo teto da rede) | 13 s · 55 s · 66 s |
| Fila de 8, teto da rede contando só senha errada | 700 de 700 | 30 s · 100 s · 125 s |
| **Fila de 16**, teto só de senha errada | 700 de 700 | **8 s · 18 s · 33 s** |
| Fila de 16, SUAP lento (1,5 s por chamada), todos em 30 s | 700 de 700 | 47 s · 112 s · 126 s |

Na rodada com fila de 16 (a configuração que ficou):

| Passo | Pedidos | 95% em até | Situações |
|---|---|---|---|
| Programação e avisos | 1.400 | 225 ms | todas 200 |
| Perfil | 700 | 245 ms | todas 200 |
| Credenciamento e presença na atividade | 1.400 | 404 ms | todas 200 |
| Salvar na agenda | 2.100 | 288 ms | 904 recusadas por atividade lotada (as vagas de exemplo acabam) |
| Publicações (abrir, publicar, conferir de novo) | 1.474 | 478 ms | todas 200 |
| Ao vivo | 700 conexões abertas | aviso chegou aos 700 em 0,1 s | |

Memória do processo da API no pico: 230 MB. O banco respondeu em menos de 2 ms o tempo todo.

## O que mudou por causa do teste

- **O teto por rede barrava o campus.** Com 120 logins por minuto por endereço, 498 pessoas não entravam. Agora, na
  senha do SUAP, o teto da rede conta só senha errada (`ETAL_TETO_REDE_SENHA_ERRADA`, 60 por minuto), que é o que uma
  tentativa de adivinhar senhas gera; o limite por matrícula também conta só as erradas (6 por minuto), e esperar na
  fila não gasta tentativa. As outras rotas ganharam um teto geral alto (`ETAL_TETO_REDE`, 3.000 por minuto).
- **Fila do SUAP de 8 para 16** (`ETAL_SUAP_SIMULTANEOS`). Com 8, o SUAP só atende umas 5 entradas por segundo e a
  última pessoa esperou 2 minutos; com 16, 33 s. Dezesseis conversas ao mesmo tempo continuam sendo pouco para o SUAP.
- **O app insiste por até 4 minutos** com a fila cheia (antes eram 8 tentativas, uns 2 minutos, no limite do pior caso).
- A fila cheia (503) deixou de contar como erro do servidor nos números do painel.

## O que o teste não cobre

- O SUAP de verdade: a velocidade dele na abertura é desconhecida. Se ele for bem mais lento que 1,5 s por chamada, a
  espera cresce na mesma proporção. Dá para medir antes do evento com poucas contas reais de teste.
- A entrada pelo botão do SUAP (OAuth2): passa pela mesma fila, mas o SUAP mostra a própria tela de login.
- A rede do campus (Wi-Fi, roteador, saída para a internet) e o servidor do NADIC: repetir o teste lá, com
  `carga.py --api`, numa instalação de teste.
- Fotos nas publicações e downloads de materiais em massa.
