import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'

const useDeleteCommand = () => {
    const {
        selection: {
            selectedElements,
            currentlyEditedElements,
            clearSelection
        },
        history: {
            deleteElements
        }
    } = useElementsContext()

    const handleDeleteCmd = useCallback(() => {
        if (!selectedElements || selectedElements.length === 0 || currentlyEditedElements) return

        deleteElements(selectedElements)
        clearSelection()
    }, [clearSelection, deleteElements, selectedElements, currentlyEditedElements])

    return handleDeleteCmd
}

export default useDeleteCommand