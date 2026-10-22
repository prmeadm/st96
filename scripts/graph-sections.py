#!/usr/bin/env python3
"""Нарезает граф кода (graphify-out/graph.json) на разделы продукта.

Зачем: чтобы задачу по одному разделу можно было вести в отдельной короткой сессии,
читая только справку раздела и его маленький граф, а не весь проект.

Результат:
  graphify-out/sections/index.md             карта разделов (с чего начать сессию)
  graphify-out/sections/<раздел>.md          справка раздела
  graphify-out/sections/<раздел>/graph.json  граф раздела (+ соседи на 1 шаг из других разделов)

Запуск после `graphify update .`:  python3 scripts/graph-sections.py
"""
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GRAPH = ROOT / 'graphify-out' / 'graph.json'
OUT = ROOT / 'graphify-out' / 'sections'

# Порядок важен: файл попадает в первый подходящий раздел.
SECTIONS = [
    {
        'key': 'funnels', 'title': 'Воронки',
        'about': 'Движок воронок (запуск, кнопки, условия, действия, паузы, запись из воронки, повторы при сбоях), '
                 'отправка в Telegram (медиа с подписью, YouTube, кружки, 429), конструктор в админке.',
        'paths': [r'^server/funnels/', r'^server/bot/telegramOut\.ts$', r'^server/media\.ts$', r'^src/admin/builder/',
                  r'^src/admin/pages/Funnel', r'^src/admin/ui/VideoNoteField', r'^server/bot/(keyboard|videonote)\.test\.ts$',
                  r'^server/media\.test\.ts$'],
        'tests': 'npx tsx --test server/funnels/*.test.ts server/media.test.ts server/bot/keyboard.test.ts server/bot/videonote.test.ts',
        'tasks': ['новый тип блока или действия', 'поведение кнопок и веток', 'как выглядит сообщение в Telegram',
                  'статистика воронок', 'блок «ИИ-ответ»'],
    },
    {
        'key': 'bot', 'title': 'Бот и диалоги',
        'about': 'Вебхук Telegram, /start и /stop, темы клиентов в группе «Лиды ST96», команды сотрудников '
                 '(/shablon, /book, //заметка, /close), пересылка диалога человеку.',
        'paths': [r'^server/bot/', r'^api/telegram\.ts$'],
        'tests': 'npx tsx --test server/bot/bot.test.ts',
        'tasks': ['новая команда в теме', 'тексты бота RU/EN', 'поведение /start', 'передача диалога человеку'],
    },
    {
        'key': 'leads', 'title': 'Заявки и клиенты',
        'about': 'Приём заявок (форма сайта, стенд, группа, вручную), разбор полей, клиенты, заметки сотрудников, '
                 'страницы «Клиенты», «Заявки», «Заметки» в админке.',
        'paths': [r'^server/leads/', r'^api/(lead|ingest|lead-admin)\.ts$', r'^src/admin/pages/(Leads|LeadEditor|Clients|Client|Notes)',
                  r'^src/admin/clientDelete', r'^src/admin/ui/ContactLinks'],
        'tests': 'npx tsx --test server/leads/*.test.ts',
        'tasks': ['разбор заявки', 'поиск и фильтры клиентов', 'карточка клиента', 'форма заявки на сайте (вместе с разделом «Сайт»)'],
    },
    {
        'key': 'booking', 'title': 'Запись на встречу',
        'about': 'Расписание и слоты, заявки на встречу, подтверждение кнопками, уведомления и .ics, напоминания, '
                 'страница /book, раздел «Запись» в админке.',
        'paths': [r'^server/booking/', r'^api/booking', r'^src/book/', r'^src/booking/', r'^src/admin/pages/Booking',
                  r'^src/data/(bookingGoals|serviceOptions)'],
        'tests': 'npx tsx --test server/booking/*.test.ts',
        'tasks': ['расписание и исключения', 'страница /book', 'уведомления о встрече', 'Google Meet и календарь'],
    },
    {
        'key': 'broadcasts', 'title': 'Рассылки',
        'about': 'Массовые рассылки по сегментам (только с согласием), пачки, паузы на 429, прогресс в админке.',
        'paths': [r'^server/broadcasts', r'^api/broadcast\.ts$', r'^src/admin/pages/Broadcast'],
        'tests': 'npx tsx --test server/broadcasts.test.ts',
        'tasks': ['сегменты', 'расписание рассылки', 'медиа в рассылке'],
    },
    {
        'key': 'templates', 'title': 'Шаблоны и медиа',
        'about': 'Библиотека шаблонов, отправка шаблона клиенту, загрузка и съёмка медиа (фото, видео, голос, файл).',
        'paths': [r'^server/templates', r'^api/send-template\.ts$', r'^src/admin/pages/Templates', r'^src/admin/ui/(MediaField|CameraCapture)'],
        'tests': 'npx tsx --test server/bot/bot.test.ts  # шаблоны в темах',
        'tasks': ['поля шаблона', 'фильтры и рейтинг', 'камера и запись голоса'],
    },
    {
        'key': 'agent', 'title': 'Агент, ИИ и аналитика',
        'about': 'Задания агента (план, согласование, шаги), модель Gemini и свои модели, перевод на английский, '
                 'учёт токенов, разделы «Агент», «Настройки», «Аналитика».',
        'paths': [r'^server/agent/', r'^server/(translate|usage)', r'^api/(agent|agent-model|translate|analytics-admin|status)\.ts$',
                  r'^src/admin/pages/(Agent|ModelPicker|Settings|Analytics)', r'^src/admin/ui/TranslateButton'],
        'tests': 'npx tsx --test server/agent/*.test.ts server/translate.test.ts server/usage.test.ts',
        'tasks': ['новый инструмент агента', 'выбор модели', 'перевод', 'аналитика расходов'],
    },
    {
        'key': 'core', 'title': 'Данные и инфраструктура',
        'about': 'Доступ к базе (Repo, Supabase, тестовая память), каталог услуг сайта, задания по расписанию /api/jobs, '
                 'миграции Supabase, вход в админку.',
        'paths': [r'^server/(repo|memoryRepo|catalog|adminAuth)', r'^api/(jobs|geo)\.ts$', r'^supabase/'],
        'tests': 'npm run test:server',
        'tasks': ['новая таблица или миграция', 'метод Repo', 'расписание задач'],
    },
    {
        'key': 'admin', 'title': 'Оболочка админки',
        'about': 'Каркас /admin: вход, навигация, общие UI-компоненты, стили, уведомление о новой версии.',
        'paths': [r'^src/admin/', r'^admin/'],
        'tests': 'npx tsc -b && npm run build',
        'tasks': ['навигация', 'общие компоненты', 'стили админки'],
    },
    {
        'key': 'site', 'title': 'Сайт st96.by',
        'about': 'Публичный сайт (RU/EN): страницы услуг, форма заявки, аналитика и согласие на cookie.',
        'paths': [r'^src/(components|pages|data|lib|hooks)/', r'^src/[^/]+\.(tsx?|css)$', r'^index\.html$', r'^public/'],
        'tests': 'npx tsc -b && npm run build',
        'tasks': ['тексты и страницы', 'форма заявки', 'аналитика'],
    },
]
SKIP = re.compile(r'^(print/|brand/|DESIGN-IS|graphify-out/|node_modules/|\.claude/|admin-prototype/|screens-b-leasing/)')


