import { useCallback } from 'react'
import Polyline from '../../drawingElements/polyline'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'
import { generateId } from '../../utils/general'

const useDrawCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyCreatedElement = elementsStore(state => state.currentlyCreatedElement)
  const clearSnappedPoint = elementsStore(state => state.clearSnappedPoint)
  const removeCurrentlyCreatedElement = elementsStore(state => state.removeCurrentlyCreatedElement)
  const addElements = elementsStore(state => state.addElements)

  const toolsStore = useToolsStore()
  const clearCurrentTool = toolsStore(state => state.clearCurrentTool)

  const handleEnterCmd = useCallback(() => {
    if (!currentlyCreatedElement || !(currentlyCreatedElement instanceof Polyline)) {
      return
    }

    if (currentlyCreatedElement.type === 'polyline') {
      currentlyCreatedElement.completeDefinition()
    }
    
    currentlyCreatedElement.elements.forEach(e => (e.id = generateId()))

    clearSnappedPoint()
    
    addElements([currentlyCreatedElement])
    removeCurrentlyCreatedElement()
    clearCurrentTool()
  }, [
    addElements,
    clearSnappedPoint,
    currentlyCreatedElement,
    removeCurrentlyCreatedElement,
    clearCurrentTool
  ])

  return handleEnterCmd
}

export default useDrawCommand
