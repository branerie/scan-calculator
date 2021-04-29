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

    const { setTool } = useToolsContext()

    const handleEditCmd = useCallback(() => {
        if (!currentlyEditedElements) {
            return
        }

        setTool({ type: 'select', name: 'select'})
        editElements(currentlyEditedElements)
    }, [currentlyEditedElements, editElements, setTool])

    return handleEditCmd
}

export default useEditCommand