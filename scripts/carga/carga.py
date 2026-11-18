"""Teste de carga do ETAL Connect: simula a abertura do evento com centenas de pessoas ao mesmo tempo.

    scripts/carga/rodar-local.sh --pessoas 700 --chegada 60          # tudo local: PostgreSQL, SUAP de mentira e API
    backend/.venv/bin/python scripts/carga/carga.py --api URL ...    # contra uma API de teste já no ar

Só roda contra um ambiente de teste: a API precisa aceitar a entrada de teste (ETAL_LOGIN_DEV=1), que produção não
tem. Cada pessoa simulada faz o que o app faz na abertura:
  abre o app (programação e avisos) → entra (pelo SUAP com senha, ou pela entrada de teste) e tenta de novo quando a
  fila do SUAP está cheia, como o app → perfil → fica ouvindo o ao vivo → credencia → salva 3 atividades → registra
  presença numa atividade → abre as publicações (10% publicam) → depois de um tempo, confere as publicações de novo.
No fim, a organização manda um aviso e o teste mede quantos celulares receberam e em quanto tempo.

Opções principais:
  --pessoas N       quantas pessoas (padrão 700)
  --chegada S       em quantos segundos elas chegam (padrão 60; 0 = todas no mesmo instante)
  --entrada senha|dev   senha: passa pela fila do SUAP (precisa do SUAP de mentira); dev: entrada de teste
  --ips N           de quantos endereços de rede (padrão 1: todo mundo atrás do mesmo Wi-Fi, o pior caso dos tetos)
  --json ARQ        salva o resultado em JSON
"""
import argparse
import asyncio
import json
import random
import resource
import statistics
import time
from collections import Counter, defaultdict

import httpx

med: dict[str, list[tuple[float, int]]] = defaultdict(list)  # passo → [(ms, situação)]
login: list[dict] = []
avisos_recebidos: dict[int, float] = {}
parar = asyncio.Event()
prontos = [0]  # pessoas que terminaram o roteiro (ou desistiram de entrar)


def pct(v, p):
    if not v:
        return None
    v = sorted(v)
    return round(v[min(len(v) - 1, int(len(v) * p))], 1)


async def medir(nome, coro):
    t0 = time.perf_counter()
    try:
        r = await coro
        s = r.status_code
    except httpx.HTTPError as e:
        r, s = None, f'erro:{type(e).__name__}'
    med[nome].append(((time.perf_counter() - t0) * 1000, s))
    return r


async def ouvir(c: httpx.AsyncClient, i: int, aviso_em: dict):
    """Fica com o ao vivo aberto, como o app; anota quando o aviso da organização chega."""
    try:
        async with c.stream('GET', '/api/ao-vivo', timeout=httpx.Timeout(10, read=None)) as r:
            med['ao-vivo (abrir)'].append((0, r.status_code))
            async for linha in r.aiter_lines():
                if linha.startswith('event: aviso') and 't' in aviso_em:
                    avisos_recebidos[i] = time.perf_counter() - aviso_em['t']
                if parar.is_set():
                    break
    except (httpx.HTTPError, asyncio.CancelledError):
        pass


