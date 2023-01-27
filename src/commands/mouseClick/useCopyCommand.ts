import { useCallback } from 'react'
import Point from '../../drawingElements/point'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'

const useCopyCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyCopiedElements = elementsStore(state => state.currentlyCopiedElements)
  const startCopyingElements = elementsStore(state => state.startCopyingElements)
  const continueCopyingElements = elementsStore(state => state.continueCopyingElements)
  const selectedElements = elementsStore(state => state.selectedElements)

  const addToolClick = useToolsStore()(state => state.addToolClick)

  const handleCopyCmd = useCallback((clickedPoint: Point) => {
    if (!selectedElements) {
      return
    }

    if (!currentlyCopiedElements) {
      startCopyingElements(Array.from(selectedElements.values()))
      addToolClick(clickedPoint)
      return
    }

    continueCopyingElements()
  }, [
    currentlyCopiedElements,
    selectedElements,
    addToolClick,
    startCopyingElements,
    continueCopyingElements
  ])

  return handleCopyCmd
}

export default useCopyCommand
