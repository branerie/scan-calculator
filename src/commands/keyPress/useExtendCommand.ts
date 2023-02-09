import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import useKeyPress from '../../hooks/useKeyPress'
import { useToolsStore } from '../../stores/tools/index'
import { ENTER_KEY, ESCAPE_KEY, SPACE_KEY } from '../../utils/constants'

const useExtendCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const currentlyReplacedElements = useElementsStore((state) => state.currentlyReplacedElements)
  const updateReplacementSteps = useElementsStore((state) => state.updateReplacementSteps)
  const replaceElements = useElementsStore((state) => state.replaceElements)

  const tool = useToolsStore((state) => state.tool)
  const startUsingTool = useToolsStore((state) => state.startUsingTool)
  const resetTool = useToolsStore((state) => state.resetTool)

  const { undoIsPressed, redoIsPressed } = useKeyPress()

  const handleExtendCmd = useCallback(
    (event: KeyboardEvent) => {
      if (tool.isStarted && currentlyReplacedElements?.completed) {
        if (undoIsPressed(event)) {
          return updateReplacementSteps(true)
        }

        if (redoIsPressed(event)) {
          return updateReplacementSteps(false)
        }
      }

      const isEscape = event.key === ESCAPE_KEY
      // if (!currentlyReplacedElements?.completed && isEscape) {
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
    },
    [
      currentlyReplacedElements,
      tool.isStarted,
      // resetCurrentModifications,
      startUsingTool,
      replaceElements,
      resetTool,
      undoIsPressed,
      redoIsPressed,
      updateReplacementSteps,
    ]
  )

  return handleExtendCmd
}

export default useExtendCommand
