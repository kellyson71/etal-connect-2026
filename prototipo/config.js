/* Onde está a API do ETAL Connect.
   api: null → só dados de exemplo (protótipo, como antes).
   api: ''   → mesma origem do app (produção, atrás do Caddy; o deploy troca este arquivo).
   api: 'http://127.0.0.1:8000' → API local em desenvolvimento. */
window.ETAL_CONFIG = window.ETAL_CONFIG || { api: null };
