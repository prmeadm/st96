import { BaseEdge, EdgeLabelRenderer, getBezierPath, useReactFlow, type EdgeProps } from '@xyflow/react'
import { Ic } from './Nodes'

const CROSS = 'M6 6l12 12M18 6L6 18'

/** Связь с кнопкой «Отвязать» посередине: на телефоне линию пальцем не поймать, а крестик попадает. */
export function DeletableEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd, selected }: EdgeProps) {
  const { deleteElements } = useReactFlow()
  const [path, x, y] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition })
  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} interactionWidth={28} />
      <EdgeLabelRenderer>
        <button
          type="button"
          className={`edge-x nodrag nopan ${selected ? 'sel' : ''}`}
          style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
          title="Отвязать блоки"
          aria-label="Отвязать блоки"
          onClick={(e) => { e.stopPropagation(); void deleteElements({ edges: [{ id }] }) }}
        ><Ic d={CROSS} size={12} sw={2.2} /></button>
      </EdgeLabelRenderer>
    </>
  )
}

export const edgeTypes = { default: DeletableEdge }