async def pessoa(i, a, qrs, ativs, salvaveis, aviso_em, ouvintes):
    await asyncio.sleep(a.chegada * random.random())
    ip = f'10.{i % a.ips // 65536}.{i % a.ips // 256 % 256}.{i % a.ips % 256}'
    c = httpx.AsyncClient(base_url=a.api, headers={'X-Forwarded-For': ip}, timeout=40)
    try:
        await medir('programacao', c.get('/api/programacao'))
        await medir('avisos', c.get('/api/avisos'))
        matricula = f'2026{i:06d}'
        t0 = time.perf_counter()
        tent, ok, ultima = 0, False, None
        if a.entrada == 'senha' and random.random() < 0.05:  # alguns erram a senha primeiro
            await medir('login (senha errada)', c.post('/api/auth/suap/senha', json={'matricula': matricula, 'senha': 'errada'}))
        while tent < 9:
            tent += 1
            if a.entrada == 'senha':
                r = await medir('login', c.post('/api/auth/suap/senha', json={'matricula': matricula, 'senha': 'certa'}))
            else:
                r = await medir('login', c.post('/api/auth/dev', json={'nome': f'Pessoa {i}', 'matricula': matricula}))
            ultima = r.status_code if r is not None else 'erro'
            if r is not None and r.status_code == 200:
                ok = True
                break
            if r is not None and r.status_code in (429, 503):
                await asyncio.sleep(min(15, int(r.headers.get('Retry-After') or 4)))
                continue
            break
        login.append({'ok': ok, 's': time.perf_counter() - t0, 'tentativas': tent, 'ultima': ultima})
        if not ok:
            prontos[0] += 1
            return
        await medir('eu', c.get('/api/eu'))
        ouvintes.append(asyncio.create_task(ouvir(c, i, aviso_em)))
        await medir('presenca (credenciar)', c.post('/api/presenca', json={'qr': qrs[None]}))
        for aid in random.sample(salvaveis, 3):
            await medir('agenda (salvar)', c.post(f'/api/eu/agenda/{aid}'))
        await medir('presenca (atividade)', c.post('/api/presenca', json={'qr': qrs[random.choice(ativs)]}))
        r = await medir('publicacoes', c.get('/api/publicacoes'))
        versao = r.json().get('versao') if r is not None and r.status_code == 200 else None
        if random.random() < 0.10:
            await medir('publicar', c.post('/api/publicacoes', json={'texto': f'Chegando no ETAL! ({i})'}))
        await asyncio.sleep(random.uniform(5, 20))
        await medir('publicacoes (de novo)', c.get('/api/publicacoes' + (f'?versao={versao}' if versao else '')))
        prontos[0] += 1
        await parar.wait()
    except Exception as e:  # noqa: BLE001 — conta como pronto e registra
        med['falha no roteiro'].append((0, type(e).__name__))
        prontos[0] += 1
    finally:
        await c.aclose()


async def principal(a):
    try:
        resource.setrlimit(resource.RLIMIT_NOFILE, (resource.getrlimit(resource.RLIMIT_NOFILE)[1],) * 2)
    except (ValueError, OSError):
        pass
    org = httpx.AsyncClient(base_url=a.api, headers={'X-Forwarded-For': '10.255.255.254'}, timeout=30)
    r = await org.post('/api/auth/dev', json={'nome': 'Equipe (carga)', 'matricula': 'org-carga', 'organizacao': True})
    if r.status_code != 200:
        raise SystemExit('A API não aceita a entrada de teste (ETAL_LOGIN_DEV=1). O teste de carga só roda em ambiente de teste.')
    lista = (await org.get('/api/org/qrs/lista')).json()
    qrs = {q['id']: q['token'] for q in lista}
    ativs = [q['id'] for q in lista if q['id']]
    # minicurso não se salva no app (a inscrição é no SUAP): a agenda usa as outras atividades
    prog = (await org.get('/api/programacao')).json()['sessions']
    salvaveis = [x['id'] for x in prog if x['type'] not in ('Minicurso', 'Oficina')]
    aviso_em: dict = {}
    ouvintes: list = []
    print(f'{a.pessoas} pessoas chegando em {a.chegada} s, entrada por {a.entrada}, {a.ips} endereço(s) de rede…', flush=True)
    t0 = time.perf_counter()
    tarefas = [asyncio.create_task(pessoa(i, a, qrs, ativs, salvaveis, aviso_em, ouvintes)) for i in range(a.pessoas)]

    async def acompanhar():
        while not parar.is_set():
            await asyncio.sleep(10)
            s = (await org.get('/api/org/sistema')).json()
            print(f'  {time.perf_counter() - t0:5.0f} s · entraram {sum(x["ok"] for x in login)}/{a.pessoas}'
                  f' · req/min {s["requisicoes"]["ultimo_minuto"]} · p95 {s["requisicoes"]["p95_ms"]} ms'
                  f' · SUAP {s["suap"]["em_uso"]}/{s["suap"]["simultaneos"]} (esperando {s["suap"]["esperando"]})'
                  f' · ao vivo {s["ao_vivo"]["conectados"]}', flush=True)
    vigia = asyncio.create_task(acompanhar())
    # espera todo mundo terminar o roteiro (quem entrou fica parado no parar.wait())
    while prontos[0] < a.pessoas:
        await asyncio.sleep(1)
        if time.perf_counter() - t0 > a.chegada + 600:
            print('  tempo esgotado esperando as pessoas terminarem', flush=True)
            break
    duracao = time.perf_counter() - t0
    await asyncio.sleep(2)
    conectados = sum(1 for t in ouvintes if not t.done())
    aviso_em['t'] = time.perf_counter()
    await org.post('/api/org/avisos', json={'titulo': 'Teste de carga', 'texto': 'Aviso para todos os celulares.'})
    await asyncio.sleep(8)
    sistema = (await org.get('/api/org/sistema')).json()
    parar.set()
    vigia.cancel()
    for t in ouvintes:
        t.cancel()
    await asyncio.gather(*tarefas, *ouvintes, return_exceptions=True)
    await org.aclose()

    res = {'pessoas': a.pessoas, 'chegada_s': a.chegada, 'entrada': a.entrada, 'ips': a.ips, 'duracao_s': round(duracao, 1),
           'login': {'entraram': sum(x['ok'] for x in login), 'nao_entraram': sum(not x['ok'] for x in login),
                     'ultima_resposta_de_quem_nao_entrou': dict(Counter(str(x['ultima']) for x in login if not x['ok'])),
                     'tempo_ate_entrar_s': {'mediana': pct([x['s'] for x in login if x['ok']], .5),
                                            'p95': pct([x['s'] for x in login if x['ok']], .95),
                                            'max': pct([x['s'] for x in login if x['ok']], 1)},
                     'precisaram_tentar_de_novo': sum(x['tentativas'] > 1 for x in login if x['ok'])},
           'aviso': {'ouvindo': conectados, 'receberam': len(avisos_recebidos),
                     'tempo_s': {'p50': pct(list(avisos_recebidos.values()), .5), 'p95': pct(list(avisos_recebidos.values()), .95)}},
           'passos': {}, 'servidor': {'memoria_pico_mb': sistema['processo']['memoria_pico_mb'],
                                      'erros_5xx_10min': sistema['requisicoes']['erros_5xx'], 'banco': sistema['banco']}}
    for nome, v in med.items():
        tempos = [ms for ms, _ in v]
        res['passos'][nome] = {'n': len(v), 'situacoes': dict(Counter(str(s) for _, s in v)),
                               'p50_ms': pct(tempos, .5), 'p95_ms': pct(tempos, .95), 'p99_ms': pct(tempos, .99),
                               'max_ms': pct(tempos, 1), 'media_ms': round(statistics.fmean(tempos), 1) if tempos else None}
    return res


