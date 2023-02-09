import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Polyline from '../../drawingElements/polyline'
import { useToolsStore } from '../../stores/tools/index'
import { generateId } from '../../utils/general'

const useDrawCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyCreatedElement = useElementsStore((state) => state.currentlyCreatedElement)
  const clearSnappedPoint = useElementsStore((state) => state.clearSnappedPoint)
  const removeCurrentlyCreatedElement = useElementsStore((state) => state.removeCurrentlyCreatedElement)
  const addElements = useElementsStore((state) => state.addElements)

  const clearCurrentTool = useToolsStore((state) => state.clearCurrentTool)

  const handleEnterCmd = useCallback(() => {
    if (!currentlyCreatedElement || !(currentlyCreatedElement instanceof Polyline)) {
      return
    }

    if (currentlyCreatedElement.type === 'polyline') {
      currentlyCreatedElement.completeDefinition()
    }

    currentlyCreatedElement.elements.forEach((e) => (e.id = generateId()))

    clearSnappedPoint()

    addElements([currentlyCreatedElement])
    removeCurrentlyCreatedElement()
    clearCurrentTool()
  }, [
    addElements,
    clearSnappedPoint,
    currentlyCreatedElement,
    removeCurrentlyCreatedElement,
    clearCurrentTool,
  ])

  return handleEnterCmd
}

export default useDrawCommand
