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
import { useToolsStore } from '../../stores/tools/index'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'

const useMouseMoveCommands = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyEditedElements = useElementsStore((state) => state.currentlyEditedElements)
  const currentlyCreatedElement = useElementsStore((state) => state.currentlyCreatedElement)
  const currentlyCopiedElements = useElementsStore((state) => state.currentlyCopiedElements)
  const snappedPoint = useElementsStore((state) => state.snappedPoint)
  const selectedPoints = useElementsStore((state) => state.selectedPoints)

  const tool = useToolsStore((state) => state.tool)
  const toolClicks = useToolsStore((state) => state.toolClicks)
  const mouseDrag = useToolsStore((state) => state.mouseDrag)
  const options = useToolsStore((state) => state.options)
  const getRealMouseCoordinates = useToolsStore((state) => state.getRealMouseCoordinates)
  const getLastReferenceClick = useToolsStore((state) => state.getLastReferenceClick)
  const addToolProp = useToolsStore((state) => state.addToolProp)

  const drag = useDragCommand()
  const snap = useSnapCommand()
  const edit = useEditCommand()
  const create = useCreateCommand()
  const transform = useTransformCommand()
  const copy = useCopyCommand()
  const select = useSelectCommand()
  const trim = useTrimCommand()
  const extend = useExtendCommand()

  const executeMouseMoveCommand = useCallback(
    (event: MouseEvent) => {
      if (mouseDrag && event.buttons === 4) {
        drag(event)
        return
      }

      let [realClientX, realClientY] = getRealMouseCoordinates(event.clientX, event.clientY)
      let realMousePosition: MousePosition = { mouseX: realClientX, mouseY: realClientY }

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

      if (options.snap && tool.type !== 'select') {
        snap({ mouseX: realClientX, mouseY: realClientY })
      }

      if (options.ortho && toolClicks && !snappedPoint) {
        const lastClick = getLastReferenceClick()
        if (lastClick) {
          const [finalX, finalY] = getOrthoCoordinates(lastClick.x, lastClick.y, realClientX, realClientY)
          realClientX = finalX
          realClientY = finalY
        }
      }

      if (snappedPoint) {
        // [realClientX, realClientY] = getRealMouseCoordinates(snappedPoint.x, snappedPoint.y)
        realClientX = snappedPoint.x
        realClientY = snappedPoint.y
        realMousePosition = {
          mouseX: realClientX,
          mouseY: realClientY
        }
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
    },
    [
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
      addToolProp,
    ]
  )

  return executeMouseMoveCommand
}

export default useMouseMoveCommands
