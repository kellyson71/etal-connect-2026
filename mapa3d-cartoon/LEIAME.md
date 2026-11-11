# Mapa 3D em estilo de maquete (teste)

Cópia de `mapa3d/` para testar uma aparência mais próxima do mapa do app. Abrir: `python3 mapa3d/servir.py` e depois
http://127.0.0.1:8772/mapa3d-cartoon/ (recarrega sozinho quando um arquivo muda). Nada daqui entra no app.

O que muda em relação a `mapa3d/`:

- `src/estilo.js`: no modo Evento o campus inteiro fica num tom neutro claro, sem texturas, e só as partes do evento têm
  cor: bloco principal verde, auditório e entrada azuis, cantina mel, pátio verde claro. No modo Campus voltam as cores
  e texturas do modelo realista. Isolar o prédio usa a neblina da cena (o campus some no fundo, sem trocar material).
- `src/interior.js`: o bloco principal como maquete de orientação: lajes, corredores, salas em blocos baixos com o
  número em cima, escada e rampa à mostra, andares afastados 9 m um do outro (representação, não medida).
- `src/viagem.js`: a rota em quatro atos, como no mapa original: linha da portaria até a entrada; o campus some e o
  bloco aparece aberto em andares, visto de longe; a linha anda pelo térreo e sobe pela escada ou rampa com a câmera
  parada; a câmera desce para o andar de destino e a sala sobe em verde. A câmera olha sempre do lado da entrada e só
  aproxima, sem girar. Cerca de 12 s para o 1º andar; "Ver destino" pula, "Repetir" refaz.
- `src/interface.js` e `interface.css`: busca, modos, andares e cartão na cor do app; etiquetas do evento em pílulas
  coloridas (Bloco principal, Auditório, Cantina, Pátio, Obelisco).

Rotas (`src/rotas.js`, igual em `mapa3d/`): a porta de cada sala vem da ligação `zoneId` da planta; sem ligação, vale a
porta mais próxima, como no mapa original. Entradas e portas ligam ao ponto de corredor mais próximo. As 56 salas
numeradas têm rota. Testes: `node --test mapa3d/tests/rotas.test.mjs`.

Para conferir um instante da viagem no console: `MAPA3D.viagem.congelar(0.5)` (0 a 1) e `MAPA3D.viagem.congelar(null)`.
