import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'
import { ENTER_KEY_CODE, ESCAPE_KEY_CODE, SPACE_KEY_CODE } from '../../utils/constants'

const useExtendCommand = () => {
    const {
        elements: {
            currentlyReplacedElements,
            resetCurrentModifications,
            history: { replaceElements }
        },
        tools: { tool, addToolProp, resetTool }
    } = useAppContext()

    const handleExtendCmd = useCallback(
        event => {
            const isEscape = event.keyCode === ESCAPE_KEY_CODE
            if ((!currentlyReplacedElements || !currentlyReplacedElements.completed) && isEscape) {
                resetCurrentModifications()
                resetTool()
                return
            }

            const isEnterOrSpace = event.keyCode === ENTER_KEY_CODE || event.keyCode === SPACE_KEY_CODE
            if (!tool.isStarted && isEnterOrSpace) {
                addToolProp('isStarted', true)
                return
            }

            if (isEnterOrSpace || isEscape) {
                replaceElements() // edit?
                resetTool()
                return
            }
        },
        [
            currentlyReplacedElements,
            tool.isStarted,
            resetCurrentModifications,
            addToolProp,
            replaceElements,
            resetTool
        ]
    )

    return handleExtendCmd
}

export default useExtendCommand
