import { useCallback } from 'react'
import Point from '../../drawingElements/point'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'

const useTrimCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyReplacedElements = elementsStore(state => state.currentlyReplacedElements)
  const continueReplacingElements = elementsStore(state => state.continueReplacingElements)

  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool)
  const toolClicks = toolsStore(state => state.toolClicks)
  const addToolClick = toolsStore(state => state.addToolClick)
  const removeLastToolClick = toolsStore(state => state.removeLastToolClick)
  
  const handleTrimCmd = useCallback((clickedPoint: Point) => {
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
  }, [
    currentlyReplacedElements,
    addToolClick,
    removeLastToolClick,
    continueReplacingElements,
    toolClicks,
    tool.isStarted
  ])

  return handleTrimCmd
}

export default useTrimCommand
