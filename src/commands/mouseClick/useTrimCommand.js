import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useTrimCommand = () => {
    const { 
        elements: {
            currentlyReplacedElements,
            continueReplacingElements,
        },
    } = useElementsContext()

    const { tool, addToolClick, removeLastToolClick } = useToolsContext()

    const handleTrimCmd = useCallback((event, clickedPoint) => {
        if (!tool.isStarted) return

        let shouldAddClick = true
        if (currentlyReplacedElements && currentlyReplacedElements.currentReplacements) {
            continueReplacingElements()
            shouldAddClick = false
        }

        if (tool.clicks) {
            removeLastToolClick()
            return
        }
        
        if (shouldAddClick) {
            addToolClick(clickedPoint)
        }
    }, [
        currentlyReplacedElements,
        addToolClick, 
        removeLastToolClick,
        continueReplacingElements,
        tool.clicks, 
        tool.isStarted,
    ])

    return handleTrimCmd
}

export default useTrimCommand