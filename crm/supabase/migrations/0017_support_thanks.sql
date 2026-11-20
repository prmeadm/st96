-- 0017: статус 'thanks' (благодарность клиента) в support_jobs
alter table crm.support_jobs drop constraint if exists support_jobs_status_check;
alter table crm.support_jobs add constraint support_jobs_status_check
  check (status in ('queued','running','clarify','ready','deployed','split','out_of_scope','awaiting_payment','failed','thanks'));
