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
        },
        selection: {
            selectedElements,
            clearSelection,
            clearSelectedPoints
        }
    } = useElementsContext() 

    const { setTool } = useToolsContext()

    const handleEscapeCmd = useCallback(() => {
        if (currentlyCreatedElement) {
            if (currentlyCreatedElement.type === 'polyline' && currentlyCreatedElement.elements.length > 1) {
                currentlyCreatedElement.elements.pop()
    
                return
            }
    
            clearSnappedPoint()
            removeCurrentlyCreatedElement()
            return
        }
    
        setTool({ type: 'select', name: 'select'})
    
        if (currentlyEditedElements) {
            stopEditingElements()
            clearSelectedPoints()
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
        setTool
    ])

    return handleEscapeCmd
}

export default useEscapeCommand