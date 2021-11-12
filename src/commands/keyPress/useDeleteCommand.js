import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useDeleteCommand = () => {
    const {
        elements: {
            selection: { selectedElements, currentlyEditedElements, clearSelection },
            history: { deleteElements }
        }
    } = useAppContext()

    const handleDeleteCmd = useCallback(() => {
        if (!selectedElements || selectedElements.length === 0 || currentlyEditedElements) return

        deleteElements(selectedElements)
        clearSelection()
    }, [clearSelection, deleteElements, selectedElements, currentlyEditedElements])

    return handleDeleteCmd
}

export default useDeleteCommand
