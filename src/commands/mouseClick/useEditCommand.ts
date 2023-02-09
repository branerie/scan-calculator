import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import { useToolsStore } from '../../stores/tools/index'

const useEditCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const editElements = useElementsStore((state) => state.editElements)
  const resetTool = useToolsStore((state) => state.resetTool)

  const handleEditCmd = useCallback(() => {
    editElements()
    resetTool()
  }, [editElements, resetTool])

  return handleEditCmd
}

export default useEditCommand
