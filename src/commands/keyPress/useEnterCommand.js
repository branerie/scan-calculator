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
            addElement
        }
    } = useElementsContext()

    const { setTool } = useToolsContext()

    const handleEnterCmd = useCallback(() => {
        if (!currentlyCreatedElement || currentlyCreatedElement.baseType !== 'polyline') return

        if (currentlyCreatedElement.type === 'polyline') {
            currentlyCreatedElement.elements.pop()
        }

        clearSnappedPoint()

        currentlyCreatedElement.elements.forEach(e => e.id = uuidv4())
        addElement(currentlyCreatedElement)

        removeCurrentlyCreatedElement()
        setTool({ type: 'select', name: 'select'})
    }, [addElement, clearSnappedPoint, currentlyCreatedElement, removeCurrentlyCreatedElement, setTool])

    return handleEnterCmd
}

export default useEnterCommand