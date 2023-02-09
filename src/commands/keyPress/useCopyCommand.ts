import { useCallback } from 'react'
import { useToolsStore } from '../../stores/tools/index'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'

const useCopyCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const completeCopyingElements = useElementsStore((state) => state.completeCopyingElements)
  const addElements = useElementsStore((state) => state.addElements)
  const resetTool = useToolsStore((state) => state.resetTool)

  const handleCopyCmd = useCallback(() => {
    const positionedCopies = completeCopyingElements()
    addElements(positionedCopies)
    resetTool()
  }, [addElements, completeCopyingElements, resetTool])

  return handleCopyCmd
}

export default useCopyCommand
