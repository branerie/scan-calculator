import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useTrimCommand = () => {
    const { 
        elements: {
            currentlyReplacedElements
        },
        history: {
            replaceElements
        }
    } = useElementsContext()

    const { tool, resetTool, addToolClick, removeLastToolClick } = useToolsContext()

    const handleTrimCmd = useCallback((event, clickedPoint) => {
        if (!tool.isStarted) return

        if (currentlyReplacedElements) {
            replaceElements()
            resetTool()
            return
        }

        if (tool.clicks) {
            removeLastToolClick()
            return
        }
        
        addToolClick(clickedPoint)
    }, [
        currentlyReplacedElements,
        addToolClick, 
        removeLastToolClick,
        replaceElements,
        tool.clicks, 
        tool.isStarted,
        resetTool
    ])

    return handleTrimCmd
}

export default useTrimCommand