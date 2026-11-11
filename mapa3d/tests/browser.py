"""Fluxo local. Executar com o servidor mapa3d/servir.py na porta 8772."""
from playwright.sync_api import sync_playwright
import os
BASE=os.environ.get('ETAL_TEST_URL','http://127.0.0.1:8772')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROME_BIN','/opt/google/chrome/chrome'),headless=True,args=['--no-sandbox','--enable-unsafe-swiftshader'])
 ctx=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce',service_workers='block')
 page=ctx.new_page(); errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/mapa3d/',wait_until='domcontentloaded');page.wait_for_function('window.MAPA3D?.ready',timeout=60000)
 for level,zone in [(0,'napne'),(1,'sala-nadic'),(2,'coord-ads')]:
  assert page.evaluate('([l,z])=>CampusNovo.route(l,z,"rampa")',[level,zone]);page.wait_for_function('MAPA3D.viagem.estado()?.fim');assert page.locator('#pular').is_hidden()
 page.locator('#flat').click();assert page.locator('#planta2d').is_visible();assert page.locator('#planta2d polygon').count()>10
 page.screenshot(path='/tmp/etal-flat-fixed.png')
 page.locator('#flat').click();page.evaluate("CampusNovo.route(1,'sala-nadic','rampa')");page.wait_for_function('MAPA3D.viagem.estado()?.fim');page.screenshot(path='/tmp/etal-final-mobile.png')
 page.locator('#busca').fill('NADIC');page.locator('#resultados button').first.click();assert 'NADIC' in page.locator('#descricao').inner_text()
 page.locator('[data-modo="andares"]').click();assert page.evaluate('MAPA3D.scene.getObjectByName("nivel-2").position.y')==18
 # Full activity -> map -> back, without leaving the app or losing the activity.
 page.goto(BASE+'/prototipo/?tela=atividade',wait_until='domcontentloaded');page.locator('[data-act="openmap"]').first.click(timeout=30000)
 frame=page.frame_locator('.mapa-novo iframe');frame.locator('#titulo').filter(has_text='React Native').wait_for(timeout=60000)
 frame.locator('#voltar').click();page.locator('.mapa-novo').wait_for(state='detached');assert page.locator('[data-act="openmap"]').first.is_visible()
 assert not errors,errors
 print('OK: 3 andares, rampa, movimento reduzido, planta 2D, busca, andares separados, atividade → mapa → voltar; sem erros JS.',flush=True)
 browser.close()