def imprimir(r):
    lg = r['login']
    print(f"\nResultado ({r['pessoas']} pessoas em {r['chegada_s']} s, entrada por {r['entrada']}, {r['ips']} endereço(s))")
    print(f"  entraram: {lg['entraram']} de {r['pessoas']}" + (f" · não entraram: {lg['nao_entraram']} {lg['ultima_resposta_de_quem_nao_entrou']}" if lg['nao_entraram'] else ''))
    t = lg['tempo_ate_entrar_s']
    print(f"  tempo até entrar: mediana {t['mediana']} s · 95% até {t['p95']} s · pior {t['max']} s · {lg['precisaram_tentar_de_novo']} precisaram tentar de novo")
    av = r['aviso']
    print(f"  aviso ao vivo: {av['receberam']} de {av['ouvindo']} celulares ouvindo · metade em {av['tempo_s']['p50']} s · 95% em {av['tempo_s']['p95']} s")
    print(f"  servidor: memória (pico) {r['servidor']['memoria_pico_mb']} MB · erros 5xx {r['servidor']['erros_5xx_10min']} · banco {r['servidor']['banco']}")
    print(f"\n  {'passo':26} {'n':>5} {'p50':>8} {'p95':>8} {'p99':>8} {'pior':>8}  situações")
    for nome, p in r['passos'].items():
        print(f"  {nome:26} {p['n']:>5} {p['p50_ms'] or 0:>6.0f}ms {p['p95_ms'] or 0:>6.0f}ms {p['p99_ms'] or 0:>6.0f}ms {p['max_ms'] or 0:>6.0f}ms  {p['situacoes']}")


if __name__ == '__main__':
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--api', default='http://127.0.0.1:8098')
    ap.add_argument('--pessoas', type=int, default=700)
    ap.add_argument('--chegada', type=float, default=60)
    ap.add_argument('--entrada', choices=['senha', 'dev'], default='senha')
    ap.add_argument('--ips', type=int, default=1)
    ap.add_argument('--json')
    a = ap.parse_args()
    r = asyncio.run(principal(a))
    imprimir(r)
    if a.json:
        with open(a.json, 'w') as f:
            json.dump(r, f, ensure_ascii=False, indent=2)
