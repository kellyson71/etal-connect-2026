"""Atualiza o cenário local do VII ETAL com programação pública e complementos de demonstração.
Sem credenciais. Não importa identidades, inscrições ou presenças oficiais.
"""
import json,re,subprocess,urllib.request
from pathlib import Path
from datetime import datetime,timezone
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[2]
SOURCE='https://suap.ifrn.edu.br/eventos/inscricao/1/8528/'
OLD=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import fs from 'node:fs';import vm from 'node:vm';let c={window:{}};vm.createContext(c);for(let f of ['plan-data.js','data.js'])vm.runInContext(fs.readFileSync('prototipo/'+f,'utf8'),c);process.stdout.write(JSON.stringify(c.window.DATA));"],cwd=ROOT))
html=urllib.request.urlopen(SOURCE,timeout=40).read().decode()
soup=BeautifulSoup(html,'html.parser')
IDS=[6840,6841,6892,6838,6842,6837,6847,6843,6850,6849,6845,6844,6852,6851,6846]
SLUGS=['experiencia-ia','react-native','fastapi','react-next','opencv','game-maker','abertura','coral','impacto-ia','saude-mental','banda-inteira','imagens-ia','mesa-egressos','devsecops','encerramento']
ROOMS=[(1,'salas-sul-0','Sala 111'),(2,'labs-norte-2','Lab 210'),(2,'labs-norte','Lab 209'),(1,'sala-interna-norte-1','Sala 107'),(2,'labs-norte-2','Lab 210'),(2,'lab-sul-1','Lab 213')]
SHORT=['Experiência com IA','React Native com Expo','APIs modernas com FastAPI','React e Next.js','React Native e OpenCV','Jogos com Game Maker','Governança de dados e IA','Coral','Impacto da IA na sociedade','Saúde mental na era da IA','Banda Inteira','IA e imagens','Mercado de trabalho e egressos','IA e DevSecOps','Encerramento e premiação']
EXTRA={
'opencv':('Processe imagens com React Native e OpenCV.',['Ler imagens no aplicativo','Aplicar filtros com OpenCV','Exibir o resultado no celular']),
'game-maker':('Crie uma pequena cena jogável com Game Maker.',['Montar uma cena com sprites','Programar colisões e controles','Testar e compartilhar um protótipo']),
'devsecops':('Conversa sobre transformação digital segura e inteligência artificial em instituições públicas.',[]),
'impacto-ia':('Mesa-redonda sobre os impactos da inteligência artificial na computação e na sociedade.',[]),
'mesa-egressos':('Mesa com egressos: experiências de carreira, formação e mercado de trabalho.',[])}
sessions=[];source=[]
cards=soup.select('#programacao .box-item')
assert len(cards)==15,'Programação pública mudou; conferir antes de substituir o cenário.'
old={x['id']:x for x in OLD['sessions']}
for i,card in enumerate(cards):
 slug=SLUGS[i];heading=card.find('h5').get_text(' ',strip=True);raw=next(x.get_text(' ',strip=True) for x in card.find_all('p',recursive=False) if not x.get('class'))
 title=re.sub(r'\s*\([^()]+ de [\d:]+h\)\s*$','',raw)
 day=int(card.find_parent(class_='primary-info').find('h4').get_text(' ',strip=True)[:2]);times=re.findall(r'\d{2}:\d{2}',heading)
 assert len(times)==2,(slug,heading)
 original_type=heading.split(' das ')[0]
 kind={'Mesa Redonda':'Mesa-redonda','Abertura Oficial':'Abertura','Apresentação Cultural':'Apresentação','Vivência':'Encerramento'}.get(original_type,original_type)
 split=title.split(' - ',1);name=split[0];who=split[1] if len(split)>1 else ('Egressos convidados' if kind=='Mesa-redonda' else 'Comunidade do campus')
 base=dict(old.get(slug,{}));base.update(id=slug,type=kind,day=day,time=times[0],end=times[1],title=name,short=SHORT[i],speaker=who,speakerShort=' '.join(who.split()[:2]),initials=''.join(w[0] for w in who.split()[:2]).upper(),role='Instrutor(a)' if kind=='Minicurso' else 'Convidado(a) do VII ETAL',suapId=IDS[i],sourceUrl=SOURCE,sourceType=original_type,demo=False,roomDemo=True,contentDemo=True,materials=[],learn=base.get('learn',[]),requirements='Notebook para acompanhar a prática.' if kind=='Minicurso' else 'Não é preciso levar material.',link=SOURCE)
 if slug in EXTRA:base['description'],base['learn']=EXTRA[slug]
 base.setdefault('description','Atividade da programação do VII ETAL, de 26 a 28 de novembro de 2025.')
 if i<6:
  base['floor'],base['zone'],base['room']=ROOMS[i];base.pop('place',None);base.pop('simple',None)
  base['seats']=[40,30,30,30,40,30][i];base['taken']=[40,26,26,30,40,30][i]
 else:
  base.update(floor=0,zone='auditorio',room='Auditório',seats=200,taken=64)
  if kind in ['Apresentação','Encerramento']:
   base.update(place='patio',room='Pátio',simple=True);base.pop('floor',None);base.pop('zone',None)
  if kind=='Abertura':base['simple']=True
  if kind=='Mesa-redonda':
   guests=who.split(', ')
   if slug=='impacto-ia':guests=['Thiago Henrique Freire de Oliveira','Eliaquim Timóteo da Cunha','Atson Paulo Barreto Santos']
   base['guests']=[{'name':n,'initials':''.join(x[0] for x in n.split()[:2]),'role':'Convidado(a)'} for n in guests]
 sessions.append(base);source.append({'id':IDS[i],'type':original_type,'title':title,'day':day,'time':times[0],'end':times[1]})
