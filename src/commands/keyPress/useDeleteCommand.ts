import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'

const useDeleteCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const selectedElements = useElementsStore((state) => state.selectedElements)
  const currentlyEditedElements = useElementsStore((state) => state.currentlyEditedElements)
  const clearSelection = useElementsStore((state) => state.clearSelection)
  const deleteElements = useElementsStore((state) => state.deleteElements)

  const handleDeleteCmd = useCallback(() => {
    if (!selectedElements || selectedElements.size === 0 || currentlyEditedElements) {
      return
    }

    deleteElements(Array.from(selectedElements.values()))
    clearSelection()
  }, [clearSelection, deleteElements, selectedElements, currentlyEditedElements])

  return handleDeleteCmd
}

export default useDeleteCommand
