import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useTrimCommand = () => {
    const {
        elements: { currentlyReplacedElements, continueReplacingElements },
        tools: { tool, addToolClick, removeLastToolClick }
    } = useAppContext()

    const handleTrimCmd = useCallback(
        (event, clickedPoint) => {
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
        },
        [
            currentlyReplacedElements,
            addToolClick,
            removeLastToolClick,
            continueReplacingElements,
            tool.clicks,
            tool.isStarted
        ]
    )

    return handleTrimCmd
}

export default useTrimCommand
