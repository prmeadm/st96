import { Link } from 'react-router-dom'
import { Icon } from './Icon'

/** Кнопки «изменить» и «удалить» на карточке списка: не нужно заходить внутрь элемента. */
export function RowActions({ editTo, onEdit, onDelete, deleteDisabled, deleteTitle = 'Удалить' }: {
  editTo?: string
  onEdit?: () => void
  onDelete: () => void
  deleteDisabled?: boolean
  deleteTitle?: string
}) {
  return (
    <div className="acts" onClick={(e) => e.stopPropagation()}>
      {editTo
        ? <Link className="ibtn sm" to={editTo} title="Изменить" aria-label="Изменить"><Icon name="edit" size={18} /></Link>
        : <button type="button" className="ibtn sm" title="Изменить" aria-label="Изменить" onClick={onEdit}><Icon name="edit" size={18} /></button>}
      <button type="button" className="ibtn sm danger" title={deleteTitle} aria-label={deleteTitle} disabled={deleteDisabled} onClick={onDelete}><Icon name="trash" size={18} /></button>
    </div>
  )
}
