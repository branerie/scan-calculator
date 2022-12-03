import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'
import useKeyPress from '../../hooks/useKeyPress'
import { ENTER_KEY_CODE, ESCAPE_KEY_CODE, SPACE_KEY_CODE } from '../../utils/constants'

const useExtendCommand = () => {
    const {
        elements: {
            currentlyReplacedElements,
            updateReplacementSteps,
            history: { replaceElements }
        },
        tools: { tool, startUsingTool, resetTool }
    } = useAppContext()

    const { undoIsPressed, redoIsPressed } = useKeyPress()

    const handleExtendCmd = useCallback(
        event => {
            if (tool.isStarted && currentlyReplacedElements?.completed) {
                if (undoIsPressed(event)) {
                    return updateReplacementSteps(true)
                }

                if (redoIsPressed(event)) {
                    return updateReplacementSteps(false)
                }
            }

            const isEscape = event.keyCode === ESCAPE_KEY_CODE
            // if (!currentlyReplacedElements?.completed && isEscape) {
            //     resetCurrentModifications()
            //     resetTool()
            //     return
            // }

            const isEnterOrSpace = event.keyCode === ENTER_KEY_CODE || event.keyCode === SPACE_KEY_CODE
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
            updateReplacementSteps
        ]
    )

    return handleExtendCmd
}

export default useExtendCommand
