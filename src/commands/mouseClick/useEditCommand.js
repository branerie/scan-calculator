import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useEditCommand = () => {
    const {
        elements: {
            currentlyEditedElements
        },
        history: {
            editElements
        }
    } = useElementsContext()

    const { resetTool } = useToolsContext()

    const handleEditCmd = useCallback(() => {
        if (!currentlyEditedElements) return

        resetTool()
        editElements(currentlyEditedElements)
    }, [currentlyEditedElements, editElements, resetTool])

    return handleEditCmd
}

export default useEditCommand