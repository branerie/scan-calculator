import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { ENTER_KEY_CODE, ESCAPE_KEY_CODE, SPACE_KEY_CODE } from '../../utils/constants'

const useExtendCommand = () => {
    const {
        elements: {
            currentlyReplacedElements
        },
        history: {
            replaceElements
        }
    } = useElementsContext()

    const { tool, addToolProp, resetTool } = useToolsContext()
    
    const handleExtendCmd = useCallback((event) => {
        const isEscape = event.keyCode === ESCAPE_KEY_CODE
        if ((!currentlyReplacedElements || !currentlyReplacedElements.completed) && isEscape) {
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
    }, [addToolProp, resetTool, replaceElements, currentlyReplacedElements, tool.isStarted])

    return handleExtendCmd
}

export default useExtendCommand