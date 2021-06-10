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
            currentlyReplacedElements,
            clearReplacingElements,
            currentlyCopiedElements,
            completeCopyingElements,
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
            completeCopyingElements()
            return
        }

        if (currentlyReplacedElements) {
            clearReplacingElements()
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
        currentlyReplacedElements,
        clearReplacingElements, 
        selectedElements, 
        stopEditingElements,
        resetTool,
        clearCurrentTool,
        currentlyCopiedElements,
        completeCopyingElements
    ])

    return handleEscapeCmd
}

export default useEscapeCommand