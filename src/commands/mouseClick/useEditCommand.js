import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useEditCommand = () => {
    const {
        elements: {
            currentlyEditedElements,
            history: { editElements }
        },
        tools: { resetTool }
    } = useAppContext()

    const handleEditCmd = useCallback(() => {
        if (!currentlyEditedElements) return

        editElements(currentlyEditedElements)
        resetTool()
    }, [currentlyEditedElements, editElements, resetTool])

    return handleEditCmd
}

export default useEditCommand
