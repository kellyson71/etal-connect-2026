# Regras do app (anotações)

Anotando aqui as regras que a gente foi decidindo pro ETAL Connect, pra não se perder. Os números dá pra mudar depois, mas é assim que tá hoje.

## Entrar no app

- Quem é do IFRN entra com o SUAP. Pode ser pelo botão do SUAP (a autorização da API do SUAP já tá liberada pra gente) ou digitando matrícula e senha.
- A senha do SUAP só passa pelo nosso servidor na hora de entrar. A gente não guarda senha em lugar nenhum, nem em log.
- Do SUAP o app só pega o que aparece no crachá: nome, foto, curso, campus e matrícula. Nada de CPF.
- Quem não é do IFRN entra como convidado (visitante): coloca nome, e-mail, perfil, instituição e cidade, aceita o termo, e recebe um link no e-mail. O link vale 30 minutos e só funciona uma vez.
- Depois de entrar, fica logado por 30 dias no aparelho.

## Pra ninguém usar o app pra descobrir senha dos outros

- Cada matrícula pode errar a senha no máximo 6 vezes por minuto. Na 7ª tentativa o app bloqueia aquela matrícula por um minuto. Assim não dá pra ficar chutando senha de alguém pelo nosso app.
- O limite é por matrícula, e não pela internet que a pessoa tá usando. No Wi-Fi do campus todo mundo sai pelo mesmo endereço, e se fosse por endereço o evento inteiro travaria na abertura.
- Mesmo assim tem um teto por rede, bem alto (120 tentativas de login por minuto), só pra segurar abuso.
- Convidado: no máximo 3 links por e-mail a cada 10 minutos. Mais que isso o app diz pra olhar a caixa de entrada e o spam.

## Muita gente entrando ao mesmo tempo

- Na abertura vai todo mundo entrar junto. O app não manda tudo de uma vez pro SUAP: no máximo 8 entradas conversam com o SUAP ao mesmo tempo, o resto espera a vez.
- Ninguém fica 2 minutos olhando uma tela de carregamento. Se a fila encher, a espera é de no máximo uns 12 segundos. Aí o app mostra "Muita gente entrando agora. Tentando de novo em X s…" e tenta sozinho, sem a pessoa fazer nada.
- Se o SUAP cair de vez, o app avisa que o SUAP não respondeu. Aí o plano B é entrar como convidado ou a equipe credenciar na mão.

## Credenciamento e presença

- O credenciamento é lendo o QR da recepção. Sem credenciamento a pessoa vê o app, mas não participa (não posta, não comenta, não denuncia).
- Presença numa atividade é lendo o QR da sala. O QR principal é o de papel na porta.
- O QR é assinado pelo servidor, então não dá pra inventar um QR que funcione.
- O QR de uma atividade só vale de 20 minutos antes até o fim dela.
- Ler de novo não duplica: é uma presença por pessoa por atividade.
- Cada pessoa pode ler no máximo 30 QRs por minuto. Isso é só pra barrar coisa estranha, ninguém lê tanto QR assim.
- Se ler o QR de uma atividade sem estar credenciado, o app credencia junto.
- A equipe pode credenciar na mão pelo painel (pra quem tá sem celular, sem bateria, etc).
- Risco que a gente conhece: alguém tirar foto do QR e mandar pra quem não tá na sala. Por enquanto a defesa é a janela de horário. Dá pra apertar depois (QR no telão que muda, conferir a lotação).

## Leu o QR sem internet

Isso eu fiquei com receio, então ficou assim:

