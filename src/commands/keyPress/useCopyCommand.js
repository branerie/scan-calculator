import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useCopyCommand = () => {
    const {
        elements: {
            finishCopyingElements
        },
        history: {
            addElements
        }
    } = useElementsContext()

    const { resetTool } = useToolsContext()

    const handleCopyCmd = useCallback(() => {
        const positionedCopies = finishCopyingElements()
        addElements(positionedCopies)
        resetTool()
    }, [addElements, finishCopyingElements, resetTool])

    return handleCopyCmd
}

export default useCopyCommand