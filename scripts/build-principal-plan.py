"""Planta do bloco principal traçada sobre as plantas de 2012.

Fonte: Larissa Leiros de Souza, "Padronização e flexibilidade: uma proposta…", dissertação de mestrado,
UFRN, 2012, figuras 9, 10 e 11 (térreo, 1º e 2º pavimento do Campus Pau dos Ferros).
As coordenadas são os pixels da figura do térreo (974 × 621); o 1º e o 2º pavimento foram medidos
nas figuras deles e coincidem com o térreo em até 3 px. Paredes medidas por varredura das linhas.

A figura tem o norte para cima: o auditório fica a oeste, a ala da rampa é a lateral leste inclinada
e a entrada principal é o hall a sudeste. O contorno bate com o levantamento do Google Earth
(campus-limpo.js, marcação 0); WORLD leva a planta para os metros do mapa (ajuste por mínimos quadrados,
erro de cerca de 1 m).

Uso dos ambientes: o de 2012. Números: só os confirmados por fonte (KNOWN); os demais são demonstrativos.
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VIEWBOX = '0 0 960 660'
WORLD = dict(sx=0.068172, sy=0.065299, x0=-42.2988, y0=-52.1472)

# Linhas inclinadas da ala leste (x em função de y), medidas na figura.
L1 = lambda y: round(592 + 0.42 * y, 1)  # fim das salas e do pátio; começo da circulação
L2 = lambda y: round(639 + 0.40 * y, 1)  # fim da circulação; começo da rampa
L3 = lambda y: round(718 + 0.40 * y, 1)  # parede externa da rampa

# Faixas horizontais (paredes)
N0, N1 = 24, 113     # fileira norte
C1 = (113, 150)      # corredor norte
I1 = (150, 238)      # fileira interna norte
PT = (238, 327)      # pátio interno / vão
I2 = (327, 417)      # fileira interna sul
C2 = (417, 454)      # corredor sul
S0, S1 = 454, 542    # fileira sul

# Curva da fachada do auditório (sudoeste)
CURVE_ROOF = [(55, 333), (55, 380), (59, 404), (68, 428), (83, 452), (108, 476), (126, 488), (160, 500), (233, 501)]
CURVE_WALL = [(67, 332), (68, 380), (72, 392), (78, 416), (86, 440), (100, 452), (127, 476), (147, 488), (197, 492)]

ENTRANCES = {'principal': [891, 612], 'auditorio': [212, 484], 'anexo': [226, 28]}

# Ambientes com número de fonte oficial e nomes conhecidos.
KNOWN = {
 (0, 'servico-social'): dict(number='13',
   source='Notícia do IFRN, 13/03/2019: atendimento da Coordenação de Atividades Estudantis “na sala 13, no pavimento térreo do Bloco I”. '
          'Na planta de 2012 o serviço social fica aqui; a correspondência é provável.',
   url='https://portal.ifrn.edu.br/campus/paudosferros/noticias/coordenacao-de-atividades-estudantis-convoca-candidatos-a-bolsas-para-entrevistas/'),
}
SRC_2012 = 'Uso conforme a planta de 2012 (dissertação de Larissa Leiros de Souza, UFRN).'
USER_SAID = {(0, 'rh'), (0, 'descanso-norte'), (0, 'descanso-corredor'), (0, 'secretaria-academica'), (0, 'sala-ti'), (0, 'napne'), (1, 'sala-oeste-norte'), (1, 'sala-oeste-sul'), (1, 'antigo-gremio'), (1, 'gremio'), (1, 'sala-nadic'), (2, 'sala-ads'), (2, 'lab-sul-2'), (2, 'lab-manutencao'), (2, 'lab-quimica'), (2, 'professores'), (2, 'sala-reuniao'), (2, 'coord-ads')}


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def bbox(p):
    xs, ys = [q[0] for q in p], [q[1] for q in p]
    return min(xs), min(ys), max(xs), max(ys)


def centroid(p):
    a = cx = cy = 0
    for i in range(len(p)):
        x0, y0 = p[i]; x1, y1 = p[(i + 1) % len(p)]
        k = x0 * y1 - x1 * y0; a += k; cx += (x0 + x1) * k; cy += (y0 + y1) * k
    a *= 0.5
    return (round(cx / (6 * a), 1), round(cy / (6 * a), 1)) if abs(a) > 1e-6 else p[0]


def pts(p):
    return ' '.join(f'{x:g},{y:g}' for x, y in p)


def path(p):
    return 'M' + ' L'.join(f'{x:g} {y:g}' for x, y in p) + ' Z'


class Floor:
    def __init__(self, level, label):
        self.level, self.label = level, label
        self.zones, self.corridors, self.doors, self.roofs, self.marks = [], [], [], [], []
        self.walls, self.glass = [], []  # paredes soltas (segmentos) e portas de vidro para fora

    def zone(self, id, poly, kind='classroom', name=None, word=None, door=None, label=None):
        x0, y0, x1, y1 = bbox(poly)
        z = dict(id=id, kind=kind, label=label or name or id)
        if len(poly) == 4 and poly[0][1] == poly[1][1] and poly[1][0] == poly[2][0] and poly[2][1] == poly[3][1] and poly[3][0] == poly[0][0]:
            z.update(x=x0, y=y0, w=round(x1 - x0, 1), h=round(y1 - y0, 1))
        else:
            cx, cy = centroid(poly)
            z.update(points=pts(poly), labelX=cx, labelY=cy, bx=x0, by=y0, bw=round(x1 - x0, 1), bh=round(y1 - y0, 1))
        if name:
            z['name'] = name
        if word:
            z['word'] = word
        z['lines'] = [z['label']]
        self.zones.append(z)
        if door:
            self.doors.append(dict(x=door[0], y=door[1], axis=door[2]))
        return z

    def corridor(self, id, label, poly):
        x0, y0, x1, y1 = bbox(poly)
        c = dict(id=id, label=label)
        if len(poly) == 4 and poly[0][1] == poly[1][1] and poly[1][0] == poly[2][0]:
            c.update(x=x0, y=y0, w=round(x1 - x0, 1), h=round(y1 - y0, 1))
        else:
            c.update(points=pts(poly), x=x0, y=y0, w=round(x1 - x0, 1), h=round(y1 - y0, 1))
        self.corridors.append(c)


def row(f, y0, y1, cells, door_y):
    """Fileira de salas retangulares: cells = [(x0, x1, id, kind, name, word), …]."""
    for x0, x1, id, kind, name, word in cells:
        f.zone(id, rect(x0, y0, x1, y1), kind, name, word, door=((x0 + x1) / 2, door_y, 'h'))


EAST = [(662, 113), (L2(113), 113), (L2(S1), S1), (L1(S1), S1), (L1(169), 169)]
RAMP = [(L2(165), 165), (L3(165), 165), (L3(505), 505), (L2(505), 505)]
LANDING = [(L2(505), 505), (L3(505), 505), (L3(S1), S1), (L2(S1), S1)]
WC_NE = [(662, N0), (L3(N0), N0), (L3(142), 142), (L2(165), 165), (L2(113), 113), (662, 113)]
COURT = [(378, PT[0]), (L1(PT[0]), PT[0]), (L1(PT[1]), PT[1]), (378, PT[1])]
TRAP_I2 = lambda x0: [(x0, I2[0]), (L1(I2[0]), I2[0]), (L1(I2[1]), I2[1]), (x0, I2[1])]
UPPER_OUTLINE = [(235, N0), (L3(N0), N0), (L3(S1), S1), (235, S1)]
AUD_ROOF = [(20, N0), (233, N0), (233, 501)] + CURVE_ROOF[::-1][1:] + [(20, 333)]
HALL_ROOF = rect(860, S1, 922, 614)


def common_east(f, upper):
    f.zone('wc-leste', WC_NE, 'restroom', 'Banheiros', 'WC')
    f.zone('rampa', RAMP, 'ramp', 'Rampa', 'RAMPA')
    f.corridor('circulacao-leste', 'Circulação da rampa', EAST)
    f.corridor('patamar', 'Patamar da rampa', LANDING)
    if upper:
        f.roofs.append(dict(points=pts(HALL_ROOF), label='Hall de entrada (pé-direito duplo)'))


def ground():
    f = Floor(0, 'Térreo')
    f.zone('auditorio', rect(20, N0, 216, 302), 'auditorium', 'Auditório')
    # A antiga 002 deu lugar ao prolongamento da circulação até uma porta de vidro na fachada norte;
    # uma paredezinha segue a linha do corredor e o resto da sala virou um canto de descanso (informado pelo usuário).
    row(f, N0, N1, [(235, 315, 'rh', 'office', 'Recursos Humanos', 'RH')], N1)
    f.zone('descanso-norte', rect(315, N0, 341, N1 - 2), 'lounge', 'Área de descanso', 'DESCANSO')
    f.corridor('saida-norte', 'Circulação até a saída norte', rect(341, N0, 378, C1[0]))
    # Paredezinha na linha do corredor de cima, entre o canto de descanso e o corredor (parede de verdade, com espessura).
    f.zone('parede-descanso', rect(315, N1 - 2, 341, N1 + 1), 'wall', 'Parede')
    # Puffs e poltronas no começo do corredor de cima, entre o RH (001) e a Secretaria (003).
    f.zone('descanso-corredor', rect(238, 116, 312, 147), 'lounge', 'Área de descanso com puffs e poltronas', 'DESCANSO')
    row(f, N0, N1, [(377, 431, 'comunicacao', 'office', 'Comunicação Social e Eventos', 'COMUNICAÇÃO'),
                    (431, 520, 'extensao-pesquisa', 'office', 'Extensão e Pesquisa', 'EXTENSÃO'),
                    (520, 609, 'dep-academico', 'office', 'Departamento Acadêmico', 'DEP. ACADÊMICO'),
                    (609, 662, 'assuntos-estudantis', 'office', 'Ensino e Assuntos Estudantis', 'ESTUDANTIS')], N1)
    f.zone('secretaria-academica', rect(235, I1[0], 341, I1[1]), 'office', 'Secretaria Acadêmica', 'SECRETARIA', door=(341, 194, 'v'))
    f.zone('diretor', rect(235, I1[1], 298, I2[0]), 'office', 'Direção-Geral', 'DIREÇÃO', door=(235, 282, 'v'))
    f.zone('escada', rect(298, I1[1], 341, 322), 'stairs', 'Escada', 'ESCADA')
    f.zone('gabinete', rect(235, I2[0], 298, I2[1]), 'office', 'Chefia de Gabinete', 'GABINETE', door=(235, 372, 'v'))
    f.zone('estar', rect(298, 322, 341, I2[1]), 'office', 'Sala de estar', 'ESTAR', door=(341, 370, 'v'))
    row(f, I1[0], I1[1], [(377, 431, 'estudos-servidores', 'office', 'Sala de estudos dos servidores', 'ESTUDOS'),
                          (431, 520, 'sala-servidores', 'office', 'Sala dos servidores', 'SERVIDORES'),
                          (520, 609, 'coordenacoes', 'office', 'Coordenações de cursos e Pedagogia', 'COORDENAÇÕES'),
                          (609, 662, 'registro-academico', 'office', 'Registro Acadêmico e Seleção Discente', 'REG. ACADÊMICO')], I1[0])
    f.zone('patio-interno', COURT, 'courtyard', 'Pátio interno')
    row(f, I2[0], I2[1], [(377, 431, 'sala-ti', 'office', 'Sala de TI', 'TI'),
                          (431, 520, 'manutencao', 'office', 'Manutenção, Serviços Gerais e Transporte', 'MANUTENÇÃO'),
                          (520, 553, 'copa', 'staff', 'Copa', 'COPA'),
                          (553, 609, 'coord-ti', 'office', 'Coordenação de TI', 'COORD. TI'),
                          (609, 662, 'servico-social', 'office', 'Serviço Social', 'S. SOCIAL')], I2[1])
    f.zone('sala-projetos', TRAP_I2(662), 'office', 'Sala de Projetos', 'PROJETOS', door=(690, I2[1], 'h'))
    row(f, S0, S1, [(235, 288, 'protocolo', 'office', 'Protocolo', 'PROTOCOLO'),
                    (288, 377, 'manut-informatica', 'office', 'Manutenção de Informática', 'MANUT. INFO.'),
                    (377, 431, 'napne', 'office', 'NAPNE', 'NAPNE'),
                    (431, 520, 'almoxarifado', 'office', 'Almoxarifado', 'ALMOXARIFADO'),
                    (520, 662, 'sala-estudos-informatica', 'laboratory', 'Sala de Estudos de Informática', 'ESTUDOS INFO.'),
                    (662, 734, 'grafica', 'office', 'Gráfica', 'GRÁFICA')], S0)
    f.zone('dir-adm', [(734, S0), (L1(S0), S0), (L1(S1), S1), (734, S1)], 'office', 'Diretoria de Administração', 'DIR. ADM.', door=(756, S0, 'h'))
    f.zone('wc-auditorio', rect(124, 327, 216, 417), 'restroom', 'Banheiros do auditório', 'WC', door=(124, 372, 'v'))
    f.zone('recepcao', rect(860, 578, 922, 614), 'reception', 'Recepção', 'RECEPÇÃO')
    common_east(f, False)
    f.corridor('passagem-anexo', 'Corredor do Anexo', rect(213, N0, 236, 470))
    f.corridor('corredor-norte', 'Corredor', rect(235, C1[0], 662, C1[1]))
    f.corridor('circulacao-oeste', 'Circulação', rect(341, C1[1], 378, C2[0]))
    f.corridor('corredor-sul', 'Corredor', rect(213, C2[0], 776, C2[1]))
    f.corridor('hall-auditorio', 'Hall do auditório',
               [(20, 302), (216, 302), (216, 327), (124, 327), (124, 417), (216, 417), (216, 490), (197, 492)] + CURVE_WALL[::-1][1:] + [(20, 332)])
    f.corridor('hall-entrada', 'Hall de entrada', rect(856, S1, 922, 578))
    f.outline = [(20, N0), (L3(N0), N0), (L3(S1), S1), (922, S1), (922, 614), (860, 614), (860, S1), (235, S1), (235, 492)] + CURVE_WALL[::-1] + [(20, 332)]
    f.marks += [('Entrada do Anexo', 226, 14), ('Entrada do auditório', 160, 512)]
    f.entry = [[891, 646], [891, 600]]
    return f


def first():
    f = Floor(1, '1º andar')
    row(f, N0, N1, [(235, 377, 'sala-norte-0', 'classroom', None, None), (377, 520, 'sala-norte-1', 'classroom', None, None),
                    (520, 662, 'sala-norte-2', 'classroom', None, None)], N1)
    f.zone('sala-oeste-norte', rect(235, I1[0], 341, I1[1]), 'classroom', None, None, door=(327, I1[0], 'h'))
    f.zone('antigo-gremio', rect(235, I1[1], 298, 327), 'office', 'Antiga sala do Grêmio', 'EX-GRÊMIO', door=(298, 300, 'v'))
    f.zone('escada', rect(298, I1[1], 341, 322), 'stairs', 'Escada', 'ESCADA')
    f.zone('sala-oeste-sul', rect(235, I2[0], 341, I2[1]), 'classroom', None, None, door=(327, I2[1], 'h'))
    row(f, I1[0], I1[1], [(377, 520, 'sala-interna-norte-0', 'classroom', None, None), (520, 662, 'sala-interna-norte-1', 'classroom', None, None)], I1[0])
    f.zone('vao-patio', COURT, 'courtyard', 'Vão do pátio')
    row(f, I2[0], I2[1], [(377, 520, 'sala-interna-sul-0', 'classroom', None, None),
                          (520, 662, 'sala-nadic', 'office', 'Sala dos bolsistas do NADIC', 'NADIC')], I2[1])
    f.zone('gremio', TRAP_I2(662), 'office', 'Grêmio Estudantil', 'GRÊMIO', door=(690, I2[1], 'h'))
    row(f, S0, S1, [(235, 377, 'salas-sul-0', 'classroom', None, None), (377, 520, 'salas-sul-1', 'classroom', None, None),
                    (520, 662, 'salas-sul-2', 'classroom', None, None), (662, 778, 'salas-sul-3', 'classroom', None, None)], S0)
    common_east(f, True)
    f.corridor('corredor-norte', 'Corredor', rect(235, C1[0], 662, C1[1]))
    f.corridor('circulacao-oeste', 'Circulação', rect(341, C1[0], 378, C2[0]))
    f.corridor('corredor-sul', 'Corredor', rect(235, C2[0], 776, C2[1]))
    f.roofs += [dict(points=pts(AUD_ROOF), label='Telhado do auditório')]
    f.outline = UPPER_OUTLINE
    return f


def second():
    """2º andar: mesmo esqueleto do 1º (corredor de cima, ala oeste com dois laboratórios e escada).
    Parte de cima e fileira abaixo do corredor de cima: como o usuário lembra hoje (a biblioteca de 2012 saiu
    para um bloco próprio, Quadro 3 da dissertação). Parte de baixo: como na planta de 2012."""
    f = Floor(2, '2º andar')
    row(f, N0, N1, [(235, 377, 'lab-manutencao', 'laboratory', 'Laboratório de Manutenção de Computadores', 'MANUT. PCs'),
                    (377, 520, 'lab-quimica', 'laboratory', 'Laboratório de Química (a confirmar)', 'QUÍMICA?'),
                    (520, 662, 'lab-norte-3', 'laboratory', None, None)], N1)
    f.zone('lab-oeste-norte', rect(235, I1[0], 341, I1[1]), 'laboratory', None, None, door=(327, I1[0], 'h'))
    f.zone('escada', rect(298, I1[1], 341, 322), 'stairs', 'Escada', 'ESCADA')
    f.zone('lab-oeste-sul', rect(235, I2[0], 341, I2[1]), 'laboratory', None, None, door=(327, I2[1], 'h'))
    row(f, I1[0], I1[1], [(377, 540, 'professores', 'staff', 'Sala dos professores', 'PROFESSORES'),
                          (540, 600, 'sala-reuniao', 'office', 'Sala de reunião', 'REUNIÃO'),
                          (600, 662, 'coord-ads', 'office', 'Coordenação de ADS', 'COORD. ADS')], I1[0])
    f.zone('vao-patio', COURT, 'courtyard', 'Vão do pátio')
    row(f, I2[0], I2[1], [(378, 521, 'labs-norte', 'laboratory', None, None), (521, 664, 'labs-norte-2', 'laboratory', None, None)], I2[1])
    f.zone('coord-labs', TRAP_I2(664), 'office', 'Coordenação de Laboratórios e Ferramental', 'COORD. LABS', door=(692, I2[1], 'h'))
    row(f, S0, S1, [(235, 378, 'sala-ads', 'office', 'Sala de estudo e descanso de ADS', 'ESTUDO ADS'),
                    (378, 521, 'lab-sul-1', 'laboratory', None, None),
                    (521, 700, 'lab-sul-2', 'laboratory', None, None),
                    (700, 778, 'loja', 'office', 'Loja', 'LOJA')], S0)
    common_east(f, True)
    f.corridor('corredor-norte', 'Corredor', rect(235, C1[0], 662, C1[1]))
    f.corridor('circulacao-oeste', 'Circulação', rect(341, C1[0], 378, C2[0]))
    f.corridor('corredor-sul', 'Corredor', rect(235, C2[0], 776, C2[1]))
    f.roofs += [dict(points=pts(AUD_ROOF), label='Telhado do auditório'), dict(points=pts(rect(235, I1[1], 298, 327)), label='')]
    f.outline = UPPER_OUTLINE
    return f


def ramp_loop():
    """Caminho na rampa: sobe pela pista de dentro, faz a volta no alto e desce pela de fora (um andar)."""
    a = lambda y: (round(L2(y) + 20, 1), y)
    b = lambda y: (round(L2(y) + 58, 1), y)
    foot = (round(L2(522) + 40, 1), 522)
    up = [a(y) for y in range(500, 184, -40)] + [a(185)]
    top = [(round(L2(178) + 39 + 19 * math.cos(t / 8 * 3.14159 + 3.14159), 1), round(178 - 12 * math.sin(t / 8 * 3.14159), 1)) for t in range(1, 8)]
    down = [b(185)] + [b(y) for y in range(220, 501, 40)] + [b(500)]
    return foot, [foot] + up + top + down + [foot]


floors = [ground(), first(), second()]

# Portas medidas nas figuras de 2012 (vãos nas paredes dos corredores, quase sempre em pares junto da divisa).
# Direção e Gabinete abrem para a sala de Estar, que é aberta para a circulação.
DOORS = {
 0: {'rh': (306, N1), 'comunicacao': (386, N1), 'extensao-pesquisa': (511, N1),
     'dep-academico': (528, N1), 'assuntos-estudantis': (653, N1),
     'estudos-servidores': (386, I1[0]), 'sala-servidores': (511, I1[0]), 'coordenacoes': (528, I1[0]), 'registro-academico': (653, I1[0]),
     'secretaria-academica': (332, I1[0]), 'diretor': (270, I2[0]), 'gabinete': (298, 336, 'v'), 'estar': (341, 370, 'v'),
     'sala-ti': (386, I2[1]), 'manutencao': (511, I2[1]), 'copa': (536, I2[1]), 'coord-ti': (561, I2[1]),
     'servico-social': (653, I2[1]), 'sala-projetos': (670, I2[1]),
     'protocolo': (282, S0), 'manut-informatica': (372, S0), 'napne': (385, S0), 'almoxarifado': (515, S0),
     'sala-estudos-informatica': (528, S0), 'grafica': (670, S0), 'dir-adm': (740, S0)},
 1: {'sala-norte-0': (368, N1), 'sala-norte-1': (386, N1), 'sala-norte-2': (652, N1),
     'sala-oeste-norte': (330, I1[0]), 'sala-interna-norte-0': (386, I1[0]), 'sala-interna-norte-1': (653, I1[0]),
     'sala-oeste-sul': (330, I2[1]), 'sala-interna-sul-0': (386, I2[1]), 'sala-nadic': (652, I2[1]), 'gremio': (668, I2[1]),
     'salas-sul-0': (368, S0), 'salas-sul-1': (386, S0), 'salas-sul-2': (650, S0), 'salas-sul-3': (668, S0)},
 2: {'lab-manutencao': (368, N1), 'lab-quimica': (386, N1), 'lab-norte-3': (652, N1),
     'lab-oeste-norte': (330, I1[0]), 'professores': (386, I1[0]), 'sala-reuniao': (590, I1[0]), 'coord-ads': (653, I1[0]),
     'lab-oeste-sul': (330, I2[1]), 'labs-norte': (388, I2[1]), 'labs-norte-2': (655, I2[1]), 'coord-labs': (672, I2[1]),
     'sala-ads': (366, S0), 'lab-sul-1': (390, S0), 'lab-sul-2': (690, S0), 'loja': (708, S0)},
}


def zone_box(z):
    if 'x' in z:
        return z['x'], z['y'], z['x'] + z['w'], z['y'] + z['h']
    return z['bx'], z['by'], z['bx'] + z['bw'], z['by'] + z['bh']


for f in floors:
    real = DOORS.get(f.level, {})
    keep = []
    for d in f.doors:
        inside_real = any(b[0] - 1 <= d['x'] <= b[2] + 1 and b[1] - 1 <= d['y'] <= b[3] + 1 for b in (zone_box(z) for z in f.zones if z['id'] in real))
        if not inside_real:
            keep.append(d)
    f.doors = keep + [dict(x=v[0], y=v[1], axis=v[2] if len(v) > 2 else 'h') for v in real.values()]

# Ícone de cada ambiente (desenhado no 3D e na ficha) e uma frase curta para a ficha.
ICON_OF = {
 'secretaria-academica': 'doc', 'registro-academico': 'doc', 'sala-ti': 'pc', 'napne': 'pessoas', 'gremio': 'pessoas', 'antigo-gremio': 'caixa', 'protocolo': 'doc', 'grafica': 'doc', 'dep-academico': 'doc',
 'rh': 'pessoas', 'assuntos-estudantis': 'pessoas', 'descanso-norte': 'sofa', 'descanso-corredor': 'sofa', 'sala-servidores': 'pessoas', 'coordenacoes': 'pessoas',
 'servico-social': 'pessoas', 'coordenacao': 'pessoas', 'coord-labs': 'pessoas',
 'almoxarifado': 'caixa', 'deposito-biblioteca': 'caixa', 'manutencao': 'caixa',
 'coord-ti': 'pc', 'manut-informatica': 'pc', 'sala-estudos-informatica': 'pc',
 'copa': 'copa', 'copa-2': 'copa', 'estar': 'copa', 'estudos-servidores': 'livro',
 'proc-tecnico': 'livro', 'bibliotecaria': 'livro', 'acervo': 'livro', 'biblioteca': 'livro', 'estudo-individual': 'livro', 'recepcao-biblioteca': 'livro',
 'loja': 'loja', 'sala-nadic': 'pc', 'sala-ads': 'livro', 'lab-manutencao': 'pc', 'professores': 'pessoas', 'sala-reuniao': 'atos', 'coord-ads': 'pessoas',
}
ICON_KIND = {'classroom': 'aula', 'laboratory': 'lab', 'office': 'setor', 'staff': 'copa'}
INFO = {
 'secretaria-academica': 'Matrícula, declarações e documentos.',
 'napne': 'Acessibilidade e apoio a pessoas com necessidades específicas.',
 'sala-nadic': 'Dos bolsistas do NADIC, que fizeram este app.',
 'descanso-norte': 'Sofá e guarda-volumes. A porta de vidro ao lado dá para fora.',
 'descanso-corredor': 'Puffs e poltronas.',
 'antigo-gremio': 'Era a sala do Grêmio.',
 'sala-estudos-informatica': 'Computadores para estudo.',
 'auditorio': 'Palco com camarins e saída própria pelo hall curvo.',
 'lab-quimica': 'Talvez de química.',
}
INFO_KIND = {}
for f in floors:
    for z in f.zones:
        ic = ICON_OF.get(z['id']) or ICON_KIND.get(z['kind'])
        if ic:
            z['icon'] = ic
        info = INFO.get(z['id']) or INFO_KIND.get(z['kind'])
        if info:
            z['info'] = info

# Números já usados pelo usuário para se referir às salas: ficam fixos mesmo quando o uso muda.
STABLE = {0: {'rh': '001', 'secretaria-academica': '003', 'comunicacao': '004', 'extensao-pesquisa': '005',
              'dep-academico': '006', 'assuntos-estudantis': '007', 'diretor': '008', 'gabinete': '009', 'estar': '010',
              'estudos-servidores': '011', 'sala-servidores': '012', 'coordenacoes': '014', 'registro-academico': '015', 'sala-ti': '016',
              'manutencao': '017', 'copa': '018', 'coord-ti': '019', 'sala-projetos': '020', 'protocolo': '021', 'manut-informatica': '022',
              'napne': '023', 'almoxarifado': '024', 'sala-estudos-informatica': '025', 'grafica': '026', 'dir-adm': '027'},
          1: {'sala-norte-0': '101', 'sala-norte-1': '102', 'sala-norte-2': '103', 'sala-oeste-norte': '104', 'sala-oeste-sul': '105',
              'sala-interna-norte-0': '106', 'sala-interna-norte-1': '107', 'sala-interna-sul-0': '108', 'sala-nadic': '109', 'gremio': '110',
              'salas-sul-0': '111', 'salas-sul-1': '112', 'salas-sul-2': '113', 'salas-sul-3': '114'}}
# Números: confirmados e fixos ficam; os demais são demonstrativos (001…, 101…, 201…), pulando os já usados no andar.
NUMBERED = ('classroom', 'laboratory', 'staff', 'office')
KINDS = {'classroom': 'Sala', 'laboratory': 'Laboratório', 'staff': 'Apoio', 'office': 'Setor'}
for f in floors:
    taken = {int(v['number']) for (lv, _), v in KNOWN.items() if lv == f.level} | {int(v) - f.level * 100 for v in STABLE.get(f.level, {}).values()}
    n = 0
    for z in f.zones:
        z['roomNumber'] = ''
        z['useLabel'] = z.get('name') or KINDS.get(z['kind'], z['label'])
        z['description'] = z.get('name') or z['label']
        k = KNOWN.get((f.level, z['id']))
        if z['kind'] in NUMBERED:
            if k:
                z['roomNumber'] = k['number']; z['confirmed'] = True; z['source'] = k['source']; z['url'] = k['url']
            elif z['id'] in STABLE.get(f.level, {}):
                z['roomNumber'] = STABLE[f.level][z['id']]
                if (f.level, z['id']) in USER_SAID:
                    z['source'] = 'Uso atual informado pelo usuário, de memória (nov/2026).'
                elif z.get('name'):
                    z['source'] = SRC_2012
            else:
                n += 1
                while n in taken:
                    n += 1
                z['roomNumber'] = f'{f.level * 100 + n:03d}'
                if (f.level, z['id']) in USER_SAID:
                    z['source'] = 'Uso atual informado pelo usuário, de memória (nov/2026).'
                elif z.get('name'):
                    z['source'] = SRC_2012
            z['label'] = z.get('name') or ('Lab ' if z['kind'] == 'laboratory' else 'Sala ') + z['roomNumber']
            z['lines'] = [z['label']]
        elif z.get('name'):
            z['description'] = z['name']

foot, loop = ramp_loop()
rx = lambda y: L2(y) + 39
out_floors = []
for f in floors:
    rails = f'M{rx(195):g} 195 L{rx(498):g} 498'
    arrows = f'M{L2(330)+20:g} 330 l-3 9 M{L2(330)+20:g} 330 l5 7 M{L2(300)+58:g} 300 l3 -9 M{L2(300)+58:g} 300 l-5 -7'
    out_floors.append(dict(level=f.level, label=f.label, zones=f.zones, corridors=f.corridors, doors=f.doors,
                           outline=path(f.outline), outlinePts=[list(q) for q in f.outline], roofs=f.roofs,
                           marks=[dict(text=t, x=x, y=y) for t, x, y in f.marks], entryRoute=getattr(f, 'entry', []),
                           walls=[[list(p) for p in w] for w in f.walls], glass=[[list(p) for p in g] for g in f.glass],
                           rampRails=rails, rampArrows=arrows))

plan = dict(source='Plantas de 2012 (Souza, UFRN), figuras 9 a 11; traçado em pixels da figura do térreo',
            units='px da figura de 2012', viewBox=VIEWBOX, world=WORLD, entrances=ENTRANCES,
            rampFoot=list(foot), rampLoop=[list(q) for q in loop], floors=out_floors)
(ROOT / 'app/data/principal-plan.json').write_text(json.dumps(plan, ensure_ascii=False, indent=1) + '\n')
sys.path.insert(0, str(ROOT / 'scripts'))
from plan_styles import sheet  # noqa: E402
svg = sheet(json.loads((ROOT / 'app/data/principal-plan.json').read_text()), 'clara')
for target in ['public/maps/bloco-principal.svg', 'maps/bloco-principal.svg']:
    (ROOT / target).write_text(svg)
print('Planta de 2012: três andares gerados.')