- Se o celular tá sem internet na hora de ler, o app só guarda a leitura se for um QR de verdade do ETAL e de uma atividade que existe na programação. QR errado ou qualquer outro QR não é guardado.
- A leitura guardada NÃO vale ainda. O app mostra "Leitura guardada, ainda não vale" e a presença só conta quando ele conseguir enviar.
- Quando a internet volta, o app envia sozinho e avisa se deu certo ou não.
- Quem decide é o servidor, com as mesmas regras: o QR tem que ser válido, a leitura tem que ter sido feita durante a atividade, e o envio tem que chegar até 60 minutos depois do fim dela.
- A hora que o celular manda só serve pra restringir, nunca pra aumentar o prazo. Então não abre brecha: quem já não conseguiria marcar presença com internet também não consegue sem.
- Se o servidor recusar, a leitura sai da fila e o app avisa o motivo. Não fica tentando pra sempre.
- Presença que veio assim fica marcada como "adiada" no banco, pra organização saber.

## Agenda

- A pessoa salva as atividades que quer ver.
- Se a atividade tem vagas, salvar respeita o limite: acabou a vaga, o app não deixa.
- Pode salvar duas coisas no mesmo horário, mas o app avisa.
- Lembrete 10 minutos antes de cada atividade salva, com a sala e o caminho.

## Materiais das atividades

- Só a organização envia material: PDF, imagem, ZIP, slides (PPT/PPTX) ou texto, até 15 MB. Também dá pra colocar link.
- O participante só abre o material depois de marcar presença na atividade. A organização vê tudo.
- Abre dentro do app, mas tem o botão de baixar pra quem quiser.

## Organização (painel do administrador)

- Só entra no painel quem tá na lista da organização (matrícula ou e-mail). Participante e convidado não veem o painel.
- A organização pode:
  - mandar aviso pra todo mundo (chega na hora);
  - trocar a sala de uma atividade (sai um aviso automático);
  - mudar o número das salas;
  - criar e editar atividade, com materiais;
  - credenciar na mão;
  - nos campeonatos: abrir e fechar inscrição, inscrever ou tirar jogador, marcar o vencedor de cada partida (e desfazer) e editar as regras;
  - moderar as publicações;
  - imprimir os QRs das salas e exportar a lista de presença pros certificados.
- A tela de QRs de teste (debug) só aparece pra organização e só no modo de demonstração. No evento de verdade ela não existe.

## Publicações

- Ver as publicações é pra quem entrou. Postar, curtir, comentar e denunciar é só pra quem já tá credenciado.
- Até 6 fotos por post, com descrição em cada uma. As fotos são reduzidas no próprio celular antes de ir.
- Cada um pode apagar a própria publicação.
- Denúncia vai pra organização, que pode ocultar, restaurar ou arquivar, sempre com anotação e histórico. Post de outra pessoa a organização não apaga de vez: tira do ar pela moderação.
- IMPORTANTE: hoje as publicações ficam só no celular de cada um, não vão pra ninguém. A gente ainda vai fazer o servidor disso e planejar direito antes do evento.

## Perfil e crachá

- Dá pra mudar o nome que aparece e a foto no app, mas isso não muda nada no SUAP.
- O perfil público mostra o crachá sem matrícula e sem e-mail.
- Pra quem entrou com senha do SUAP, o app mostra os eventos e certificados do SUAP da pessoa. Esses dados ficam só 20 minutos no servidor, ligados àquele login, e o certificado só baixa se for da própria pessoa. Se o certificado não existir, o app não inventa um.

## O que é real e o que é exemplo

- Nada aqui é oficial do IFRN, do SUAP ou do ETAL. Presença pelo app não é presença oficial.
- A programação de exemplo segue a do VII ETAL (26 a 28 de novembro de 2025), mais algumas atividades de demonstração. Salas, vagas, campeonatos e números do painel são exemplo.
- O mapa é feito do levantamento e da planta de 2012, conferido no local, mas não é planta oficial. Não tem GPS dentro do prédio.

## O que ainda falta decidir

- Publicações com servidor (o que guarda, por quanto tempo, quem modera).
- LGPD: termo, política de privacidade e por quanto tempo os dados ficam.
- Se o limite de 6 tentativas por matrícula e a fila de 8 no SUAP tão bons, a gente vê no teste de carga.
