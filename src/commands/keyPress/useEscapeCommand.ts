import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Polyline from '../../drawingElements/polyline'
import { useToolsStore } from '../../stores/tools/index'

const useEscapeCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyCreatedElement = useElementsStore((state) => state.currentlyCreatedElement)
  const clearSnappedPoint = useElementsStore((state) => state.clearSnappedPoint)
  const removeCurrentlyCreatedElement = useElementsStore((state) => state.removeCurrentlyCreatedElement)
  const currentlyEditedElements = useElementsStore((state) => state.currentlyEditedElements)
  const stopEditingElements = useElementsStore((state) => state.stopEditingElements)
  const currentlyCopiedElements = useElementsStore((state) => state.currentlyCopiedElements)
  const completeCopyingElements = useElementsStore((state) => state.completeCopyingElements)
  const selectedElements = useElementsStore((state) => state.selectedElements)
  const clearSelection = useElementsStore((state) => state.clearSelection)
  const clearSelectedPoints = useElementsStore((state) => state.clearSelectedPoints)
  const addElements = useElementsStore((state) => state.addElements)

  const resetTool = useToolsStore((state) => state.resetTool)
  const clearCurrentTool = useToolsStore((state) => state.clearCurrentTool)

  const handleEscapeCmd = useCallback(() => {
    if (currentlyCreatedElement) {
      if (
        currentlyCreatedElement.type === 'polyline' &&
        (currentlyCreatedElement as Polyline).elements.length > 1
      ) {
        ;(currentlyCreatedElement as Polyline).elements.pop()
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
    addElements,
  ])

  return handleEscapeCmd
}

export default useEscapeCommand
