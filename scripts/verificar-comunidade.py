"""Verifica a comunidade local em um contexto isolado, sem usar o estado do navegador do usuário.

    sh prototipo/rodar.sh
    python3 scripts/verificar-comunidade.py [http://127.0.0.1:8770]
"""
import io
import json
import sys
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright, expect

BASE = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8770'
ROOT = Path(__file__).resolve().parents[1]


def run():
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path='/opt/google/chrome/chrome', args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 390, 'height': 844}, service_workers='block', reduced_motion='reduce')
        errors = []

        def page(person=None):
            target = context.new_page()
            target.on('pageerror', lambda error: errors.append(str(error)))
            if person:
                def data(route):
                    source = (ROOT / 'prototipo/data.js').read_text()
                    route.fulfill(body=source + '\nObject.assign(window.DATA.person,' + json.dumps(person) + ');', content_type='text/javascript')
                target.route('**/data.js', data)
            return target

        def visit(target, query='comunidade-ok'):
            target.goto(f'{BASE}/?tela={query}&moldura')
            expect(target.locator('.page:not(.leaving)')).to_be_visible()
            target.wait_for_timeout(120)

        def mode(target, value):
            target.locator(f'[data-act="community-mode"][data-v="{value}"]').click()
            target.wait_for_timeout(100)

        def report(target, post_id, detail='Revisar este exemplo'):
            target.locator(f'[data-target="post:{post_id}"][data-act="community-report"]').click()
            target.locator('[data-form="community-report"] [name="reason"]').select_option('Spam ou propaganda')
            target.locator('[data-form="community-report"] [name="detail"]').fill(detail)
            target.locator('[data-form="community-report"] button[type="submit"]').click()
            target.wait_for_timeout(450)

        owner = page()
        visit(owner)
        expect(owner.locator('.community-post')).to_have_count(3)
        owner.locator('.social-activity').first.click()
        expect(owner.locator('.page:not(.leaving)')).to_contain_text('Desenvolvimento de aplicações web com React e Next.js')
        owner.locator('.page:not(.leaving) [data-act="back"]').first.click()
        owner.wait_for_timeout(120)
        owner.locator('.social-save').first.click()
        mode(owner, 'saved')
        expect(owner.locator('.community-post')).to_have_count(1)
        owner.reload()
        expect(owner.locator('.social-save.on')).to_have_count(1)
        mode(owner, 'saved')
        owner.locator('.social-save').click()
        expect(owner.locator('.community-post')).to_have_count(0)
        print('PASS: vínculo com atividade e salvos persistentes por participante', flush=True)

        mode(owner, 'wall')
        expect(owner.locator('.social-photo-grid>button')).to_have_count(5)
        owner.locator('[data-community-filter="day"]').select_option('26')
        expect(owner.locator('.social-photo-grid>button')).to_have_count(2)
        owner.locator('[data-community-filter="activity"]').select_option('react-next')
        expect(owner.locator('.social-photo-grid>button')).to_have_count(0)
        owner.locator('[data-community-filter="day"]').select_option('all')
        expect(owner.locator('.social-photo-grid>button')).to_have_count(3)
        owner.locator('.social-photo-grid>button').nth(1).click()
        expect(owner.locator('.gallery-count')).to_have_text('2 / 3')
        owner.locator('.page:not(.leaving) [data-act="back"]').first.click()
        owner.wait_for_timeout(120)
        owner.screenshot(path='/tmp/etal-comunidade-mural.png')
        print('PASS: mural por dia/atividade e abertura na foto escolhida', flush=True)

        mode(owner, 'feed')
        owner.locator('.community-start-text').click()
        owner.locator('#community-post').fill('Projeto <script>alert(1)</script> com @ana')
        owner.locator('.social-mention-hints [data-handle="ana.beatriz"]').click()
        owner.locator('[name="activity"]').select_option('react-native')
        expect(owner.locator('[name="day"]')).to_have_value('26')
        image = io.BytesIO()
        Image.new('RGB', (400, 300), (40, 80, 130)).save(image, 'PNG')
        owner.locator('#community-image').set_input_files([{'name': f'foto-{n}.png', 'mimeType': 'image/png', 'buffer': image.getvalue()} for n in range(2)])
        expect(owner.locator('.community-upload')).to_have_count(2)
        owner.locator('[data-form="community-post"] button[type="submit"]').click()
        owner.wait_for_timeout(150)
        post_id = owner.evaluate('COMMUNITY.read().posts[0].id')
        post = owner.locator('.community-post').first
        expect(post.locator('.gallery-slide')).to_have_count(2)
        expect(post.locator('.community-text img, .community-text script')).to_have_count(0)
        post.locator('.social-mention').click()
        expect(owner.locator('.social-person h2')).to_have_text('Ana Beatriz')
        owner.locator('.page:not(.leaving) [data-act="back"]').first.click()
        owner.wait_for_timeout(120)
        owner.locator('.community-post').first.locator('[data-go="communityPost"]').click()
        owner.locator('#community-reply').fill('Uma ideia para @julia')
        owner.locator('.social-mention-hints [data-handle="julia.costa"]').click()
        owner.locator('[data-form="community-comment"] button[type="submit"]').click()
        expect(owner.locator('.community-comment .social-mention')).to_have_count(1)
        comment_id = owner.evaluate('(id)=>COMMUNITY.read().comments[id][0].id', post_id)
        owner.locator('.page:not(.leaving) [data-act="back"]').first.click()
        owner.wait_for_timeout(120)
        mode(owner, 'chat')
        owner.locator('#community-message').fill('Olá @ana.beatriz')
        owner.locator('[data-form="community-message"] button[type="submit"]').click()
        expect(owner.locator('.community-message.mine .social-mention')).to_have_count(1)
        print('PASS: múltiplas fotos, marcações em post/comentário/chat e escape de HTML', flush=True)

        guest = page({'id': 'participante-teste', 'name': 'Pessoa de Teste', 'first': 'Pessoa', 'initials': 'PT', 'source': 'visitante'})
        visit(guest)
        guest.locator('.community-start-text').click()
        guest.locator('#community-post').fill('Olá @maria.clara.fernandes, veja este projeto!')
        guest.locator('[data-form="community-post"] button[type="submit"]').click()
        guest.wait_for_timeout(150)
        mode(owner, 'feed')
        expect(owner.locator('[data-v="mentions"]')).to_contain_text('1')
        mode(owner, 'mentions')
        expect(owner.locator('.social-mention-row')).to_have_count(1)
        expect(owner.locator('[data-v="mentions"]')).to_have_text('Menções')
        owner.locator('.social-mention-row').click()
        expect(owner.locator('.community-text').first).to_contain_text('veja este projeto')
        print('PASS: menção recebida entre participantes e atualização entre abas', flush=True)

        report(guest, 'demo-encontro', '<script>detalhe</script>')
        report(guest, 'demo-encontro')
        expect(guest.locator('#toast')).to_contain_text('já denunciou')
        guest.locator('[aria-label="Fechar denúncia"]').click()
        guest.wait_for_timeout(450)
        moderator = page()
        moderator.goto(BASE + '/admin.html#comunidade')
        card = moderator.locator('[data-mod-target="post:demo-encontro"]')
        expect(card).to_have_count(1)
        expect(card.locator('script')).to_have_count(0)
        card.locator('[data-mod-note]').fill('Ocultado para revisar o exemplo')
        card.locator('[data-action="hide"]').click()
        expect(guest.locator('[data-target="post:demo-encontro"][data-act="community-report"]')).to_have_count(0)
        mode(guest, 'wall')
        expect(guest.locator('.social-photo-grid>button')).to_have_count(4)
        moderator.locator('[data-filter="hidden"]').click()
        moderator.locator('[data-target="post:demo-encontro"][data-action="restore"]').click()
        expect(guest.locator('.social-photo-grid>button')).to_have_count(7)
        moderator.locator('[data-filter="all"]').click()
        moderator.locator(f'[data-target="comment:{post_id}:{comment_id}"][data-action="hide"]').click()
        moderator.locator('[data-target="message:demo-chat-oi"][data-action="hide"]').click()
        visit(owner, 'moderacao')
        owner.locator('[data-filter="hidden"]').click()
        expect(owner.locator('.social-mod-card')).to_have_count(2)
        owner.locator(f'[data-target="comment:{post_id}:{comment_id}"][data-action="restore"]').click()
        owner.locator('[data-target="message:demo-chat-oi"][data-action="restore"]').click()
        expect(owner.locator('.social-mod-card')).to_have_count(0)
        mode(guest, 'feed')
        report(guest, 'demo-projeto')
        moderator.locator('[data-filter="pending"]').click()
        moderator.locator('[data-target="post:demo-projeto"][data-action="dismiss"]').click()
        expect(guest.locator('[data-target="post:demo-projeto"][data-act="community-report"]')).to_have_count(1)
        moderator.locator('[data-filter="history"]').click()
        expect(moderator.locator('.social-mod-card')).to_have_count(7)
        print('PASS: denúncia sem duplicação, moderação app/painel, ocultar/restaurar e histórico', flush=True)

        guest.evaluate("""() => { const button=document.createElement('button'); button.textContent='Ação de teste'; Object.assign(button.dataset,{act:'social-mod',target:'post:demo-projeto',action:'hide'}); document.querySelector('.page:not(.leaving)').append(button); }""")
        guest.get_by_text('Ação de teste', exact=True).click()
        expect(guest.locator('#toast')).to_have_text('Esta ação é da organização.')
        assert not guest.evaluate("COMMUNITY.hidden(COMMUNITY.read(),'post:demo-projeto')")
        visit(guest, 'comunidade')
        guest.locator('[data-act="community-report"]').first.click()
        expect(guest.locator('[data-form="community-report"]')).to_have_count(0)
        print('PASS: bloqueios de moderação para participante e denúncia antes do QR', flush=True)

        visit(owner)
        for width in (320, 390, 768):
            owner.set_viewport_size({'width': width, 'height': 844})
            for value in ('feed', 'wall', 'saved', 'mentions'):
                mode(owner, value)
                assert owner.locator('.page:not(.leaving)').evaluate('(e)=>e.scrollWidth<=e.clientWidth'), (width, value)
                assert owner.locator('#tabbar').evaluate('(e)=>e.scrollWidth<=e.clientWidth'), width
        assert not errors, errors
        print('PASS: larguras 320/390/768 em todas as abas, sem erros JavaScript', flush=True)
        browser.close()


if __name__ == '__main__':
    run()
