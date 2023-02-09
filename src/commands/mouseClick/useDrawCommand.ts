import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Point from '../../drawingElements/point'
import { DrawTool, useToolsStore } from '../../stores/tools/index'
import { createElementFromName, createPoint } from '../../utils/elementFactory'
import ElementManipulator from '../../utils/elementManipulator'
import { generateId } from '../../utils/general'

const useDrawCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyCreatedElement = useElementsStore((state) => state.currentlyCreatedElement)
  const addCurrentlyCreatedElement = useElementsStore((state) => state.addCurrentlyCreatedElement)
  const removeCurrentlyCreatedElement = useElementsStore((state) => state.removeCurrentlyCreatedElement)
  const snappedPoint = useElementsStore((state) => state.snappedPoint)
  const clearSnappedPoint = useElementsStore((state) => state.clearSnappedPoint)
  const addElements = useElementsStore((state) => state.addElements)

  const tool = useToolsStore((state) => state.tool) as DrawTool
  const addToolClick = useToolsStore((state) => state.addToolClick)
  const clearCurrentTool = useToolsStore((state) => state.clearCurrentTool)

  const handleDrawCmd = useCallback(
    (clickedPoint: Point) => {
      if (!currentlyCreatedElement) {
        const newGroupId = tool.name === 'polyline' || tool.name === 'rectangle' ? generateId() : null

        const newElement = createElementFromName(tool.name, clickedPoint, {
          groupId: newGroupId,
        })

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

      const copiedPoint = snappedPoint || clickedPoint

      const newCurrentlyCreatedElement = ElementManipulator.copyElement(currentlyCreatedElement, {
        keepIds: true,
      })

      newCurrentlyCreatedElement.defineNextAttribute(copiedPoint)
      addCurrentlyCreatedElement(newCurrentlyCreatedElement)

      const isReferenceClick = tool.name !== 'arc'
      addToolClick(clickedPoint, isReferenceClick)
    },
    [
      addCurrentlyCreatedElement,
      addElements,
      clearSnappedPoint,
      snappedPoint,
      currentlyCreatedElement,
      removeCurrentlyCreatedElement,
      tool.name,
      addToolClick,
      clearCurrentTool,
    ]
  )

  return handleDrawCmd
}

export default useDrawCommand
