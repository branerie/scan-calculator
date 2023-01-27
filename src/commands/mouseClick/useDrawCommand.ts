import { useCallback } from 'react'
import Point from '../../drawingElements/point'
import useElementsStore from '../../stores/elements/index'
import { DrawTool, useToolsStore } from '../../stores/tools/index'
import { createElementFromName, createPoint } from '../../utils/elementFactory'
import ElementManipulator from '../../utils/elementManipulator'
import { generateId } from '../../utils/general'

const useDrawCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyCreatedElement = elementsStore(state => state.currentlyCreatedElement)
  const addCurrentlyCreatedElement = elementsStore(state => state.addCurrentlyCreatedElement)
  const removeCurrentlyCreatedElement = elementsStore(state => state.removeCurrentlyCreatedElement)
  const snappedPoint = elementsStore(state => state.snappedPoint)
  const clearSnappedPoint = elementsStore(state => state.clearSnappedPoint)
  const addElements = elementsStore(state => state.addElements)

  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool) as DrawTool
  const addToolClick = toolsStore(state => state.addToolClick)
  const clearCurrentTool = toolsStore(state => state.clearCurrentTool)

  const handleDrawCmd = useCallback((clickedPoint: Point) => {
    if (!currentlyCreatedElement) {
      const newGroupId = tool.name === 'polyline' || tool.name === 'rectangle' ? generateId() : null

      const newElement = createElementFromName(
        tool.name, 
        createPoint(clickedPoint.x, clickedPoint.y), 
        { groupId: newGroupId }
      )

      addCurrentlyCreatedElement(newElement)
      addToolClick(clickedPoint)
      return
    }

    // we are currently creating an element and it has its first point defined
    if (currentlyCreatedElement.isFullyDefined && currentlyCreatedElement.type !== 'polyline') {
      clearSnappedPoint()
      addElements([currentlyCreatedElement])
      clearCurrentTool()
      removeCurrentlyCreatedElement()
      return
    }

    const copiedPoint = snappedPoint ? createPoint(clickedPoint.x, clickedPoint.y) : clickedPoint

    const newCurrentlyCreatedElement = ElementManipulator.copyElement(currentlyCreatedElement, { keepIds: true })
    newCurrentlyCreatedElement.defineNextAttribute(copiedPoint)
    addCurrentlyCreatedElement(newCurrentlyCreatedElement)

    const isReferenceClick = tool.name !== 'arc'
    addToolClick(clickedPoint, isReferenceClick)
  }, [
    addCurrentlyCreatedElement,
    addElements,
    clearSnappedPoint,
    snappedPoint,
    currentlyCreatedElement,
    removeCurrentlyCreatedElement,
    tool.name,
    addToolClick,
    clearCurrentTool
  ])

  return handleDrawCmd
}

export default useDrawCommand
