import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import ElementManipulator from '../../utils/elementManipulator'

const useUndoRedoCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            addCurrentlyCreatedElement
        },
        history: {
            undo,
            redo
        }
    } = useElementsContext()

    const { tool } = useToolsContext()

    const handleUndoRedoCmd = useCallback((event) => {
        if (currentlyCreatedElement && currentlyCreatedElement.type === 'polyline') {
            const createdElementCopy = ElementManipulator.copyElement(currentlyCreatedElement)
            const removedElement = createdElementCopy.elements.pop()
            const removedElementLastPoint = removedElement.pointB

            const currentLastElement = createdElementCopy.elements[createdElementCopy.elements.length - 1]
            currentLastElement.setPointB(removedElementLastPoint.x, removedElementLastPoint.y)

            addCurrentlyCreatedElement(createdElementCopy)

            return
        }

        if (tool.type !== 'select') return

        if (event.key && event.key.toLowerCase() === 'z') {
            undo()
            return
        }
        
        if (event.key && event.key.toLowerCase() === 'y') {
            redo()
        }
    }, [currentlyCreatedElement, tool.type, addCurrentlyCreatedElement, undo, redo])

    return handleUndoRedoCmd
}

export default useUndoRedoCommand