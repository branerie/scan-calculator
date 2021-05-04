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

    const { tool, setTool } = useToolsContext()
    
    const handleCopyCmd = useCallback((event, clickedPoint) => {
        if (!selectedElements) return

        if (tool.name === 'copy') {
            if (!currentlyCopiedElements) {
                startCopyingElements(selectedElements)
                setTool({ ...tool, basePoint: clickedPoint })
                return
            }

            addElements(currentlyCopiedElements)
            startCopyingElements(currentlyCopiedElements)
            return
        }
    }, [addElements, currentlyCopiedElements, selectedElements, setTool, startCopyingElements, tool])

    return handleCopyCmd
}

export default useCopyCommand