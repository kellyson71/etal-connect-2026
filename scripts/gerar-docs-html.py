"""Compatibilidade: gera a documentação visual, incluindo as referências técnicas.

Uso: python3 scripts/gerar-docs-html.py [saida.html]
Sem argumento, atualiza DOCUMENTACAO.html e docs/tecnico/documentacao-tecnica.html.
"""
from pathlib import Path
import runpy
import sys

module = runpy.run_path(str(Path(__file__).with_name('build-documentacao.py')))
module['gerar'](sys.argv[1] if len(sys.argv) > 1 else None)
