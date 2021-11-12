import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useEscapeCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            clearSnappedPoint,
            removeCurrentlyCreatedElement,
            currentlyEditedElements,
            stopEditingElements,
            currentlyCopiedElements,
            completeCopyingElements,
            selection: {
                selectedElements,
                clearSelection,
                clearSelectedPoints
            },
            history: {
                addElements
            },
        },
        tools: { 
            resetTool, 
            clearCurrentTool 
        }
    } = useAppContext()

    const handleEscapeCmd = useCallback(() => {
        if (currentlyCreatedElement) {
            if (currentlyCreatedElement.type === 'polyline' && currentlyCreatedElement.elements.length > 1) {
                currentlyCreatedElement.elements.pop()
                addElements([currentlyCreatedElement])
                resetTool()
    
                return
            }
    
            clearSnappedPoint()
            clearCurrentTool()
            removeCurrentlyCreatedElement()
            return
        }
    
        resetTool()
    
        if (currentlyEditedElements) {
            stopEditingElements()
            clearSelectedPoints()
            return
        }

        if (currentlyCopiedElements) {
            const positionedCopies = completeCopyingElements()
            addElements(positionedCopies)
            return
        }
    
        if (selectedElements && selectedElements.length > 0) {
            clearSelection()
        }
    
        clearSnappedPoint()
    }, [
        clearSelectedPoints, 
        clearSelection, 
        clearSnappedPoint, 
        currentlyCreatedElement, 
        currentlyEditedElements, 
        removeCurrentlyCreatedElement,
        selectedElements, 
        stopEditingElements,
        resetTool,
        clearCurrentTool,
        currentlyCopiedElements,
        completeCopyingElements,
        addElements
    ])

    return handleEscapeCmd
}

export default useEscapeCommand