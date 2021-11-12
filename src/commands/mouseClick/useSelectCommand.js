import { useCallback } from 'react'
import { useAppContext } from '../../contexts/AppContext'

const useSelectCommand = () => {
    const {
        elements: {
            startEditingElements,
            getElementsContainingPoint,
            getElementsInContainer,
            selection: {
                selectedElements,
                addSelectedElements,
                setSelectedElements,
                setSelectedPoints,
                removeSelectedElements
            },
            points: { findNearbyPoints }
        },
        tools: { tool, setTool, selectDelta, addToolClick, clearCurrentTool }
    } = useAppContext()

    const handleSelectCmd = useCallback(
        (event, clickedPoint) => {
            if (selectedElements && selectedElements.length > 0) {
                const nearbyPoints = findNearbyPoints(clickedPoint.x, clickedPoint.y, selectDelta)

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
                    setTool({ type: 'edit', name: 'edit' })
                    addToolClick(selectedPoints[0])
                    
                    startEditingElements(editedElements, false)
                    setSelectedPoints(selectedPoints)
                    setSelectedElements([...selectedElements])
                    return
                }
            }

            const clickedElements = getElementsContainingPoint(clickedPoint.x, clickedPoint.y, {
                maxPointsDiff: selectDelta
            })

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
            const newlySelectedElements = getElementsInContainer(initialClick, clickedPoint, {
                shouldSkipPartial: initialClick.x < clickedPoint.x
            })

            if (newlySelectedElements) {
                if (event.shiftKey) {
                    removeSelectedElements(newlySelectedElements)
                } else {
                    addSelectedElements(newlySelectedElements)
                }
            }

            clearCurrentTool()
            return
        },
        [
            getElementsContainingPoint,
            selectDelta,
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
        ]
    )

    return handleSelectCmd
}

export default useSelectCommand
