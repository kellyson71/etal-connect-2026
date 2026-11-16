#!/bin/sh
# Rodar no servidor antes de instalar: mostra o que já existe e o que o ETAL precisa. Só lê, não muda nada.
#   sh diagnostico.sh [dominio] [porta]
DOMINIO=${1:-etal.nadic.ifrn.edu.br}
PORTA=${2:-8080}
ok() { printf '  [ok]  %s\n' "$1"; }
falta() { printf '  [!!]  %s\n' "$1"; }
echo "== Sistema"; uname -sr; [ -r /etc/os-release ] && . /etc/os-release && echo "  $PRETTY_NAME"
echo "== Docker"
if command -v docker >/dev/null; then ok "$(docker --version)"; else falta 'Docker não instalado'; fi
if docker compose version >/dev/null 2>&1; then ok "$(docker compose version)"; else falta 'Plugin docker compose não encontrado'; fi
docker ps >/dev/null 2>&1 && ok 'usuário consegue usar o Docker' || falta "usuário sem acesso ao Docker (grupo docker ou sudo)"
echo "== Quem usa as portas 80, 443 e $PORTA"
(ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null) | awk -v p=":$PORTA\$" 'NR==1 || $4 ~ /:80$|:443$/ || $4 ~ p'
for s in nginx apache2 httpd caddy traefik; do
  systemctl is-active --quiet $s 2>/dev/null && echo "  serviço ativo: $s"
done
docker ps --format '  contêiner {{.Names}} ({{.Image}}) {{.Ports}}' 2>/dev/null
echo "== Domínio"
IP=$(getent hosts "$DOMINIO" | awk '{print $1}' | head -1)
[ -n "$IP" ] && ok "$DOMINIO → $IP" || falta "$DOMINIO não resolve (pedir o DNS)"
echo "  IPs desta máquina: $(hostname -I 2>/dev/null)"
echo "== Recursos"
df -h / | tail -1 | awk '{print "  disco: "$4" livres de "$2}'
free -h 2>/dev/null | awk '/Mem/{print "  memória: "$7" disponíveis de "$2}'
echo "== Saída para a internet (imagens e SUAP)"
curl -s -o /dev/null -m 8 -w '  ghcr.io: %{http_code}\n' https://ghcr.io/v2/ || falta 'sem acesso a ghcr.io'
curl -s -o /dev/null -m 8 -w '  suap.ifrn.edu.br: %{http_code}\n' https://suap.ifrn.edu.br/ || falta 'sem acesso ao SUAP'
echo
echo "Se nginx ou Apache já usam 80/443: o ETAL fica na porta $PORTA e entra o trecho deploy/nginx-etal.conf (ou apache-etal.conf)."
echo "Se 80/443 estão livres: dá para usar docker-compose.https.yml, e o próprio app pede o certificado."
