import { useCallback, useRef } from 'react'
import { CANVAS_WIDTH } from '../utils/constants'
import { createTree } from '../utils/searchTree/pointsSearchTree'

const buildPointsTreeDataObject = (point, pointType) => {
    return {
        leafValue: point.x,
        y: point.y,
        pointId: point.pointId,
        elementId: point.elementId,
        pointType
    }
}

const usePointsTree = () => {
    const pointsTree = useRef(createTree(CANVAS_WIDTH))

    const addSelectionPoints = useCallback((elementPoints) => {
        elementPoints.forEach(elementPoint => {
            pointsTree.current.insert(
                elementPoint.x,
                buildPointsTreeDataObject(elementPoint, elementPoint.pointType)
            )
        })
    }, [])

    const removeSelectionPoints = useCallback((elementPoints) => {
        elementPoints.forEach(elementPoint => {
            pointsTree.current.remove(
                elementPoint.x,
                { y: elementPoint.y, pointId: elementPoint.pointId },
                elementPoint.pointType
            )
        })
    }, [])

    const replaceSelectionPoints = useCallback((pointsAfterReplace, pointsBeforeReplace) => {
        pointsAfterReplace.forEach(par => {
            const pointBeforeEdit = pointsBeforeReplace.find(pbr => pbr.pointId === par.pointId)
            pointsTree.current.replace(
                pointBeforeEdit.x,
                { pointId: par.pointId },
                par.x,
                buildPointsTreeDataObject(par, par.pointType)
            )
        })
    }, [])

    const findNearbyPoints = useCallback((mouseX, mouseY, delta) => {
        const filteredPoints = pointsTree.current.find(mouseX - delta, mouseX + delta)

        const nearbyPoints = []
        for (const point of filteredPoints) {
            if (Math.abs(point.y - mouseY) <= delta) {
                const nearbyPoint = { ...point }
                nearbyPoint.x = point.leafValue
                delete nearbyPoint.leafValue

                nearbyPoints.push(nearbyPoint)
            }
        }

        return nearbyPoints
    }, [])

    return {
        addSelectionPoints,
        removeSelectionPoints,
        replaceSelectionPoints,
        findNearbyPoints
    }
}

export default usePointsTree