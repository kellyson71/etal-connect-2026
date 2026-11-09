"""Exporta as páginas visuais para PDF. Requer Playwright e Chrome locais."""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
with sync_playwright() as p:
    browser = p.chromium.launch(channel='chrome', headless=True)
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    page.goto((ROOT / 'DOCUMENTACAO.html').as_uri(), wait_until='networkidle')
    page.evaluate('document.fonts.ready')
    page.emulate_media(media='print')
    page.pdf(path=str(ROOT / 'docs/ETAL-Connect-documentacao.pdf'),
             print_background=True, prefer_css_page_size=True, tagged=True, outline=True)
    browser.close()
print('docs/ETAL-Connect-documentacao.pdf')
