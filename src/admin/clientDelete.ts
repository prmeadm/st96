import { supabase } from './supabase'
import { clientTitle, type Client } from './types'

/** Удаление клиента после подтверждения. Переписка, заметки, запуски воронок и теги удаляются вместе с ним; заявки и записи остаются без привязки. */
export async function deleteClient(c: Pick<Client, 'id' | 'name' | 'tg_username' | 'phone' | 'email'>): Promise<'deleted' | 'canceled' | 'error'> {
  const ok = window.confirm(`Удалить клиента «${clientTitle(c)}»?\n\nУдалятся его переписка, заметки, теги и запуски воронок. Заявки и записи останутся в своих разделах без привязки к клиенту. Это нельзя отменить.`)
  if (!ok) return 'canceled'
  const { error } = await supabase.from('clients').delete().eq('id', c.id)
  return error ? 'error' : 'deleted'
}
