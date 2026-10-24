-- Согласие, данное в форме заявки на сайте (обязательная галочка, включает рекламу), считается согласием на рассылки.
-- Бот больше не спрашивает его отдельно. Тем, кто уже оставил заявку с сайта и не отписывался, проставляем дату первой заявки.
update public.clients c
set consent_at = x.first_at
from (select client_id, min(created_at) as first_at from public.leads where source = 'site_form' and client_id is not null group by client_id) x
where c.id = x.client_id and c.consent_at is null and c.opted_out_at is null;
