import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import { ElementWithId } from '../../drawingElements/element'
import Point from '../../drawingElements/point'
import useTrimUtils from '../../hooks/utility/useTrimUtils'
import { useToolsStore } from '../../stores/tools/index'
import { MousePosition } from '../../utils/types/index'

const useTrimCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const startReplacingElements = useElementsStore((state) => state.startReplacingElements)
  const clearReplacingElements = useElementsStore((state) => state.clearReplacingElements)
  const isReplacingElement = useElementsStore((state) => state.isReplacingElement)
  const hasSelectedElement = useElementsStore((state) => state.hasSelectedElement)
  const getElementsContainingPoint = useElementsStore((state) => state.getElementsContainingPoint)
  const getElementsInContainer = useElementsStore((state) => state.getElementsInContainer)

  const tool = useToolsStore((state) => state.tool)
  const getLastReferenceClick = useToolsStore((state) => state.getLastReferenceClick)
  const getSelectDelta = useToolsStore((state) => state.getSelectDelta)
  const addToolProp = useToolsStore((state) => state.addToolProp)

  const { getSingleElementTrimResults, getPolylineTrimResults } = useTrimUtils()

  const handleTrimCmd = useCallback(
    ({ mouseX, mouseY }: MousePosition) => {
      if (!tool.isStarted) {
        return true
      }

      const lastClick = getLastReferenceClick()
      if (lastClick) {
        addToolProp({ mousePosition: { mouseX, mouseY } })
      }

      const mousePoint = new Point(Number(mouseX.toFixed(3)), Number(mouseY.toFixed(3)))

      let elementsToTrim = lastClick
        ? (getElementsInContainer(lastClick, mousePoint, {
            shouldSkipPartial: false,
            returnGroup: 'members',
          }) as ElementWithId[] | null)
        : (getElementsContainingPoint(mouseX, mouseY, {
            maxPointsDiff: getSelectDelta(),
            returnGroup: 'members',
          }) as ElementWithId[] | null)

      if (!elementsToTrim) {
        clearReplacingElements()
        return true
      }

      elementsToTrim = elementsToTrim.filter((ett) => !hasSelectedElement(ett) && !isReplacingElement(ett))

      clearReplacingElements(elementsToTrim)

      const pointsOfSelection = lastClick ? [lastClick, mousePoint] : [mousePoint]
      const { singleElementCmdResult, polylineIds } = getSingleElementTrimResults(
        elementsToTrim,
        pointsOfSelection
      )

      // const polylineCmdResult = getPolylineTrimResults(polylines, pointsOfSelection)
      const polylineCmdResult = getPolylineTrimResults(polylineIds, pointsOfSelection)
      const commandResult = new Map([...singleElementCmdResult, ...polylineCmdResult])

      if (commandResult.size === 0) {
        return clearReplacingElements()
      }

      startReplacingElements(commandResult)
    },
    [
      addToolProp,
      clearReplacingElements,
      getElementsContainingPoint,
      getElementsInContainer,
      getLastReferenceClick,
      getSelectDelta,
      startReplacingElements,
      hasSelectedElement,
      isReplacingElement,
      tool,
      getSingleElementTrimResults,
      getPolylineTrimResults,
    ]
  )

  return handleTrimCmd
}

export default useTrimCommand