# Somente nomes públicos autorizados, em personagens/ações simulados. Sem CPF, e-mail ou inscrição real.
names=['Lucas Emanuel Nogueira de Queiroz','Andrea Gabriely Vidal Feitosa','Maria Vitória de Sousa Pereira','Francisco Leocássio da Silva','Ana Beatriz','Caio Enzo','Júlia Costa','Ravi Lima']
nicks=['Lucas.exe','Andrea','Maria V.','Chico','Ana B.','Caio','Júlia','Ravi']
def players(picks,teams=False):
 return [[f'Equipe {nicks[i]}' if teams else nicks[i],names[i],''.join(w[0] for w in names[i].split()[:2]),picks[i%len(picks)],f'demo-player-{i}'] for i in range(8)]
def tour(id,name,theme,day,time,zone,room,picks,format,rules,completed=False,teams=False):
 return {'id':id,'name':name,'theme':'mk' if theme=='mk11' else theme,'banner':f'assets/games/{theme}.jpg','day':day,'time':time,'place':room+' · 1º andar','floor':1,'zone':zone,'room':room,'format':format,'tagline':'Campeonato do encontro.','rules':rules,'prize':'Premiação do campeonato','demo':True,'players':players(picks,teams) if completed else players(picks,teams)[:6],'pickLabel':'Função' if teams else 'Personagem' if id=='mk' else 'Time' if id=='fifa' else 'Dificuldade','picks':picks+['Ainda não sei'],'times':[time,'14:20','14:40','15:00'],'teamSize':5 if teams else 1,'open':not completed,'res':{'q0':0,'q1':0,'q2':1,'q3':0,'s0':0,'s1':1,'f':0} if completed else {}}
