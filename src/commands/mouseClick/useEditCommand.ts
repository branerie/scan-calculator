import { useCallback } from 'react'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'

const useEditCommand = () => {
  const elementsStore = useElementsStore()
  const editElements = elementsStore(state => state.editElements)
  const resetTool = useToolsStore()(state => state.resetTool)

  const handleEditCmd = useCallback(() => {
    editElements()
    resetTool()
  }, [editElements, resetTool])

  return handleEditCmd
}

export default useEditCommand