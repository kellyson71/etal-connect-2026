"""Reference-based schematic. Coordinates are drawing units, never metres."""
import json
from pathlib import Path
from xml.sax.saxutils import escape
ROOT=Path(__file__).resolve().parents[1]
# Malha única: quatro faixas com salas iguais, duas em cada corredor, entre a escada (oeste) e a rampa (leste).
CORRIDOR=30
ROOM_H=58
PATIO_H=28
GRID_X,GRID_END=260,770
ROOM_W=(GRID_END-GRID_X)/4
Y_TOP=20
Y_C1=Y_TOP+ROOM_H          # corredor superior
Y_IN=Y_C1+CORRIDOR         # salas abaixo do corredor superior
Y_PATIO=Y_IN+ROOM_H
Y_IS=Y_PATIO+PATIO_H       # salas acima do corredor inferior
Y_C2=Y_IS+ROOM_H           # corredor inferior
Y_SOUTH=Y_C2+CORRIDOR
Y_END=Y_SOUTH+ROOM_H
col=lambda i:GRID_X+i*ROOM_W
SW_X=GRID_X-ROOM_W         # sala extra da faixa inferior, na extremidade oeste
STAIR_Y=(Y_TOP+Y_END)/2-30 # escada quadrada, centralizada na altura do bloco
RAMP_END=Y_SOUTH+ROOM_H/2  # a rampa termina no meio da linha da recepção; abaixo fica o patamar aberto
SUN_W=40                   # canto aberto no fim do corredor de cima, ao lado do banheiro feminino
plans=[]
for level,label in [(0,'Térreo'),(1,'1º andar'),(2,'2º andar')]:
 zones=[]
 def rect(id,label,x,y,w,h,kind='classroom',lines=None):
  zones.append(dict(id=id,label=label,x=x,y=y,w=w,h=h,kind=kind,lines=lines or [label]))
 def poly(id,label,points,x,y,kind='classroom',lines=None):
  zones.append(dict(id=id,label=label,points=points,labelX=x,labelY=y,kind=kind,lines=lines or [label]))
 if level==0:
  poly('auditorio','Auditório',f'20,20 230,20 230,{STAIR_Y:g} 170,{STAIR_Y:g} 170,{STAIR_Y+60:g} 230,{STAIR_Y+60:g} 230,{Y_SOUTH} 20,{Y_SOUTH}',100,150,'auditorium')
  rect('saida','Saída do auditório',SW_X,Y_SOUTH,GRID_X-SW_X,ROOM_H,'exit',[''])
 # Acima do auditório não há andares: ele é um volume só, alto, e dos andares de cima se vê o telhado dele.
 # Faixa acima do corredor superior
 if level<2:
  for i in range(4):rect('sala-norte-'+str(i),'Salas de aula — lateral norte '+str(i+1),col(i),Y_TOP,ROOM_W,ROOM_H,lines=['Salas de','aula'])
 else:
  rect('labs-norte','Laboratórios — lateral norte',col(0),Y_TOP,ROOM_W,ROOM_H,'laboratory',['Laboratórios'])
  rect('professores','Sala dos professores',col(1),Y_TOP,ROOM_W,ROOM_H,'staff',['Sala dos','professores'])
  rect('salas-norte','Salas de aula — lateral norte',col(2),Y_TOP,ROOM_W,ROOM_H,lines=['Salas de aula'])
  rect('labs-norte-2','Laboratórios — lateral norte 2',col(3),Y_TOP,ROOM_W,ROOM_H,'laboratory',['Laboratórios'])
 # Faixa abaixo do corredor superior, pátio ou vão, e faixa acima do corredor inferior
 for i in range(4):rect('sala-interna-norte-'+str(i),'Sala de aula — lado interno do corredor superior '+str(i+1),col(i),Y_IN,ROOM_W,ROOM_H,lines=['Sala de aula'])
 rect('patio-interno','Pátio interno' if level==0 else 'Vão do pátio',GRID_X,Y_PATIO,GRID_END-GRID_X,PATIO_H,'courtyard',['Pátio interno' if level==0 else 'Vão do pátio'])
 for i in range(4):rect('sala-interna-sul-'+str(i),'Sala de aula — lado interno do corredor inferior '+str(i+1),col(i),Y_IS,ROOM_W,ROOM_H,lines=['Sala de aula'])
 # Faixa abaixo do corredor inferior; no térreo, a recepção substitui o último trecho
 if level==0:
  for i in range(3):rect('sala-sul-'+str(i),'Salas de aula — lateral sul '+str(i+1),col(i),Y_SOUTH,ROOM_W,ROOM_H,lines=['Salas de aula'])
  rect('recepcao','Recepção',col(3),Y_SOUTH,ROOM_W,ROOM_H,'reception',['Recepção'])
 else:
  for i in range(4):rect('salas-sul-'+str(i),'Salas de aula — lateral sul '+str(i+1),col(i),Y_SOUTH,ROOM_W,ROOM_H,lines=['Salas de aula'])
 # The stairs occupy their own square in the west wing, outside both corridors.
 rect('escada','Escada lateral oeste',170,STAIR_Y,60,60,'stairs',['Escada'])
 rect('banheiro-masculino','Banheiro masculino',770,Y_TOP,55,ROOM_H,'restroom',['WC'])
 rect('banheiro-acessivel','Banheiro acessível',825,Y_TOP,55,ROOM_H,'accessible',['Acessível'])
 # O corredor de cima avança um pouco além da faixa das salas e termina num canto aberto, que pega sol.
 rect('banheiro-feminino','Banheiro feminino',800+SUN_W,Y_C1,80-SUN_W,42,'restroom',['WC'])
 ramp_y=Y_C1+42
 rect('rampa','Rampa lateral leste',800,ramp_y,80,RAMP_END-ramp_y,'ramp',['Rampa'])
 if level==1:rect('bebedouro','Bebedouro',806,368,16,16,'water',[''])
 corridors=[dict(id='corredor-superior',label='Corredor superior',x=230,y=Y_C1,w=570,h=CORRIDOR),dict(id='corredor-lateral',label='Circulação lateral' if level==0 else 'Corredor com janelas para o telhado do auditório',x=230,y=Y_IN if level==0 else Y_TOP,w=GRID_X-230,h=(Y_C2-Y_IN) if level==0 else Y_END-Y_TOP),dict(id='corredor-inferior',label='Corredor inferior',x=230,y=Y_C2,w=570,h=CORRIDOR),dict(id='corredor-leste',label='Corredor lateral direito',x=770,y=Y_C1,w=30,h=Y_END-Y_C1)]
 if level==0:
  corridors.append(dict(id='saida-auditorio',label='Entrada pelo auditório',x=SW_X,y=Y_SOUTH,w=GRID_X-SW_X,h=ROOM_H))
  corridors.append(dict(id='acesso-anexo',label='Entrada pelo Anexo',x=230,y=20,w=GRID_X-230,h=Y_C1-20))
 corridors.append(dict(id='area-sol',label='Área aberta',x=800,y=Y_C1,w=SUN_W,h=42))
 corridors.append(dict(id='patamar',label='Patamar da rampa',x=800,y=RAMP_END,w=80,h=390-RAMP_END))
 rec_x=col(3)+ROOM_W/2
 entry_route=[[820,385],[820,RAMP_END+18],[785,RAMP_END+18],[785,Y_C2+CORRIDOR/2],[rec_x,Y_C2+CORRIDOR/2],[rec_x,Y_SOUTH-1]] if level==0 else []
 ramp=next(z for z in zones if z['kind']=='ramp');rx,rw,ry,rh=ramp['x'],ramp['w'],ramp['y'],ramp['h']
 left,right,center=rx+rw*.2,rx+rw*.8,rx+rw*.5
 top,bottom=ry+12,ry+rh-6
 rails=f'M{left} {bottom}V{top+16}Q{left} {top} {center} {top}Q{right} {top} {right} {top+16}V{bottom}'
 arrows=f'M{left} 235v-30m-3 6 3-6 3 6M{right} 205v30m-3-6 3 6 3-6'
 doors=[]
 for z in zones:
  if z['kind'] not in ['classroom','laboratory','staff']:continue
  if z.get('y')==Y_TOP:doors.append(dict(x=z['x']+z['w']*.5,y=Y_C1,axis='h'))
  elif z.get('y')==Y_IN:doors.append(dict(x=z['x']+z['w']*.5,y=Y_IN,axis='h'))
  elif z.get('y')==Y_IS:doors.append(dict(x=z['x']+z['w']*.5,y=Y_C2,axis='h'))
  elif z.get('y')==Y_SOUTH:doors.append(dict(x=z['x']+z['w']*.5,y=Y_SOUTH,axis='h'))
 if level==0:
  doors.append(dict(x=rec_x,y=Y_SOUTH,axis='h'))
  doors.append(dict(x=230,y=STAIR_Y+81,axis='v'))
 room_index=0
 kinds={'classroom':'Sala','laboratory':'Laboratório','staff':'Professores'}
 for z in zones:
  z['roomNumber']='';z['useLabel']=kinds.get(z['kind'],z['label']);z['description']=z['label']
  if z['kind'] in kinds:
   room_index+=1;number=f'{level*100+room_index:03d}'
   z['roomNumber']=number;z['label']='Sala '+number
   z['lines']=['Sala',number] if z.get('h',0)>=60 else ['Sala '+number]
 outline=f'M20 20H880V390H800V{Y_END}H{SW_X:g}V{Y_SOUTH}H20Z' if level==0 else f'M230 20H880V390H800V{Y_END}H230V{STAIR_Y+60:g}H170V{STAIR_Y:g}H230Z'
 roof=f'20,20 230,20 230,{Y_SOUTH} 20,{Y_SOUTH}' if level else ''
 passage=[[245,20],[245,Y_END]] if level==0 else []
 plans.append(dict(level=level,passage=passage,audRoof=roof,label=label,zones=zones,corridors=corridors,doors=doors,outline=outline,entryRoute=entry_route,entryArrow=f'M{rec_x-4} {Y_SOUTH-7}l4 6 4-6' if level==0 else '',rampRails=rails,rampArrows=arrows))
(ROOT/'app/data/principal-plan.json').write_text(json.dumps(dict(source='Imagens e correções fornecidas pelo usuário',units='schematic',viewBox='0 0 900 430',floors=plans),ensure_ascii=False,indent=2)+'\n')
# Export an independent, reviewable sheet from exactly the same geometry.
import sys
sys.path.insert(0,str(ROOT/'scripts'))
from plan_styles import sheet
svg=sheet(json.loads((ROOT/'app/data/principal-plan.json').read_text()),'clara')
for target in ['public/maps/bloco-principal.svg','maps/bloco-principal.svg']:(ROOT/target).write_text(svg)
print('Three floor plans and standalone SVG generated from shared geometry.')