tournaments=[
 tour('mk','Mortal Kombat 11','mk11',27,'14:00','sala-norte-1','Sala 102',['Scorpion','Sub-Zero','Liu Kang','Kitana','Raiden','Jade','Johnny Cage','Sonya'],'1 × 1 · melhor de 3','1. Chave eliminatória de oito jogadores.\n2. Cada duelo é melhor de três lutas; final em melhor de cinco.\n3. Dois rounds por luta, 90 segundos e configurações iguais para todos.\n4. Quem perdeu pode trocar de personagem; quem venceu mantém.\n5. Atraso de 5 minutos resulta em W.O.; pausas e falhas técnicas são decididas pela organização.',True),
 tour('fifa','FIFA','fifa',27,'14:00','sala-norte-2','Sala 103',['Real Madrid','Barcelona','Manchester City','PSG','Flamengo','Palmeiras','Bayern','Liverpool'],'1 × 1 · mata-mata','1. Oito jogadores; eliminatória simples em partida única.\n2. Partidas com 6 minutos por tempo, velocidade normal e elencos iguais para todos.\n3. Empate vai para prorrogação e pênaltis.\n4. Sem seleções ou equipes personalizadas; pausas só com a bola parada.\n5. Confira o controle antes da partida. A edição do FIFA será a disponível na estação do campeonato.'),
 tour('valorant','VALORANT','valorant',27,'14:00','sala-interna-sul-0','Sala 108',['Duelista','Controlador','Sentinela','Iniciador'],'5 × 5 · equipes','1. Oito equipes, cada uma com cinco jogadores e um capitão.\n2. A chave representa equipes; o capitão faz a inscrição e apresenta a escalação à organização.\n3. Melhor de um mapa até a final; final melhor de três, se houver tempo.\n4. Mapas e lados definidos por veto; configurações competitivas e prorrogação ativada.\n5. Proibidos cheats, exploração de bugs e comunicação ofensiva; falhas técnicas são tratadas pela equipe.',teams=True),
 tour('gh3','Guitar Hero III','guitarhero3',27,'14:00','sala-oeste-sul','Sala 105',['Difícil','Expert'],'1 × 1 · duelo por pontos','1. Chave de oito jogadores, em duelos melhor de três músicas.\n2. Mesma música e dificuldade para os dois jogadores; padrão Difícil.\n3. Ganha cada música quem alcançar a maior pontuação; empate usa maior sequência de notas.\n4. Cada jogador escolhe uma música da lista da estação; desempate por sorteio.\n5. Sem modificadores, cheats ou pausas; os controles são testados antes do duelo.',True)]
tournaments[3]['res'].update(q1=0,s0=1,f=0)
for t in tournaments:
 sessions.append({'id':'jogo-'+t['id'],'type':'Campeonato','day':t['day'],'time':t['time'],'end':'18:00','title':'Campeonato de '+t['name'],'short':t['name'],'tournament':t['id'],'floor':t['floor'],'zone':t['zone'],'room':t['room'],'description':t['format']+'. Confira as regras, acompanhe a chave e torça pelos jogadores.','learn':[],'materials':[],'requirements':'Confira as regras e chegue antes da sua partida.','link':SOURCE,'demo':True,'roomDemo':True,'seats':8,'taken':len(t['players'])})
sessions.append({'id':'credenciamento','type':'Credenciamento','day':26,'time':'13:00','end':'14:00','title':'Credenciamento','short':'Credenciamento','floor':0,'zone':'recepcao','room':'Recepção','simple':True,'demo':True,'description':'Leia o QR da recepção para confirmar seu credenciamento.','learn':[],'materials':[],'requirements':'','link':SOURCE})
sessions.sort(key=lambda x:(x['day'],x['time'],x['id']))
posts=[
 {'id':'demo-encontro','author':'demo-ana','handle':'ana.beatriz','name':'Ana Beatriz','initials':'AB','photo':'assets/community/avatar-ana.svg','text':'Saí do Game Maker com um joguinho funcionando! Colisão, personagem andando e aquela vontade de continuar em casa. Minicurso muito foda 🕹️','activity':'game-maker','day':27,'images':[{'src':'assets/community/projeto.jpg','alt':'Notebook com projeto de programação','caption':'O primeiro jogo a gente não esquece'}],'likes':18},
 {'id':'demo-projeto','author':'demo-lucas','handle':'lucas.gabriel','name':names[0],'initials':'LE','photo':'assets/community/avatar-lucas.svg','text':'Ganhei o MK11! A final foi apertada demais. Valeu pra quem ficou torcendo 🏆','activity':'jogo-mk','day':27,'images':[{'src':'assets/games/mk11.jpg','alt':'Arte de Mortal Kombat 11'}],'likes':32},
 {'id':'demo-dica','author':'demo-julia','handle':'julia.costa','name':'Júlia Costa','initials':'JC','photo':'assets/community/avatar-julia.svg','text':'Aprendi a criar uma API com FastAPI e já saí testando as rotas na documentação. Agora quero ligar isso no meu próximo projeto!','activity':'fastapi','day':26,'images':[{'src':'assets/community/equipe.jpg','alt':'Equipe trabalhando com notebooks'},{'src':'assets/community/ideias.jpg','alt':'Conversa sobre um projeto'}],'likes':14},
 {'id':'demo-fifa','author':'demo-andrea','handle':'andrea.gabriely','name':names[1],'initials':'AG','photo':'assets/community/avatar-ana.svg','text':'Passei da primeira fase do FIFA e já tô me achando profissional 😂 Quem vai acompanhar a próxima partida?','activity':'jogo-fifa','day':27,'images':[{'src':'assets/games/fifa.jpg','alt':'Arte de FIFA'}],'likes':21},
 {'id':'demo-valorant','author':'demo-chico','handle':'francisco.leocassio','name':names[3],'initials':'FL','photo':'assets/community/avatar-lucas.svg','text':'Equipe fechada pro Valorant! Hoje é dia de jogar junto e fazer amizade com a galera do campus.','activity':'jogo-valorant','day':27,'images':[{'src':'assets/games/valorant.jpg','alt':'Arte de VALORANT'}],'likes':11},
 {'id':'demo-gh3','author':'demo-maria-v','handle':'maria.vitoria','name':names[2],'initials':'MV','photo':'assets/community/avatar-julia.svg','text':'Levei o Guitar Hero III! Minha mão quase travou na última música, mas deu bom 🎸🏆','activity':'jogo-gh3','day':27,'images':[{'src':'assets/games/guitarhero3.jpg','alt':'Capa de Guitar Hero III'}],'likes':28}]
