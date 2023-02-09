import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Point from '../../drawingElements/point'
import { useToolsStore } from '../../stores/tools/index'

const useTrimCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyReplacedElements = useElementsStore((state) => state.currentlyReplacedElements)
  const continueReplacingElements = useElementsStore((state) => state.continueReplacingElements)

  const tool = useToolsStore((state) => state.tool)
  const toolClicks = useToolsStore((state) => state.toolClicks)
  const addToolClick = useToolsStore((state) => state.addToolClick)
  const removeLastToolClick = useToolsStore((state) => state.removeLastToolClick)

  const handleTrimCmd = useCallback(
    (clickedPoint: Point) => {
      if (!tool.isStarted) {
        return
      }

      let shouldAddClick = true
      if (currentlyReplacedElements && currentlyReplacedElements.currentReplacements) {
        continueReplacingElements()
        shouldAddClick = false
      }

      if (toolClicks) {
        removeLastToolClick()
        return
      }

      if (shouldAddClick) {
        addToolClick(clickedPoint)
      }
    },
    [
      currentlyReplacedElements,
      addToolClick,
      removeLastToolClick,
      continueReplacingElements,
      toolClicks,
      tool.isStarted,
    ]
  )

  return handleTrimCmd
}

export default useTrimCommand
