import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useCopyCommand = () => {
    const {
        elements: {
            currentlyCopiedElements,
            startCopyingElements,
            continueCopyingElements,
            selection: { selectedElements }
        },
        tools: { addToolClick }
    } = useAppContext()

    const handleCopyCmd = useCallback(
        (event, clickedPoint) => {
            if (!selectedElements) return

            if (!currentlyCopiedElements) {
                startCopyingElements(selectedElements)
                addToolClick(clickedPoint)
                return
            }

            continueCopyingElements()
        },
        [
            currentlyCopiedElements,
            selectedElements,
            addToolClick,
            startCopyingElements,
            continueCopyingElements
        ]
    )

    return handleCopyCmd
}

export default useCopyCommand
