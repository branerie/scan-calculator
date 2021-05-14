import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'

const useEscapeCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            clearSnappedPoint,
            removeCurrentlyCreatedElement,
            currentlyEditedElements,
            stopEditingElements,
            currentlyCopiedElements,
            clearCopyingElements,
        },
        selection: {
            selectedElements,
            clearSelection,
            clearSelectedPoints
        }
    } = useElementsContext() 

    const { resetTool, clearCurrentTool } = useToolsContext()

    const handleEscapeCmd = useCallback(() => {
        if (currentlyCreatedElement) {
            if (currentlyCreatedElement.type === 'polyline' && currentlyCreatedElement.elements.length > 1) {
                currentlyCreatedElement.elements.pop()
    
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
            clearCopyingElements()
            clearSnappedPoint()
            return
        }
    
        if (selectedElements && selectedElements.length > 0) {
            clearSelection()
        }
    
        clearSnappedPoint()
    }, [
        clearCopyingElements,
        clearSelectedPoints, 
        clearSelection, 
        clearSnappedPoint, 
        currentlyCopiedElements,
        currentlyCreatedElement, 
        currentlyEditedElements, 
        removeCurrentlyCreatedElement, 
        selectedElements, 
        stopEditingElements,
        resetTool,
        clearCurrentTool
    ])

    return handleEscapeCmd
}

export default useEscapeCommand