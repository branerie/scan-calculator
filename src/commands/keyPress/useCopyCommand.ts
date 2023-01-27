import { useCallback } from 'react'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'

const useCopyCommand = () => {
  const elementsStore = useElementsStore()
  const toolsStore = useToolsStore()
  const completeCopyingElements = elementsStore(state => state.completeCopyingElements)
  const addElements = elementsStore(state => state.addElements)
  const resetTool = toolsStore(state => state.resetTool)

  const handleCopyCmd = useCallback(() => {
    const positionedCopies = completeCopyingElements()
    addElements(positionedCopies)
    resetTool()
  }, [addElements, completeCopyingElements, resetTool])

  return handleCopyCmd
}

export default useCopyCommand
