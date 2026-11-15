"""Publicações com o servidor, de ponta a ponta: três pessoas em navegadores separados (Ana, Bia e a organização).

    python3 prototipo/tests/publicacoes_servidor.py

Confere: sem as publicações de exemplo; Ana publica com foto e a Bia vê sem recarregar (ao vivo); curtida e
comentário chegam para a Ana; a Bia denuncia, a organização vê a denúncia e tira do ar, e o post some da tela da Bia;
mensagem no chat geral; nenhum erro de JavaScript.
"""
import base64
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

from ambiente_e2e import ENTRAR, ambiente, chrome

# PNG 1×1 laranja
PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC')
TEXTO = 'Primeira publicação de verdade no ETAL'


def main():
    falhas = []

    def conferir(ok, nome):
        print(('ok    ' if ok else 'FALHA ') + nome)
        if not ok:
            falhas.append(nome)

    with ambiente() as amb, tempfile.TemporaryDirectory() as pasta, sync_playwright() as p:
        foto = Path(pasta) / 'foto.png'
        foto.write_bytes(PNG)
        nav = p.chromium.launch(executable_path=chrome()) if chrome() else p.chromium.launch()
        erros = []

        def pessoa(nome, matricula, org=False):
            ctx = nav.new_context(viewport={'width': 412, 'height': 860}, service_workers='block')
            pg = ctx.new_page()
            pg.on('pageerror', lambda e: erros.append(f'{nome}: {str(e)[:200]}'))
            pg.goto(amb.app + '/')
            pg.wait_for_timeout(600)
            pg.evaluate(ENTRAR, [amb.api, nome, matricula, org])
            return pg

        def api(pg, caminho, metodo='GET', corpo=None):
            return pg.evaluate("""async ([url, metodo, corpo]) => {
                const r = await fetch(url, {method: metodo, credentials: 'include',
                  headers: {'Content-Type': 'application/json'}, body: corpo ? JSON.stringify(corpo) : undefined});
                return r.json(); }""", [amb.api + caminho, metodo, corpo])

        def abrir(pg, tela):
            """Abre uma tela do app como um toque num link interno."""
            pg.evaluate("""(t) => { const b = document.createElement('button'); b.dataset.go = t; b.id = 'abrir-teste';
                document.querySelector('.page').append(b); b.click(); }""", tela)
            pg.wait_for_timeout(900)

        def esperar_texto(pg, texto, sim=True, ms=6000, onde='.page:not(.leaving)'):
            """Texto visível na tela (fora de campos de texto, para não contar o rascunho)."""
            alvo = pg.locator(onde).get_by_text(texto).first
            try:
                alvo.wait_for(state='visible' if sim else 'detached', timeout=ms)
                return True
            except Exception:
                return False

        org = pessoa('Equipe ETAL', 'org-teste', org=True)
        recepcao = next(q['token'] for q in api(org, '/api/org/qrs/lista') if q['id'] is None)
        ana = pessoa('Ana Teste', 'ana-teste')
        bia = pessoa('Bia Teste', 'bia-teste')
        for pg in (ana, bia, org):
            api(pg, '/api/presenca', 'POST', {'qr': recepcao})
            pg.reload()
            pg.wait_for_timeout(1500)
            pg.click('[data-act="tab"][data-tab="community"]')
            pg.wait_for_timeout(1200)

        conferir('Ana Beatriz' not in ana.content(), 'com servidor, as publicações de exemplo não aparecem')

        # Ana publica com foto
        ana.click('.community-start-text')
        ana.wait_for_timeout(700)
        ana.fill('#community-post', TEXTO)
        ana.set_input_files('#community-image', str(foto))
        ana.wait_for_selector('.community-upload img', timeout=5000)
        ana.click('.compose-submit')
        conferir(esperar_texto(ana, TEXTO, onde='.community-post'), 'Ana publica e vê a publicação no feed')
        src = ana.evaluate("""() => [...document.querySelectorAll('.community-post img')].map((i) => i.src)
            .find((s) => s.includes('/api/publicacoes/fotos/'))""")
        conferir(bool(src), 'a foto é servida pela API')

        # Bia vê sem recarregar, com a foto carregada
        conferir(esperar_texto(bia, TEXTO), 'Bia vê a publicação da Ana ao vivo, sem recarregar')
        bia.wait_for_timeout(800)
        larg = bia.evaluate("""() => { const i = [...document.querySelectorAll('.community-post img')]
            .find((x) => x.src.includes('/api/publicacoes/fotos/')); return i ? i.naturalWidth : 0; }""")
        conferir(larg > 0, 'a foto abre no celular da Bia')

        # curtida e comentário
        post_bia = bia.locator('.community-post', has_text=TEXTO)
        post_bia.locator('[data-act="community-like"]').click()
        bia.wait_for_timeout(600)
        conferir(post_bia.locator('[data-act="community-like"] span').inner_text() == '1', 'curtida conta na hora')
        post_bia.locator('[data-go="communityPost"]').click()
        bia.wait_for_timeout(900)
        bia.fill('#community-reply', 'Que legal, Ana!')
        bia.click('.community-reply button[type="submit"]')
        conferir(esperar_texto(bia, 'Que legal, Ana!'), 'Bia comenta')
        conferir(esperar_texto(ana, '1 comentário'), 'o comentário chega para a Ana ao vivo')
        v = api(ana, '/api/publicacoes')
        conferir(len(v['likes'].get(v['posts'][0]['id'], [])) == 1, 'a curtida ficou no servidor')

        # denúncia → organização tira do ar → some para a Bia
        bia.go_back()
        bia.click('[data-act="tab"][data-tab="community"]')
        bia.wait_for_timeout(900)
        bia.locator('.community-post', has_text=TEXTO).locator('[data-act="community-report"]').click()
        bia.wait_for_timeout(600)
        bia.select_option('.social-report select[name="reason"]', 'Ofensa ou assédio')
        bia.click('.social-report button[type="submit"]')
        bia.wait_for_timeout(1200)
        abrir(org, 'orgCommunity')
        conferir(esperar_texto(org, 'Ofensa ou assédio'), 'a organização vê a denúncia')
        org.locator('.social-mod-card', has_text=TEXTO).locator('[data-act="social-mod"][data-action="hide"]').click()
        conferir(esperar_texto(bia, TEXTO, sim=False, ms=8000), 'a publicação tirada do ar some da tela da Bia')
        hist = api(org, '/api/publicacoes')['audit']
        conferir(hist and hist[0]['action'] == 'hide' and hist[0]['by'] == 'Equipe ETAL', 'a moderação fica no histórico')

        # chat geral
        bia.click('[data-act="community-mode"][data-v="chat"]')
        bia.wait_for_timeout(600)
        bia.fill('#community-message', 'Oi, pessoal do chat!')
        bia.click('.community-chat-form button[type="submit"]')
        bia.wait_for_timeout(1200)
        conferir(any(m['text'] == 'Oi, pessoal do chat!' for m in api(ana, '/api/publicacoes')['messages']),
                 'mensagem do chat vai para o servidor')

        conferir(not erros, 'sem erro de JavaScript' + (f': {erros[:3]}' if erros else ''))
        nav.close()
    if falhas:
        print(f'\n{len(falhas)} falha(s)')
        sys.exit(1)
    print('\npublicações com servidor: tudo certo')


if __name__ == '__main__':
    main()
