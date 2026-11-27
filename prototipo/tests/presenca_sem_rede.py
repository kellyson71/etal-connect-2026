"""Presença lida sem internet, de ponta a ponta: sobe a API (SQLite temporário, entrada de teste) e o app, entra,
lê QRs com a rede cortada e confere o que acontece quando ela volta.

    python3 prototipo/tests/presenca_sem_rede.py

Usa o Python do backend (backend/.venv, ou o da variável PYTHON_API) para a API, e o Chrome do sistema ou o Chromium
do Playwright para o navegador. Os casos:
  1. QR do ETAL lido sem rede fica guardado (mesmo fechando o app) e NÃO conta como presença;
  2. a rede volta: o app envia sozinho, a presença conta e fica marcada como adiada no banco;
  3. o servidor recusa a leitura guardada (409): sai da fila e avisa;
  4. o servidor fora do ar (503): a leitura continua guardada para depois;
  5. QR que não é do ETAL, lido sem rede, não é guardado.
"""
import json
import sqlite3
import sys

from playwright.sync_api import sync_playwright

from ambiente_e2e import ENTRAR, ambiente, chrome

PEND = 'etal-presencas-pendentes:'


def main():
    falhas = []

    def conferir(ok, nome):
        print(('ok    ' if ok else 'FALHA ') + nome)
        if not ok:
            falhas.append(nome)

    with ambiente() as amb:
        base, banco = amb.app, amb.banco
        with sync_playwright() as p:
            nav = p.chromium.launch(executable_path=chrome()) if chrome() else p.chromium.launch()
            ctx = nav.new_context(viewport={'width': 412, 'height': 860}, service_workers='block')
            pg = ctx.new_page()
            erros = []
            pg.on('pageerror', lambda e: erros.append(str(e)[:200]))
            pg.goto(base + '/')
            pg.wait_for_timeout(800)
            # entrada de teste como organização, para pegar os QRs assinados da lista da equipe
            pg.evaluate(ENTRAR, [amb.api, 'Pessoa de Teste', 'teste-sem-rede', True])
            qrs = pg.evaluate("async (api) => (await fetch(api + '/api/org/qrs/lista', {credentials: 'include'})).json()",
                              amb.api)
            ativ = [q for q in qrs if q['id']]
            a1, a2, a3 = ativ[0], ativ[1], ativ[2]

            def pendentes():
                return pg.evaluate("""(pref) => Object.keys(localStorage).filter((k) => k.includes(pref))
                    .flatMap((k) => JSON.parse(localStorage[k] || '[]'))""", PEND)

            def presentes():
                return pg.evaluate("""async (api) =>
                    (await (await fetch(api + '/api/eu', {credentials: 'include'})).json()).present""", amb.api)

            def ler(token):
                """Abre o app como se viesse do link do QR (o app registra a leitura depois de entrar)."""
                pg.evaluate("(t) => sessionStorage.setItem('etal-qr', t)", token)
                pg.reload()
                pg.wait_for_timeout(2200)

            def abrir_atividade(id_):
                """Toca num cartão da atividade, como na agenda (os atalhos ?tela= são só da demonstração)."""
                pg.evaluate("""(id) => { const b = document.createElement('button'); b.dataset.go = 'activity';
                    b.dataset.id = id; b.id = 'abrir-teste'; document.querySelector('.page').append(b); }""", id_)
                pg.evaluate("() => document.getElementById('abrir-teste').click()")
                pg.wait_for_timeout(1200)

            def voltar_rede():
                pg.evaluate("() => window.dispatchEvent(new Event('online'))")
                pg.wait_for_timeout(2600)

            # 1. sem rede para a presença: a leitura fica guardada e não vale
            pg.route('**/api/presenca', lambda r: r.abort('internetdisconnected'))
            ler(a1['token'])
            pend = pendentes()
            conferir(len(pend) == 1 and pend[0]['q'] == a1['id'] and pend[0].get('lidoEm'),
                     'QR do ETAL lido sem rede fica guardado com a hora da leitura')
            conferir(a1['id'] not in presentes(), 'leitura guardada ainda não conta como presença')
            abrir_atividade(a1['id'])
            conferir(pg.locator('.leitura-pendente').count() > 0 or 'Leitura guardada' in pg.content(),
                     'a tela da atividade avisa que a leitura ainda não vale')

            # fechar o app e abrir de novo (ainda sem rede): a leitura continua guardada
            pg.close()
            pg = ctx.new_page()
            pg.on('pageerror', lambda e: erros.append(str(e)[:200]))
            pg.route('**/api/presenca', lambda r: r.abort('internetdisconnected'))
            pg.goto(base + '/')
            pg.wait_for_timeout(2800)
            conferir(len(pendentes()) == 1, 'fechar e abrir o app não perde a leitura guardada')

            # 2. a rede volta: envia sozinho, conta, e fica marcada como adiada
            pg.unroute('**/api/presenca')
            voltar_rede()
            conferir(not pendentes(), 'com a rede de volta a fila esvazia')
            conferir(a1['id'] in presentes(), 'a presença guardada passa a contar')
            with sqlite3.connect(banco) as db:
                via = db.execute('select via from presencas where atividade_id = ?', (a1['id'],)).fetchone()
            conferir(via and via[0] == 'qr-adiado', 'no banco a presença fica marcada como adiada')

            # 3. o servidor recusa: a leitura sai da fila e o app avisa
            pg.route('**/api/presenca', lambda r: r.abort('internetdisconnected'))
            ler(a2['token'])
            conferir(len(pendentes()) == 1, 'segunda leitura sem rede guardada')
            pg.unroute('**/api/presenca')
            pg.route('**/api/presenca', lambda r: r.fulfill(
                status=409, content_type='application/json',
                body=json.dumps({'detail': 'A leitura foi feita fora da atividade.'})))
            voltar_rede()
            conferir(not pendentes(), 'leitura recusada sai da fila (não tenta para sempre)')
            conferir('Leitura não valeu' in pg.locator('#notif').inner_text(), 'o app avisa que a leitura não valeu')
            pg.unroute('**/api/presenca')
            conferir(a2['id'] not in presentes(), 'leitura recusada não vira presença')

            # 4. servidor fora do ar: continua guardada
            pg.route('**/api/presenca', lambda r: r.abort('internetdisconnected'))
            ler(a3['token'])
            pg.unroute('**/api/presenca')
            pg.route('**/api/presenca', lambda r: r.fulfill(status=503, body='{}', content_type='application/json'))
            voltar_rede()
            conferir(len(pendentes()) == 1, 'com o servidor fora do ar a leitura continua guardada')
            pg.unroute('**/api/presenca')
            voltar_rede()
            conferir(not pendentes() and a3['id'] in presentes(), 'e é enviada quando o servidor volta')

            # 5. QR que não é do ETAL não é guardado
            pg.route('**/api/presenca', lambda r: r.abort('internetdisconnected'))
            ler('https://exemplo.com/qualquer-coisa')
            ler('texto.qualquer')
            conferir(not pendentes(), 'QR que não é do ETAL, lido sem rede, não é guardado')
            pg.unroute('**/api/presenca')

            conferir(not erros, 'sem erro de JavaScript' + (f': {erros[:3]}' if erros else ''))
            nav.close()
    if falhas:
        print(f'\n{len(falhas)} falha(s)')
        sys.exit(1)
    print('\npresença sem rede: tudo certo')


if __name__ == '__main__':
    main()
