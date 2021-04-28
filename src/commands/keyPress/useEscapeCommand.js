import { useCallback } from "react"
import { useMainContext } from "../../contexts/MainContext"

const useEscapeCommand = () => {
    const { 
        currentlyCreatedElement, 
        currentlyEditedElements, 
        selectedElements, 
        elements, 
        setCurrentlyEditedElements,
        setCurrentlyCreatedElement,
        setElements, 
        setSnappedPoint,
        clearSelectedPoints,
        clearSelection,
        setTool
    } = useMainContext()

    const handleEscapeCmd = useCallback(() => {
        if (currentlyCreatedElement) {
            if (currentlyCreatedElement.type === 'polyline' && currentlyCreatedElement.elements.length > 1) {
                currentlyCreatedElement.elements.pop()
    
                return
            }
    
            setSnappedPoint(null)
            return setCurrentlyCreatedElement(null)
        }
    
        setTool({ type: 'select', name: 'select'})
    
        if (currentlyEditedElements) {
            selectedElements.forEach(e => e.isShown = true)
            setCurrentlyEditedElements(null)
            setElements([...elements])
            setSnappedPoint(null)
            return clearSelectedPoints()
        }
    
        if (selectedElements && selectedElements.length > 0) {
            clearSelection()
        }
    
        setSnappedPoint(null)
    }, [
        clearSelectedPoints, 
        clearSelection, 
        currentlyCreatedElement, 
        currentlyEditedElements, 
        elements,
        selectedElements, 
        setCurrentlyCreatedElement, 
        setCurrentlyEditedElements, 
        setElements, 
        setSnappedPoint, 
        setTool
    ])

    return handleEscapeCmd
}

export default useEscapeCommand