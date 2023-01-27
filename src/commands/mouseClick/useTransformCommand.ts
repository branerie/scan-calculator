import { useCallback } from 'react'
import Point from '../../drawingElements/point'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'

const useTransformCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyEditedElements = elementsStore(state => state.currentlyEditedElements)
  const startEditingElements = elementsStore(state => state.startEditingElements)
  const editElements = elementsStore(state => state.editElements)
  const selectedElements = elementsStore(state => state.selectedElements)

  const toolsStore = useToolsStore()
  const addToolClick = toolsStore(state => state.addToolClick)
  const resetTool = toolsStore(state => state.resetTool)

  const handleTransformCmd = useCallback((clickedPoint: Point) => {
    if (!selectedElements) {
      return
    }

    if (!currentlyEditedElements) {
      startEditingElements(Array.from(selectedElements.values()))
      addToolClick(clickedPoint)
      return
    }

    editElements()
    resetTool()
    return
  }, [
    selectedElements,
    currentlyEditedElements,
    editElements,
    resetTool,
    startEditingElements,
    addToolClick
  ])

  return handleTransformCmd
}

export default useTransformCommand
