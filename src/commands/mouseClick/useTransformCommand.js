import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useTransformCommand = () => {
    const {
        elements: {
            currentlyEditedElements,
            startEditingElements,
            history: { editElements },
            selection: { selectedElements }
        },
        tools: { addToolClick, resetTool }
    } = useAppContext()

    const handleTransformCmd = useCallback(
        (event, clickedPoint) => {
            if (!selectedElements) return

            if (!currentlyEditedElements) {
                startEditingElements(selectedElements)
                addToolClick(clickedPoint)
                return
            }

            editElements()
            resetTool()
            return
        },
        [
            selectedElements,
            currentlyEditedElements,
            editElements,
            resetTool,
            startEditingElements,
            addToolClick
        ]
    )

    return handleTransformCmd
}

export default useTransformCommand
