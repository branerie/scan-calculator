import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Point from '../../drawingElements/point'
import { useToolsStore } from '../../stores/tools/index'

const useTransformCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyEditedElements = useElementsStore((state) => state.currentlyEditedElements)
  const startEditingElements = useElementsStore((state) => state.startEditingElements)
  const editElements = useElementsStore((state) => state.editElements)
  const selectedElements = useElementsStore((state) => state.selectedElements)

  const addToolClick = useToolsStore((state) => state.addToolClick)
  const resetTool = useToolsStore((state) => state.resetTool)

  const handleTransformCmd = useCallback(
    (clickedPoint: Point) => {
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
    },
    [selectedElements, currentlyEditedElements, editElements, resetTool, startEditingElements, addToolClick]
  )

  return handleTransformCmd
}

export default useTransformCommand
