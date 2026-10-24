-- Услуги платформы = услуги сайта st96.by (src/data/services.ts, content.en.ts).
-- Старые услуги остаются только для истории заявок: active = false, в выборе не показываются.
insert into public.services (key, name_ru, name_en, description_ru, description_en, sort, active) values
  ('producing', 'Продюсирование', 'Producing', 'От идеи до релиза — под ключ. Берём на себя весь путь creative-проекта — от смысла и концепции до релиза и первых денег. Артисты, медиапроекты, коллаборации, шоу.', 'From idea to release — turnkey. We take on the entire path of a creative project — from meaning and concept to release and first revenue. Artists, media projects, collaborations, shows.', 1, true),
  ('promotion', 'Коммерческий промоушн', 'Commercial promotion', 'Промо, привязанное к продажам. Строим промо-кампании, которые двигают бизнес-показатели, а не только охваты. Стратегия, креатив и медиазакупка — в одних руках.', 'Promotion tied to sales. We build promo campaigns that move business metrics, not just reach. Strategy, creative and media buying — in one pair of hands.', 2, true),
  ('production', 'Продакшн', 'Production', 'Полный цикл производства контента. Видео, фото и контент полного цикла: сценарий, съёмка, монтаж, графика. Одна команда — от брифа до финального файла.', 'Full-cycle content production. Video, photo and content, full cycle: script, shooting, editing, graphics. One team — from brief to final file.', 3, true),
  ('ai', 'AI-разработка', 'AI development', 'AI-решения от прототипа до продакшна. Проектируем и разрабатываем программные решения на базе искусственного интеллекта: от автоматизации процессов до собственных AI-продуктов.', 'AI solutions from prototype to production. We design and develop AI-based software: from process automation to your own AI products.', 4, true)
on conflict (key) do update set name_ru = excluded.name_ru, name_en = excluded.name_en,
  description_ru = excluded.description_ru, description_en = excluded.description_en, sort = excluded.sort, active = true;

update public.services set active = false
where key not in ('producing', 'promotion', 'production', 'ai', 'other');
update public.services set name_ru = 'Не указана', name_en = 'Not specified', sort = 99 where key = 'other';

-- Источник правды — сайт: новая услуга на сайте не должна ломать приём заявок
alter table public.leads drop constraint if exists leads_service_key_fkey;