for post in posts:post.update(time='Há pouco',role='Participante',tag='No evento',demo=True)
scenario={'event':{'id':8528,'name':'VII ETAL','year':2025,'source':SOURCE,'dates':['2025-11-26','2025-11-27','2025-11-28'],'notice':'Programação de 2025. Salas, campeonatos, resultados e publicações preparados para demonstração.'},'tournaments':tournaments,'posts':posts,'organizers':OLD['organizadores'],'people':[{'id':f'demo-player-{i}','name':name,'initials':''.join(w[0] for w in name.split()[:2])} for i,name in enumerate(names)]}
seed=ROOT/'backend/seed';seed.mkdir(exist_ok=True)
(seed/'suap-vii-etal-publico.json').write_text(json.dumps({'source':SOURCE,'fetchedAt':datetime.now(timezone.utc).isoformat(),'eventId':8528,'programacao':source},ensure_ascii=False,indent=2)+'\n')
(seed/'cenario-demo.json').write_text(json.dumps(scenario,ensure_ascii=False,indent=2)+'\n')
p=ROOT/'prototipo/data.js';text=p.read_text();a=text.index('  sessions: [');b=text.index('  enrolled:',a);text=text[:a]+'  sessions: '+json.dumps(sessions,ensure_ascii=False,indent=2)+',\n'+text[b:]
a=text.index('  tournaments: [');b=text.index('\n};',a);text=text[:a]+'  tournaments: '+json.dumps(tournaments,ensure_ascii=False,indent=2)+','+text[b:]
text=re.sub(r"  const seats = \{.*?window.DATA.sessions.forEach\(.*?\);\n",'',text,count=1,flags=re.S)
if '/* Programação ampliada:' in text:
 a=text.index('/* Programação ampliada:');b=text.index("window.DATA.places.obelisco",a);text=text[:a]+text[b:]
# Campos preparados para o app, o painel e a exportação offline.
a=text.find('\n/* <cenario-demo> */');text=text[:a] if a>=0 else text
text+='\n/* <cenario-demo> */\nwindow.DATA.event = '+json.dumps(scenario['event'],ensure_ascii=False)+';\nwindow.DATA.demoPosts = '+json.dumps(posts,ensure_ascii=False)+';\nwindow.DATA.demoPeople = '+json.dumps(scenario['people'],ensure_ascii=False)+';\n'
text=text.replace("window.DATA.tournaments[0].logo = 'assets/logo-mk.png';",'// As quatro modalidades usam suas próprias artes locais.').replace('window.DATA.tournaments[1].hideName = true;','')
text=text.replace("enrolled: ['react-native', 'react-next', 'saude-mental']", "enrolled: ['game-maker', 'saude-mental', 'imagens-ia']")
workshop=ROOT/'backend/seed/oficina-kellyson.json'
if workshop.exists():
 text+='\n/* <oficina-kellyson> */\nwindow.DATA.sessions = window.DATA.sessions.filter((a) => a.id !== "sua-palestra");\nwindow.DATA.sessions.push('+json.dumps(json.loads(workshop.read_text()),ensure_ascii=False)+');\n'
p.write_text(text)
subprocess.run(['node','scripts/app/exportar-programacao.mjs'],cwd=ROOT,check=True)
print(f'{len(source)} atividades oficiais + 4 campeonatos e credenciamento; {len(posts)} publicações demonstrativas.')
