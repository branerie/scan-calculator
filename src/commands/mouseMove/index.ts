import { useCallback, MouseEvent } from 'react'
import useCreateCommand from './useCreateCommand'
import useCopyCommand from './useCopyCommand'
import useDragCommand from './useDragCommand'
import useEditCommand from './useEditCommand'
import useSnapCommand from './useSnapCommand'
import useSelectCommand from './useSelectCommand'
import useTransformCommand from './useTransformCommand'
import useTrimCommand from './useTrimCommand'
import useExtendCommand from './useExtendCommand'
import { getOrthoCoordinates } from '../../utils/options'
import { createLine } from '../../utils/elementFactory'
import { MousePosition } from '../../utils/types/index'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'

const useMouseMoveCommands = () => {
  const elementsStore = useElementsStore()
  const currentlyEditedElements = elementsStore(state => state.currentlyEditedElements)
  const currentlyCreatedElement = elementsStore(state => state.currentlyCreatedElement)
  const currentlyCopiedElements = elementsStore(state => state.currentlyCopiedElements)
  const snappedPoint = elementsStore(state => state.snappedPoint)
  const selectedPoints = elementsStore(state => state.selectedPoints)

  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool)
  const toolClicks = toolsStore(state => state.toolClicks)
  const mouseDrag = toolsStore(state => state.mouseDrag)
  const options = toolsStore(state => state.options)
  const getRealMouseCoordinates = toolsStore(state => state.getRealMouseCoordinates)
  const getLastReferenceClick = toolsStore(state => state.getLastReferenceClick)
  const addToolProp = toolsStore(state => state.addToolProp)

  const drag = useDragCommand()
  const snap = useSnapCommand()
  const edit = useEditCommand()
  const create = useCreateCommand()
  const transform = useTransformCommand()
  const copy = useCopyCommand()
  const select = useSelectCommand()
  const trim = useTrimCommand()
  const extend = useExtendCommand()

  const executeMouseMoveCommand = useCallback((event: MouseEvent) => {
    if (mouseDrag && event.buttons === 4) {
      drag(event)
      return
    }

    let [realClientX, realClientY] = getRealMouseCoordinates(event.clientX, event.clientY)

    if (options.snap && tool.type !== 'select' && tool.type !== 'trim') {
      snap({ mouseX: realClientX, mouseY: realClientY })
    }

    if (options.ortho && toolClicks && !snappedPoint && tool.type !== 'trim') {
      const lastClick = getLastReferenceClick()
      if (lastClick) {
        const [finalX, finalY] = getOrthoCoordinates(
          lastClick.x,
          lastClick.y,
          realClientX,
          realClientY
        )
        realClientX = finalX
        realClientY = finalY
      }
    }

    if (snappedPoint && tool.type !== 'trim') {
      // [realClientX, realClientY] = getRealMouseCoordinates(snappedPoint.x, snappedPoint.y)
      realClientX = snappedPoint.x
      realClientY = snappedPoint.y
    }

    const realMousePosition: MousePosition = { mouseX: realClientX, mouseY: realClientY }

    if (tool.type === 'trim') {
      let isTrim = tool.name === 'trim'
      if (event.shiftKey) {
        isTrim = !isTrim
      }

      if (isTrim) {
        trim(realMousePosition)
      } else {
        extend(realMousePosition)
      }

      return
    }

    if (toolClicks) {
      if (tool.name === 'select') {
        select(realMousePosition)
        return
      }

      const refClick = getLastReferenceClick()
      if (refClick) {
        const toolLine = createLine(refClick.x, refClick.y, realClientX, realClientY)
        addToolProp({ line: toolLine })
      }
    }

    // if (!currentlyEditedElements && !currentlyCreatedElement) return

    if (currentlyEditedElements) {
      if (selectedPoints) {
        edit(realMousePosition)
      } else {
        transform(realMousePosition)
      }

      return
    }

    if (currentlyCreatedElement && currentlyCreatedElement.isAlmostDefined) {
      create(realMousePosition)
      return
    }

    if (currentlyCopiedElements) {
      copy(realMousePosition)
    }
  }, [
    drag,
    snap,
    trim,
    extend,
    select,
    edit,
    transform,
    create,
    copy,
    currentlyCreatedElement,
    currentlyEditedElements,
    currentlyCopiedElements,
    mouseDrag,
    options.snap,
    options.ortho,
    selectedPoints,
    tool.type,
    tool.name,
    toolClicks,
    snappedPoint,
    getRealMouseCoordinates,
    getLastReferenceClick,
    addToolProp
  ])

  return executeMouseMoveCommand
}

export default useMouseMoveCommands
