import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useCopyCommand = () => {
    const {
        elements: {
            completeCopyingElements,
            history: { addElements }
        },
        tools: { resetTool }
    } = useAppContext()

    const handleCopyCmd = useCallback(() => {
        const positionedCopies = completeCopyingElements()
        addElements(positionedCopies)
        resetTool()
    }, [addElements, completeCopyingElements, resetTool])

    return handleCopyCmd
}

export default useCopyCommand
