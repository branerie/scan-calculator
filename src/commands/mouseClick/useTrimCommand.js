import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import ElementIntersector from '../../utils/elementIntersector'

const useTrimCommand = () => {
    const { 
        elements: {
            getElementsContainingPoint
        },
        selection: {
            selectedElements
        }
    } = useElementsContext()

    const { selectDelta } = useToolsContext()

    const handleTrimCmd = useCallback((event, clickedPoint) => {
        const clickedElements = getElementsContainingPoint(clickedPoint.x, clickedPoint.y, selectDelta)
        const isTrim = !event.shiftKey

        let intersections = []
        for (const clickedElement of clickedElements) {
            for (const selectedElement of selectedElements) {
                const currIntersections = ElementIntersector.getIntersections(clickedElement, selectedElement, isTrim)

                if (currIntersections) {
                    intersections = intersections.concat(currIntersections)
                }
            }
        }
    }, [getElementsContainingPoint, selectDelta, selectedElements])

    return handleTrimCmd
}

export default useTrimCommand