def section_of(path: str):
    if not path or SKIP.search(path):
        return None
    for s in SECTIONS:
        if any(re.search(p, path) for p in s['paths']):
            return s['key']
    return None


def main():
    g = json.loads(GRAPH.read_text(encoding='utf-8'))
    nodes = {n['id']: n for n in g['nodes']}
    links = g.get('links') or g.get('edges') or []
    sec = {nid: section_of(n.get('source_file') or '') for nid, n in nodes.items()}

    degree = Counter()
    for e in links:
        degree[e['source']] += 1
        degree[e['target']] += 1

    OUT.mkdir(parents=True, exist_ok=True)
    by_title = {s['key']: s['title'] for s in SECTIONS}
    index_rows = []

    for s in SECTIONS:
        key = s['key']
        own = {nid for nid, k in sec.items() if k == key}
        if not own:
            continue
        files = Counter(nodes[n].get('source_file') for n in own)
        inner, outgoing, incoming = [], defaultdict(list), defaultdict(list)
        neighbours = set()
        for e in links:
            a, b = e['source'], e['target']
            if a in own and b in own:
                inner.append(e)
            elif a in own and sec.get(b) and sec.get(b) != key:
                outgoing[sec[b]].append(e)
                neighbours.add(b)
            elif b in own and sec.get(a) and sec.get(a) != key:
                incoming[sec[a]].append(e)
                neighbours.add(a)

        # маленький граф раздела: свои узлы + соседи из других разделов (помечены external)
        sub_nodes = [dict(nodes[n]) for n in own] + [dict(nodes[n], external_section=sec[n]) for n in neighbours]
        sub_links = inner + [e for lst in outgoing.values() for e in lst] + [e for lst in incoming.values() for e in lst]
        (OUT / key).mkdir(exist_ok=True)
        (OUT / key / 'graph.json').write_text(json.dumps({
            'directed': g.get('directed', False), 'multigraph': g.get('multigraph', False), 'graph': g.get('graph', {}),
            'nodes': sub_nodes, 'links': sub_links, 'hyperedges': [], 'built_at_commit': g.get('built_at_commit'),
        }, ensure_ascii=False), encoding='utf-8')

        is_file = lambda n: re.search(r'\.(tsx?|css|json|md|sql|html)$', nodes[n].get('label') or '') is not None
        top = sorted((n for n in own if not is_file(n)), key=lambda n: -degree[n])[:12]
        label = lambda n: f"`{nodes[n].get('label')}` ({nodes[n].get('source_file')}:{nodes[n].get('source_location', '')})"
        md = [f"# {s['title']}", '', s['about'], '',
              f"Граф раздела: `graphify-out/sections/{key}/graph.json` ({len(own)} узлов, {len(inner)} внутренних связей).", '',
              '## С чего начать сессию', '',
              f"1. Прочитать этот файл (и только его, не весь проект).",
              f"2. Найти нужное место в графе раздела: `graphify explain \"<имя>\" --graph graphify-out/sections/{key}/graph.json`"
              f" или путь между узлами: `graphify path \"A\" \"B\" --graph graphify-out/sections/{key}/graph.json`.",
              '3. Открывать только файлы и строки, которые показал граф.',
              f"4. Проверка: `{s['tests']}`.", '',
              '## Файлы', '']
        md += [f"- `{f}` — {c} узл." for f, c in files.most_common()]
        md += ['', '## Главные узлы (больше всего связей)', ''] + [f"- {label(n)}" for n in top]
        if outgoing:
            md += ['', '## От чего зависит (вызовы в другие разделы)', '']
            for k2, lst in sorted(outgoing.items(), key=lambda kv: -len(kv[1])):
                ex = sorted({nodes[e['target']].get('label') for e in lst})[:6]
                md.append(f"- **{by_title.get(k2, k2)}** ({len(lst)}): " + ', '.join(f'`{x}`' for x in ex))
        if incoming:
            md += ['', '## Кто зависит от раздела (менять осторожно)', '']
            for k2, lst in sorted(incoming.items(), key=lambda kv: -len(kv[1])):
                ex = sorted({nodes[e['target']].get('label') for e in lst})[:6]
                md.append(f"- **{by_title.get(k2, k2)}** ({len(lst)}): " + ', '.join(f'`{x}`' for x in ex))
        md += ['', '## Типичные задачи этого раздела', ''] + [f"- {t}" for t in s['tasks']]
        md += ['', 'Если задача задевает несколько разделов, вести её по одному разделу за сессию: '
                   'сначала тот, от которого зависят остальные (см. «Кто зависит от раздела»).', '']
        (OUT / f'{key}.md').write_text('\n'.join(md), encoding='utf-8')
        index_rows.append((s, len(own), len(files)))

    unassigned = Counter(nodes[n].get('source_file') for n, k in sec.items() if k is None and not SKIP.search(nodes[n].get('source_file') or 'x'))
    idx = ['# Разделы проекта ST96: карта для коротких сессий', '',
           'Одна задача = один раздел = одна сессия. Новая сессия читает `CLAUDE.md`, этот файл и справку только своего раздела, '
           'а код открывает по графу раздела. Так контекст остаётся маленьким и лимиты не сгорают.', '',
           '| Раздел | Что внутри | Узлов | Файлов | Справка |', '|---|---|---|---|---|']
    idx += [f"| {s['title']} | {s['about'].split(',')[0].split('(')[0].strip()} | {n} | {f} | [`{s['key']}.md`]({s['key']}.md) |" for s, n, f in index_rows]
    idx += ['', '## Как начать сессию по разделу', '',
            'Первое сообщение в новой сессии, например:', '',
            '> Раздел «Воронки». Прочитай CLAUDE.md и graphify-out/sections/funnels.md, дальше работай только в этом разделе. Задача: …', '',
            'Обновить граф и справки после изменений в коде: `graphify update . && python3 scripts/graph-sections.py`.']
    if unassigned:
        idx += ['', '## Файлы вне разделов (не продуктовый код или конфиги)', ''] + [f"- `{f}`" for f, _ in unassigned.most_common(25)]
    (OUT / 'index.md').write_text('\n'.join(idx) + '\n', encoding='utf-8')
    print(f"sections: {len(index_rows)} -> {OUT.relative_to(ROOT)}")
    for s, n, f in index_rows:
        print(f"  {s['key']:<11} {n:>4} nodes {f:>3} files")
    print(f"  outside sections: {sum(unassigned.values())} nodes in {len(unassigned)} files")


if __name__ == '__main__':
    main()
