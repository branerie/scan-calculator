import { useCallback, useState } from 'react'
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
            selectedElements
        }
    } = useElementsContext()
    const { tool, setTool } = useToolsContext()

    const handleTransformCmd = useCallback((event, clickedPoint) => {
        if (!selectedElements) return

        if (tool.name === 'move') {
            if (!currentlyEditedElements) {
                startEditingElements(selectedElements)
                setTool({ ...tool, initialClick: clickedPoint })
                return
            }

            editElements()
            setTool({ type: 'select', name: 'select' })
        }
    }, [currentlyEditedElements, editElements, selectedElements, setTool, startEditingElements, tool])

    return handleTransformCmd
}

export default useTransformCommand