import { useCallback } from 'react'
import useElementsStore from '../../stores/elements/index'

const useDeleteCommand = () => {
  const elementsStore = useElementsStore()

  const selectedElements = elementsStore(state => state.selectedElements)
  const currentlyEditedElements = elementsStore(state => state.currentlyEditedElements)
  const clearSelection = elementsStore(state => state.clearSelection)
  const deleteElements = elementsStore(state => state.deleteElements)

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
