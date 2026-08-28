import { useRef, useState, useCallback, useEffect, cloneElement, Children } from 'react'
import './ZoomPane.css'

const MIN_SCALE = 0.5
const MAX_SCALE = 12
const DRAG_THRESHOLD = 4

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

export default function ZoomPane({ resetKey, aspectRatio, children }) {
  const containerRef = useRef(null)
  const [transform, setTransform] = useState({ scale: 1, x: 0, y: 0 })
  const pointers = useRef(new Map())
  const dragState = useRef(null)
  const pinchState = useRef(null)

  const zoomAt = useCallback((factor, clientX, clientY) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = clientX - rect.left
    const py = clientY - rect.top

    setTransform((prev) => {
      const nextScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE)
      const ratio = nextScale / prev.scale
      const nextX = px - (px - prev.x) * ratio
      const nextY = py - (py - prev.y) * ratio
      return { scale: nextScale, x: nextX, y: nextY }
    })
  }, [])

  const reset = useCallback(() => {
    setTransform({ scale: 1, x: 0, y: 0 })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      zoomAt(factor, e.clientX, e.clientY)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomAt])

  const onPointerDown = useCallback((e) => {
    const el = containerRef.current
    if (!el) return
    // Pointer capture is deferred until a real drag is confirmed (see onPointerMove):
    // capturing immediately would retarget the resulting compatibility 'click' event
    // to this container, so a plain tap/click on a circle would never reach it.
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 1) {
      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: e.clientX,
        originY: e.clientY,
        moved: false,
      }
    } else if (pointers.current.size === 2) {
      dragState.current = null
      for (const id of pointers.current.keys()) {
        el.setPointerCapture(id)
      }
      const pts = Array.from(pointers.current.values())
      const dx = pts[0].x - pts[1].x
      const dy = pts[0].y - pts[1].y
      pinchState.current = {
        dist: Math.hypot(dx, dy),
        midX: (pts[0].x + pts[1].x) / 2,
        midY: (pts[0].y + pts[1].y) / 2,
      }
    }
  }, [])

  const onPointerMove = useCallback(
    (e) => {
      if (!pointers.current.has(e.pointerId)) return
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

      if (pointers.current.size === 2 && pinchState.current) {
        const pts = Array.from(pointers.current.values())
        const dx = pts[0].x - pts[1].x
        const dy = pts[0].y - pts[1].y
        const dist = Math.hypot(dx, dy)
        const midX = (pts[0].x + pts[1].x) / 2
        const midY = (pts[0].y + pts[1].y) / 2
        const factor = dist / pinchState.current.dist
        if (Number.isFinite(factor) && factor > 0) {
          zoomAt(factor, midX, midY)
        }
        pinchState.current = { dist, midX, midY }
        return
      }

      if (dragState.current && pointers.current.size === 1) {
        if (!dragState.current.moved) {
          const totalDist = Math.hypot(
            e.clientX - dragState.current.originX,
            e.clientY - dragState.current.originY
          )
          if (totalDist < DRAG_THRESHOLD) return
          dragState.current.moved = true
          containerRef.current?.setPointerCapture(e.pointerId)
        }
        const dxMove = e.clientX - dragState.current.startX
        const dyMove = e.clientY - dragState.current.startY
        dragState.current.startX = e.clientX
        dragState.current.startY = e.clientY
        setTransform((prev) => ({ ...prev, x: prev.x + dxMove, y: prev.y + dyMove }))
      }
    },
    [zoomAt]
  )

  const endPointer = useCallback((e) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0) {
      dragState.current = null
      pinchState.current = null
    } else if (pointers.current.size === 1) {
      pinchState.current = null
      const [only] = pointers.current.values()
      dragState.current = {
        startX: only.x,
        startY: only.y,
        originX: only.x,
        originY: only.y,
        moved: true,
      }
    }
  }, [])

  const onDoubleClick = useCallback(
    (e) => {
      zoomAt(transform.scale >= 3 ? 1 / 3 : 2, e.clientX, e.clientY)
    },
    [zoomAt, transform.scale]
  )

  useEffect(() => {
    reset()
  }, [resetKey, reset])

  return (
    <div className="zoom-pane">
      <div className="zoom-pane__toolbar">
        <button type="button" onClick={() => zoomAt(1 / 1.3, window.innerWidth / 2, window.innerHeight / 2)} aria-label="Alejar">
          −
        </button>
        <span className="zoom-pane__level">{Math.round(transform.scale * 100)}%</span>
        <button type="button" onClick={() => zoomAt(1.3, window.innerWidth / 2, window.innerHeight / 2)} aria-label="Acercar">
          +
        </button>
        <button type="button" className="zoom-pane__reset" onClick={reset}>
          Restablecer
        </button>
      </div>
      <div
        className="zoom-pane__viewport"
        ref={containerRef}
        style={{ aspectRatio }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onDoubleClick={onDoubleClick}
      >
        <div
          className="zoom-pane__stage"
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          }}
        >
          {cloneElement(Children.only(children), {
            className: ['zoom-pane__image', Children.only(children).props.className]
              .filter(Boolean)
              .join(' '),
          })}
        </div>
      </div>
      <p className="zoom-pane__hint">
        Rueda del mouse para hacer zoom · Arrastra para mover · Doble clic para acercar/alejar · Pellizca en pantallas táctiles
      </p>
    </div>
  )
}
