import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useCopyCommand = () => {
    const {
        elements: {
            currentlyCopiedElements,
            startCopyingElements,
        },
        selection: {
            selectedElements
        },
        history: {
            addElements
        }
    } = useElementsContext()

    const { tool, addToolClick } = useToolsContext()
    
    const handleCopyCmd = useCallback((event, clickedPoint) => {
        if (!selectedElements) return

        if (tool.name === 'copy') {
            if (!currentlyCopiedElements) {
                startCopyingElements(selectedElements)
                addToolClick(clickedPoint)
                return
            }

            addElements(currentlyCopiedElements)
            startCopyingElements(currentlyCopiedElements)
            return
        }
    }, [addElements, currentlyCopiedElements, selectedElements, addToolClick, startCopyingElements, tool])

    return handleCopyCmd
}

export default useCopyCommand