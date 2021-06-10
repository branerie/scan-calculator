import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useCopyCommand = () => {
    const {
        elements: {
            completeCopyingElements
        },
        history: {
            addElements
        }
    } = useElementsContext()

    const { resetTool } = useToolsContext()

    const handleCopyCmd = useCallback(() => {
        const positionedCopies = completeCopyingElements()
        addElements(positionedCopies)
        resetTool()
    }, [addElements, completeCopyingElements, resetTool])

    return handleCopyCmd
}

export default useCopyCommand