import { useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useAppContext } from '../../contexts/AppContext'

const useDrawCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            clearSnappedPoint,
            removeCurrentlyCreatedElement,
            history: { addElements }
        },
        tools: { clearCurrentTool }
    } = useAppContext()

    const handleEnterCmd = useCallback(() => {
        if (!currentlyCreatedElement || currentlyCreatedElement.baseType !== 'polyline') return

        if (currentlyCreatedElement.type === 'polyline') {
            currentlyCreatedElement.completeDefinition()
        }

        clearSnappedPoint()

        currentlyCreatedElement.elements.forEach(e => (e.id = uuidv4()))
        addElements([currentlyCreatedElement])

        removeCurrentlyCreatedElement()
        clearCurrentTool()
    }, [
        addElements,
        clearSnappedPoint,
        currentlyCreatedElement,
        removeCurrentlyCreatedElement,
        clearCurrentTool
    ])

    return handleEnterCmd
}

export default useDrawCommand
