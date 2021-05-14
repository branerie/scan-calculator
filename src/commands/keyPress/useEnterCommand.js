import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useEnterCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            clearSnappedPoint,
            removeCurrentlyCreatedElement
        },
        history: {
            addElements
        }
    } = useElementsContext()

    const { clearCurrentTool } = useToolsContext()

    const handleEnterCmd = useCallback(() => {
        if (!currentlyCreatedElement || currentlyCreatedElement.baseType !== 'polyline') return

        if (currentlyCreatedElement.type === 'polyline') {
            currentlyCreatedElement.elements.pop()
        }

        clearSnappedPoint()

        currentlyCreatedElement.elements.forEach(e => e.id = uuidv4())
        addElements([currentlyCreatedElement])

        removeCurrentlyCreatedElement()
        clearCurrentTool()
    }, [addElements, clearSnappedPoint, currentlyCreatedElement, removeCurrentlyCreatedElement, clearCurrentTool])

    return handleEnterCmd
}

export default useEnterCommand