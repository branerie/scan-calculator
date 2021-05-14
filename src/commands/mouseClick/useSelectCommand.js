import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { SELECT_DELTA } from '../../utils/constants'

const useSelectCommand = () => {
    const {
        elements: {
            startEditingElements,
            findNearbyPoints,
            getElementsContainingPoint,
            getElementsInContainer,
        },
        selection: {
            selectedElements,
            addSelectedElements,
            setSelectedElements,
            setSelectedPoints,
            removeSelectedElements,
        }
    } = useElementsContext()

    const { tool, setTool, currentScale, addToolClick, clearCurrentTool } = useToolsContext()

    const handleSelectCmd = useCallback((event, clickedPoint) => {
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

        const clickedElements = getElementsContainingPoint(clickedPoint.x, clickedPoint.y, SELECT_DELTA / currentScale)
        if (!tool.clicks) {
            if (clickedElements) {
                if (event.shiftKey) {
                    removeSelectedElements(clickedElements)
                    return
                }
    
                addSelectedElements(clickedElements)
                return    
            }

            addToolClick(clickedPoint, false)
            return
        }

        const initialClick = tool.clicks[0]
        const newlySelectedElements = getElementsInContainer(initialClick, clickedPoint, initialClick.x < clickedPoint.x)
        if (newlySelectedElements) {
            if (event.shiftKey) {
                removeSelectedElements(newlySelectedElements)
            } else {
                addSelectedElements(newlySelectedElements)
            }
        }

        clearCurrentTool()
        return
    }, [
        getElementsContainingPoint, 
        currentScale, 
        tool.clicks, 
        getElementsInContainer, 
        clearCurrentTool, 
        selectedElements, 
        addToolClick, 
        addSelectedElements, 
        removeSelectedElements, 
        findNearbyPoints, 
        startEditingElements, 
        setSelectedPoints, 
        setSelectedElements, 
        setTool
    ])

    return handleSelectCmd
}

export default useSelectCommand