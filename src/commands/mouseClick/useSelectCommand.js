import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { SELECT_DELTA } from '../../utils/constants'
import ElementManipulator from '../../utils/elementManipulator'

const useSelectCommand = () => {
    const {
        elements: {
            elements,
            startEditingElements,
            findNearbyPoints,
        },
        selection: {
            selectedElements,
            addSelectedElements,
            setSelectedElements,
            setSelectedPoints,
        }
    } = useElementsContext()

    const { setTool, currentScale } = useToolsContext()

    const handleSelectCmd = useCallback((event, clickedPoint) => {
        if (event.shiftKey) {
            const newlySelectedElements = selectedElements.filter(e => 
                !e.checkIfPointOnElement(clickedPoint, SELECT_DELTA / currentScale))
             setSelectedElements(newlySelectedElements)
            return
        }

        if (selectedElements && selectedElements.length > 0) {
            const nearbyPoints = findNearbyPoints(clickedPoint.x, clickedPoint.y, SELECT_DELTA)

            const selectedPoints = []
            const editedElements = []
            for (const point of nearbyPoints) {
                const editedElement = selectedElements.find(se => se.getPointById(point.pointId))
                if (editedElement) {
                    selectedPoints.push(point)
                    editedElements.push(editedElement)
                    // editedElement.isShown = false
                }
            }

            if (editedElements.length > 0) {
                startEditingElements(editedElements)
                setSelectedPoints(selectedPoints)
                setSelectedElements([...selectedElements])
                setTool({ type: 'edit', name: 'edit' })
                return
            }
        }

        const newlySelectedElements = elements.filter(e =>
            e.checkIfPointOnElement(clickedPoint, SELECT_DELTA / currentScale))
        addSelectedElements(newlySelectedElements)
    }, [
        addSelectedElements, 
        currentScale, 
        elements, 
        findNearbyPoints, 
        selectedElements, 
        setSelectedElements, 
        setSelectedPoints, 
        setTool, 
        startEditingElements
    ])

    return handleSelectCmd
}

export default useSelectCommand