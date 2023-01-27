import { useCallback } from 'react'
import { ElementWithId } from '../../drawingElements/element'
import Point from '../../drawingElements/point'
import useTrimUtils from '../../hooks/utility/useTrimUtils'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'
import { MousePosition } from '../../utils/types/index'

const useTrimCommand = () => {
  const elementsStore = useElementsStore()
  const startReplacingElements = elementsStore(state => state.startReplacingElements)
  const clearReplacingElements = elementsStore(state => state.clearReplacingElements)
  const isReplacingElement = elementsStore(state => state.isReplacingElement)
  const hasSelectedElement = elementsStore(state => state.hasSelectedElement)
  const getElementsContainingPoint = elementsStore(state => state.getElementsContainingPoint)
  const getElementsInContainer = elementsStore(state => state.getElementsInContainer)

  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool)
  const getLastReferenceClick = toolsStore(state => state.getLastReferenceClick)
  const getSelectDelta = toolsStore(state => state.getSelectDelta)
  const addToolProp = toolsStore(state => state.addToolProp)

  const { getSingleElementTrimResults, getPolylineTrimResults } = useTrimUtils()

  const handleTrimCmd = useCallback(({ mouseX, mouseY }: MousePosition) => {
    if (!tool.isStarted) {
      return true
    }

    const lastClick = getLastReferenceClick()
    if (lastClick) {
      addToolProp({ mousePosition: { mouseX, mouseY } })
    }

    const mousePoint = new Point(Number(mouseX.toFixed(3)), Number(mouseY.toFixed(3)))

    let elementsToTrim = lastClick
      ? getElementsInContainer(lastClick, mousePoint, { shouldSkipPartial: false, returnGroup: 2 }) as ElementWithId[] | null
      : getElementsContainingPoint(mouseX, mouseY, { maxPointsDiff: getSelectDelta(), returnGroup: 2 }) as ElementWithId[] | null

    if (!elementsToTrim) {
      clearReplacingElements()
      return true
    }

    elementsToTrim = elementsToTrim.filter(
      (ett) => !hasSelectedElement(ett) && !isReplacingElement(ett)
    )

    clearReplacingElements(elementsToTrim)

    const pointsOfSelection = lastClick ? [lastClick, mousePoint] : [mousePoint]
      // A kvp with polylineId as keys, with values another set of kvp's with key subElementId and values an array of trim points
    // const { singleElementCmdResult, polylines } = getSingleElementTrimResults(
    const { singleElementCmdResult, polylineIds } = getSingleElementTrimResults(
      elementsToTrim,
      pointsOfSelection
    )

    // const polylineCmdResult = getPolylineTrimResults(polylines, pointsOfSelection)
    const polylineCmdResult = getPolylineTrimResults(polylineIds, pointsOfSelection)
    const commandResult = new Map([ ...singleElementCmdResult, ...polylineCmdResult ])

    if (Object.keys(commandResult).length === 0) {
      return clearReplacingElements()
    }

    startReplacingElements(commandResult)
  }, [
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
    getPolylineTrimResults
  ])

  return handleTrimCmd
}

export default useTrimCommand
