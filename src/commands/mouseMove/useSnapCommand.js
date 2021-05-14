import { useCallback } from 'react'
import { useElementsContext } from '../../contexts/ElementsContext'
import { useToolsContext } from '../../contexts/ToolsContext'
import { SNAP_DELTA } from '../../utils/constants'
import { createPoint } from '../../utils/elementFactory'
import { getPointDistance } from '../../utils/point'

const useSnapCommand = () => {
    const {
        elements: {
            currentlyCreatedElement,
            currentlyEditedElements,
            findNearbyPoints,
            setSnappedPoint
        },
        selection: {
            selectedPoints
        }
    } = useElementsContext()

    const { currentScale } = useToolsContext()

    const handleSnapCmd = useCallback((mousePosition) => {
        const { mouseX, mouseY } = mousePosition
        let nearbyPoints = findNearbyPoints(mouseX, mouseY, SNAP_DELTA / currentScale)

        if (currentlyCreatedElement && 
            (currentlyCreatedElement.type === 'polyline' || currentlyCreatedElement === 'arc')) {
            let snappingPoints
            if (currentlyCreatedElement.type === 'polyline') {
                snappingPoints = []
                for (let i = 0; i < currentlyCreatedElement.elements.length - 1; i++) {
                    const element = currentlyCreatedElement.elements[i]
                    snappingPoints = snappingPoints.concat(element.getSelectionPoints())
                }
            } else {
                snappingPoints = currentlyCreatedElement.getSelectionPoints()
            }
            const newNearbyPoints = snappingPoints.filter(sp => 
                getPointDistance(sp, { x: mouseX, y: mouseY }) < SNAP_DELTA / currentScale)
            nearbyPoints = nearbyPoints.concat(newNearbyPoints)
        }
        
        if (currentlyEditedElements) {
            nearbyPoints = nearbyPoints.filter(nbp => 
                !currentlyEditedElements.some(cee => {
                    if (cee.baseType === 'polyline' && selectedPoints) {
                        const elementsWithEditedPoints = cee.elements.filter(e => 
                            selectedPoints.some(sp => e.getPointById(sp.pointId)))
                        return elementsWithEditedPoints.some(ewep => ewep.getPointById(nbp.pointId))
                    }
                    
                    return cee.getPointById(nbp.pointId)
                }))
        }
        
        const mousePoint = createPoint(mouseX, mouseY)

        let nearestSnappingPoint = nearbyPoints.length > 0 ? nearbyPoints[0] : null
        let nearestDistance = nearestSnappingPoint ? getPointDistance(mousePoint, nearestSnappingPoint) : null
        for (let pointIndex = 1; pointIndex < nearbyPoints.length; pointIndex++) {
            const nearbyPoint = nearbyPoints[pointIndex]
            const nearbyPointDistance = getPointDistance(mousePoint, nearbyPoint)

            if (nearbyPointDistance < nearestDistance) {
                nearestSnappingPoint = nearbyPoint
                nearestDistance = nearbyPointDistance
            }
        }

        setSnappedPoint(nearestSnappingPoint)
    }, [
        currentScale, 
        currentlyCreatedElement, 
        currentlyEditedElements, 
        findNearbyPoints, 
        selectedPoints, 
        setSnappedPoint
    ])

    return handleSnapCmd
}

export default useSnapCommand