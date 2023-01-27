import { useCallback } from 'react'
import useKeyPress from '../../hooks/useKeyPress'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'
import { ENTER_KEY, ESCAPE_KEY, SPACE_KEY } from '../../utils/constants'

const useTrimCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyReplacedElements = elementsStore(state => state.currentlyReplacedElements)
  const updateReplacementSteps = elementsStore(state => state.updateReplacementSteps)
  const replaceElements = elementsStore(state => state.replaceElements)

  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool)
  const resetTool = toolsStore(state => state.resetTool)
  const startUsingTool = toolsStore(state => state.startUsingTool)

  const { undoIsPressed, redoIsPressed } = useKeyPress()

  const handleTrimCmd = useCallback((event: KeyboardEvent) => {
    if (tool.isStarted && currentlyReplacedElements?.completed) {
      if (undoIsPressed(event)) {
        return updateReplacementSteps(true)
      }

      if (redoIsPressed(event)) {
        return updateReplacementSteps(false)
      }
    }

    const isEscape = event.key === ESCAPE_KEY
    // if ((!currentlyReplacedElements || !currentlyReplacedElements.completed) && isEscape) {
    //     resetCurrentModifications()
    //     resetTool()

    //     return
    // }

    const isEnterOrSpace = event.key === ENTER_KEY || event.key === SPACE_KEY
    if (!tool.isStarted && isEnterOrSpace) {
      startUsingTool()
      return
    }

    if (isEnterOrSpace || isEscape) {
      if (currentlyReplacedElements?.completed) {
        replaceElements()
      }

      resetTool()
      return
    }
  }, [
    currentlyReplacedElements,
    tool.isStarted,
    // resetCurrentModifications,
    replaceElements,
    resetTool,
    startUsingTool,
    undoIsPressed,
    redoIsPressed,
    updateReplacementSteps
  ])

  return handleTrimCmd
}

export default useTrimCommand
