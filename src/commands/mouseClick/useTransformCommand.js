import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useTransformCommand = () => {
    const {
        elements: {
            currentlyEditedElements,
            startEditingElements,
        },
        history: {
            editElements,
        },
        selection: {
            selectedElements,
        }
    } = useElementsContext()
    const { addToolClick, resetTool } = useToolsContext()

    const handleTransformCmd = useCallback((event, clickedPoint) => {
        if (!selectedElements) return

        if (!currentlyEditedElements) {
            startEditingElements(selectedElements)
            addToolClick(clickedPoint)
            return
        }

        editElements()
        resetTool()
        return
    }, [
        selectedElements,
        currentlyEditedElements, 
        editElements, 
        resetTool, 
        startEditingElements, 
        addToolClick,
    ])

    return handleTransformCmd
}

export default useTransformCommand