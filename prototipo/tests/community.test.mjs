import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../community.js', import.meta.url), 'utf8');
function setup(saved = null) {
  let value = saved;
  let full = false;
  const storage = {
    getItem: () => value,
    setItem: (_, next) => {
      if (full) throw new Error('quota');
      value = next;
    },
  };
  const context = vm.createContext({ window: {}, localStorage: storage });
  vm.runInContext(source, context);
  return {
    social: context.window.COMMUNITY,
    fill: () => {
      full = true;
    },
    stored: () => value,
  };
}
const actor = { author: 'participant-a', name: 'Participante A' };
test('preserva publicações antigas ao adicionar salvos e moderação', () => {
  const { social } = setup(JSON.stringify({ posts: [{ id: 'old', image: 'photo.jpg', name: 'A' }] }));
  const value = social.read();
  assert.equal(value.posts[0].image, 'photo.jpg');
  assert.equal(value.reports.length, 0);
  assert.equal(Object.keys(value.bookmarks).length, 0);
});
test('dados locais malformados não impedem o início', () => {
  for (const saved of ['broken JSON', 'null', '{"posts":{},"likes":[],"reports":"bad"}']) {
    const { social } = setup(saved);
    const value = social.read();
    assert.equal(value.posts.length, 0);
    assert.equal(value.reports.length, 0);
  }
});
test('denúncias rejeitam conteúdo inexistente, motivo inválido e duplicatas pendentes', () => {
  const { social } = setup();
  const v = social.read();
  assert.throws(() => social.report(v, 'post:missing', actor, social.reasons[0], ''), /disponível/);
  assert.throws(() => social.report(v, 'post:demo-encontro', actor, 'invalid', ''), /motivo/);
  social.report(v, 'post:demo-encontro', actor, social.reasons[0], 'Revisar');
  assert.throws(() => social.report(v, 'post:demo-encontro', actor, social.reasons[1], ''), /já denunciou/);
  assert.equal(v.reports.length, 1);
});
test('ocultar publicação retira fotos e comentários da leitura pública; restauração mantém dados', () => {
  const { social } = setup();
  const v = social.read();
  v.comments['demo-encontro'] = [{ id: 'comment', text: 'Conversa' }];
  social.report(v, 'post:demo-encontro', actor, social.reasons[0], 'Revisar');
  social.moderate(v, 'post:demo-encontro', 'hide', 'Equipe', 'Revisado');
  assert.equal(
    social.posts(v).some((p) => p.id === 'demo-encontro'),
    false,
  );
  assert.equal(social.comments(v, 'demo-encontro').length, 0);
  assert.equal(v.reports[0].status, 'hidden');
  assert.equal(v.audit[0].by, 'Equipe');
  assert.equal(v.audit[0].note, 'Revisado');
  social.moderate(v, 'post:demo-encontro', 'restore', 'Equipe');
  assert.equal(social.posts(v).find((p) => p.id === 'demo-encontro').images.length, 3);
  assert.equal(social.comments(v, 'demo-encontro').length, 1);
});
test('moderar comentário preserva a publicação e os outros comentários', () => {
  const { social } = setup();
  const v = social.read();
  v.comments['demo-projeto'] = [{ id: 'one' }, { id: 'two' }];
  social.moderate(v, social.commentKey('demo-projeto', 'one'), 'hide', 'Equipe');
  assert.equal(social.posts(v).length, 3);
  assert.equal(social.comments(v, 'demo-projeto').length, 1);
  assert.equal(social.comments(v, 'demo-projeto')[0].id, 'two');
});
test('mensagens demonstrativas obedecem à mesma moderação e podem ser restauradas', () => {
  const { social } = setup();
  const v = social.read();
  const target = social.messageKey('demo-chat-oi');
  social.moderate(v, target, 'hide', 'Equipe');
  assert.equal(social.messages(v).length, 0);
  social.moderate(v, target, 'restore', 'Equipe');
  assert.equal(social.messages(v).length, 1);
});
test('arquivar denúncia mantém o conteúdo visível e permite revisar conteúdo já excluído', () => {
  const { social } = setup();
  const v = social.read();
  v.posts.push({ id: 'temporary', name: 'A', text: 'Post' });
  social.report(v, 'post:temporary', actor, social.reasons[0], 'Revisar');
  v.posts = [];
  assert.throws(() => social.moderate(v, 'post:temporary', 'hide', 'Equipe'), /excluído/);
  social.moderate(v, 'post:temporary', 'dismiss', 'Equipe');
  assert.equal(v.reports[0].status, 'dismissed');
  assert.equal(social.posts(v).length, 3);
});
test('conteúdo e detalhes de denúncia aparecem como texto no painel', () => {
  const { social } = setup();
  const v = social.read();
  v.posts.push({ id: 'html', name: '<script>name</script>', text: '<img src=x onerror=alert(1)>' });
  social.report(v, 'post:html', actor, social.reasons[0], '<script>detail</script>');
  const html = social.moderationHTML(v);
  assert.equal(html.includes('<script>'), false);
  assert.equal(html.includes('&lt;img'), true);
  assert.equal(html.includes('&lt;script&gt;detail'), true);
});
test('quota de armazenamento falha sem sobrescrever o estado salvo', () => {
  const initial = JSON.stringify({ posts: [{ id: 'kept' }] });
  const { social, fill, stored } = setup(initial);
  fill();
  assert.throws(() => social.write((v) => v.posts.push({ id: 'new' })), /salvar/);
  assert.equal(stored(), initial);
});

