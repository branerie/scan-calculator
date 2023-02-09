import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { mountStoreDevtool } from 'simple-zustand-devtools'
import { FullyDefinedLine } from '../../drawingElements/line'
import Point from '../../drawingElements/point'
import { SELECT_DELTA } from '../../utils/constants'
import { areAlmostEqual } from '../../utils/number'

const VIEW_ZOOM_STEP_UP = 1.2
const VIEW_ZOOM_STEP_DOWN = 1 / 1.2
const VIEW_ZOOM_MAX_SCALE = VIEW_ZOOM_STEP_UP ** 15
const VIEW_ZOOM_MIN_SCALE = VIEW_ZOOM_STEP_DOWN ** 15

export const useToolsStore = create(
  immer<ToolsState>((set, get) => ({
    currentTranslate: [0, 0],
    currentScale: 1,
    mouseDrag: null,
    tool: { type: 'select', name: 'select' },
    toolKeys: new Set(),
    toolClicks: null,
    options: { snap: true, ortho: false },
    setMouseDrag(newDrag) {
      set({
        mouseDrag: newDrag,
      })
    },
    toggleOption(option) {
      set((state) => {
        state.options[option] = !state.options[option]
      })
    },
    panView(startX, startY, endX, endY) {
      const deltaX = endX - startX
      const deltaY = endY - startY
      // context.translate(deltaX, deltaY)

      const currentTranslate = get().currentTranslate

      set({
        currentTranslate: [currentTranslate[0] + deltaX, currentTranslate[1] + deltaY],
        mouseDrag: [endX, endY],
      })
    },
    zoomView(centerX, centerY, isZoomOut) {
      const scaleStep = isZoomOut ? VIEW_ZOOM_STEP_DOWN : VIEW_ZOOM_STEP_UP

      const currentScale = get().currentScale
      const newScale = Math.min(Math.max(currentScale * scaleStep, VIEW_ZOOM_MIN_SCALE), VIEW_ZOOM_MAX_SCALE)

      if (areAlmostEqual(currentScale, newScale)) {
        return
      }

      const currentTranslate = get().currentTranslate
      const [currentTranslateX, currentTranslateY] = currentTranslate
      const newCenterX = centerX - currentTranslateX
      const newCenterY = centerY - currentTranslateY
      const dX = (1 - scaleStep) * newCenterX
      const dY = (1 - scaleStep) * newCenterY

      set({
        currentScale: newScale,
        currentTranslate: [currentTranslateX + dX, currentTranslateY + dY],
      })
    },
    getSelectDelta() {
      const currentScale = get().currentScale
      return SELECT_DELTA / currentScale
    },
    setTool(newTool) {
      set({
        tool: newTool,
      })
    },
    setToolKeys(newToolKeys: Set<string>) {
      set({
        toolKeys: newToolKeys,
      })
    },
    resetTool() {
      set({
        tool: { type: 'select', name: 'select' },
        toolClicks: null,
        toolKeys: new Set(),
      })
    },
    addToolClick(clickedPoint, isReferenceClick = true) {
      set((state) => {
        if (state.toolClicks) {
          state.toolClicks.push(clickedPoint)
        } else {
          state.toolClicks = [clickedPoint]
        }

        if (isReferenceClick) {
          state.tool.refClickIndex = state.toolClicks.length - 1
        }
      })
    },
    editLastToolClick(newPoint) {
      set((state) => {
        const { toolClicks } = state
        if (!toolClicks) {
          throw new Error('Cannot edit clicks - tool does not contain any clicks.')
        }

        toolClicks.pop()
        toolClicks.push(newPoint)
      })
    },
    removeLastToolClick() {
      set((state) => {
        const { toolClicks, tool } = state
        if (!toolClicks) {
          return
        }

        if (toolClicks.length === 1) {
          state.toolClicks = null
          delete tool.props?.mousePosition
          delete tool.refClickIndex
        }
      })
    },
    addToolProp(toolProps) {
      set((state) => {
        const { tool } = state
        tool.props = toolProps
      })
    },
    isToolBeingUsed() {
      const toolClicks = get().toolClicks
      const tool = get().tool

      return (!!toolClicks && !!toolClicks.length) || !!tool.isStarted
    },
    getLastReferenceClick() {
      const toolClicks = get().toolClicks
      const tool = get().tool

      if (!toolClicks || (!tool.refClickIndex && tool.refClickIndex !== 0)) {
        return null
      }

      return toolClicks[tool.refClickIndex]
    },
    getRealMouseCoordinates(clientX, clientY) {
      const [translateX, translateY] = get().currentTranslate
      const currentScale = get().currentScale

      return [(clientX - translateX) / currentScale, (clientY - translateY) / currentScale]
    },
    startUsingTool() {
      set((state) => {
        const { tool } = state
        tool.isStarted = true
      })
    },
    stopUsingTool() {
      set((state) => {
        const { tool } = state
        tool.isStarted = false
      })
    },
    clearCurrentTool() {
      set((state) => {
        const { tool } = state
        delete tool.isStarted
        delete tool.props

        state.toolClicks = null
        state.toolKeys = new Set()
      })
    },
  }))
)

if (process.env.NODE_ENV === 'development') {
  mountStoreDevtool('ToolsStore', useToolsStore, document.getElementById('zustand-ToolsStore')!)
}

export type ToolsState = {
  currentTranslate: [number, number]
  currentScale: number
  mouseDrag: [number, number] | null
  tool: Tool
  toolKeys: Set<string>
  toolClicks: Point[] | null
  options: ToolOptions
  setMouseDrag(newDrag: [number, number] | null): void
  toggleOption(option: keyof ToolOptions): void
  panView(startX: number, startY: number, endX: number, endY: number): void
  zoomView(centerX: number, centerY: number, isZoomOut: boolean): void
  getSelectDelta(): number
  setTool(newTool: Tool): void
  resetTool(): void
  addToolClick(clickedPoint: Point, isReferenceClick?: boolean): void
  editLastToolClick(newPoint: Point): void
  removeLastToolClick(): void
  setToolKeys(newToolKeys: Set<string>): void
  addToolProp(toolProps: ToolProps): void
  isToolBeingUsed(): boolean
  getLastReferenceClick(): Point | null
  getRealMouseCoordinates(clientX: number, clientY: number): [number, number]
  startUsingTool(): void
  stopUsingTool(): void
  clearCurrentTool(): void
}

export type Tool = (SelectTool | DrawTool | EditTool | CopyTool | TrimTool | TransformTool) & {
  isStarted?: boolean
  refClickIndex?: number
  props?: ToolProps
}

export type ToolProps = {
  mousePosition?: { mouseX: number; mouseY: number }
  currentPos?: Point
  line?: FullyDefinedLine
}

export type ToolOptions = {
  snap: boolean
  ortho: boolean
}

export type SelectTool = {
  type: 'select'
  name: 'select'
}

export type DrawTool = {
  type: 'draw'
  name: 'line' | 'arc' | 'circle' | 'polyline' | 'rectangle'
}

export type EditTool = {
  type: 'edit'
  name: 'edit'
}

export type CopyTool = {
  type: 'copy'
  name: 'copy'
}

export type TrimTool = {
  type: 'trim'
  name: 'trim' | 'extend'
}

export type TransformTool = {
  type: 'transform'
  name: 'move' | 'rotate' | 'mirror' | 'scale'
}
