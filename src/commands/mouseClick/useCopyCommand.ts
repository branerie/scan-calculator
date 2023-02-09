import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Point from '../../drawingElements/point'
import { useToolsStore } from '../../stores/tools/index'

const useCopyCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyCopiedElements = useElementsStore((state) => state.currentlyCopiedElements)
  const startCopyingElements = useElementsStore((state) => state.startCopyingElements)
  const continueCopyingElements = useElementsStore((state) => state.continueCopyingElements)
  const selectedElements = useElementsStore((state) => state.selectedElements)

  const addToolClick = useToolsStore((state) => state.addToolClick)

  const handleCopyCmd = useCallback(
    (clickedPoint: Point) => {
      if (!selectedElements) {
        return
      }

      if (!currentlyCopiedElements) {
        startCopyingElements(Array.from(selectedElements.values()))
        addToolClick(clickedPoint)
        return
      }

      continueCopyingElements()
    },
    [currentlyCopiedElements, selectedElements, addToolClick, startCopyingElements, continueCopyingElements]
  )

  return handleCopyCmd
}

export default useCopyCommand
