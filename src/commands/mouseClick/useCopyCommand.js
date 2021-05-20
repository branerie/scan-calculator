import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useCopyCommand = () => {
    const {
        elements: {
            currentlyCopiedElements,
            startCopyingElements,
            continueCopyingElements,
        },
        selection: {
            selectedElements
        }
    } = useElementsContext()

    const { addToolClick } = useToolsContext()
    
    const handleCopyCmd = useCallback((event, clickedPoint) => {
        if (!selectedElements) return

        if (!currentlyCopiedElements) {
            startCopyingElements(selectedElements)
            addToolClick(clickedPoint)
            return
        }

        continueCopyingElements()
    }, [currentlyCopiedElements, selectedElements, addToolClick, startCopyingElements, continueCopyingElements])

    return handleCopyCmd
}

export default useCopyCommand