test('contexto da publicação prioriza QR recente e não inventa presença em outra atividade', () => {
  const { social } = setup();
  const sessions = [
    { id: 'curso-a', type: 'Minicurso', day: 26, time: '14:00', end: '18:00' },
    { id: 'curso-b', type: 'Minicurso', day: 26, time: '14:00', end: '18:00' },
    { id: 'recepcao', type: 'Credenciamento', day: 26, time: '13:00', end: '18:00' },
  ];
  const now = 100000000;
  const context = {
    sessions,
    day: 26,
    time: '15:00',
    saved: ['curso-b'],
    present: { 'curso-a': '14:10' },
    lastCheckin: { id: 'curso-a', at: now - 60000 },
    now,
  };
  assert.equal(social.currentActivity(context).activity.id, 'curso-a');
  assert.equal(social.currentActivity({ ...context, present: {}, saved: ['curso-a', 'curso-b'] }), null);
  assert.equal(social.currentActivity({ ...context, present: {}, lastCheckin: null }).activity.id, 'curso-b');
  assert.equal(
    social.currentActivity({ ...context, lastCheckin: { id: 'curso-a', at: now - 86400000 }, time: '20:00' }),
    null,
  );
  assert.equal(
    social.currentActivity({ ...context, lastCheckin: { id: 'curso-a', at: now - 86400000 } }).activity.id,
    'curso-b',
  );
  assert.equal(
    social.currentActivity({ ...context, lastCheckin: { id: 'curso-a', at: now + 60000 }, time: '20:00' }),
    null,
  );
  assert.equal(
    social.currentActivity({
      ...context,
      saved: ['recepcao'],
      present: { recepcao: '14:00' },
      lastCheckin: { id: 'recepcao', at: now },
    }),
    null,
  );
});

test('excluir direto no feed exige autoria ou moderação e mantém histórico para restauração', () => {
  const { social } = setup();
  const id = social.seeds[0].id;
  assert.throws(() => social.write((v) => social.removePost(v, id, actor)), /própria publicação/);
  assert.equal(social.posts(social.read()).length, social.seeds.length);
  social.write((v) => social.removePost(v, id, { author: 'moderator', name: 'Moderadora' }, true));
  let value = social.read();
  assert.equal(
    social.posts(value).some((p) => p.id === id),
    false,
  );
  assert.equal(social.comments(value, id).length, 0);
  assert.equal(value.audit[0].by, 'Moderadora');
  social.write((v) => social.moderate(v, social.postKey(id), 'restore', 'Moderadora'));
  assert.equal(
    social.posts(social.read()).some((p) => p.id === id),
    true,
  );
});
