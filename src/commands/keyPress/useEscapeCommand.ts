import { useCallback } from 'react'
import Polyline from '../../drawingElements/polyline'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'

const useEscapeCommand = () => {
  const elementsstore = useElementsStore()
  const currentlyCreatedElement = elementsstore(state => state.currentlyCreatedElement)
  const clearSnappedPoint = elementsstore(state => state.clearSnappedPoint)
  const removeCurrentlyCreatedElement = elementsstore(state => state.removeCurrentlyCreatedElement)
  const currentlyEditedElements = elementsstore(state => state.currentlyEditedElements)
  const stopEditingElements = elementsstore(state => state.stopEditingElements)
  const currentlyCopiedElements = elementsstore(state => state.currentlyCopiedElements)
  const completeCopyingElements = elementsstore(state => state.completeCopyingElements)
  const selectedElements = elementsstore(state => state.selectedElements)
  const clearSelection = elementsstore(state => state.clearSelection)
  const clearSelectedPoints = elementsstore(state => state.clearSelectedPoints)
  const addElements = elementsstore(state => state.addElements)

  const toolsStore = useToolsStore()
  const resetTool = toolsStore(state => state.resetTool)
  const clearCurrentTool = toolsStore(state => state.clearCurrentTool)

  const handleEscapeCmd = useCallback(() => {
    if (currentlyCreatedElement) {
      if (
        currentlyCreatedElement instanceof Polyline && 
        currentlyCreatedElement.elements.length > 1
      ) {
        currentlyCreatedElement.elements.pop()
        addElements([currentlyCreatedElement])
        resetTool()

        return
      }

      clearSnappedPoint()
      clearCurrentTool()
      removeCurrentlyCreatedElement()
      return
    }

    resetTool()

    if (currentlyEditedElements) {
      stopEditingElements()
      clearSelectedPoints()
      return
    }

    if (currentlyCopiedElements) {
      const positionedCopies = completeCopyingElements()
      addElements(positionedCopies)
      return
    }

    if (selectedElements && selectedElements.size > 0) {
      clearSelection()
    }

    clearSnappedPoint()
  }, [
    clearSelectedPoints, 
    clearSelection, 
    clearSnappedPoint, 
    currentlyCreatedElement, 
    currentlyEditedElements, 
    removeCurrentlyCreatedElement,
    selectedElements, 
    stopEditingElements,
    resetTool,
    clearCurrentTool,
    currentlyCopiedElements,
    completeCopyingElements,
    addElements
  ])

  return handleEscapeCmd
}

export default useEscapeCommand