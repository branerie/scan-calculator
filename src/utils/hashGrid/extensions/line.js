// NOTE: For extension functions to work, this must be bound to an object of type HashGrid

import { MAX_NUM_ERROR } from '../../constants'
import { createPoint } from '../../elementFactory'
import { getPointDistance } from '../../point'
import PriorityQueue from '../../priorityQueue'
import range from '../../range'
import { getDimensionDivision1d, getDivKey } from '../utils'
import { getContainingDivsFromIntersectionsQueue } from './common'

function getIntersectionsQueue ({ minV, maxV, minH, maxH, slope, intercept, startPoint }) {
    const intersectionsQueue = new PriorityQueue((entryA, entryB) => {
        const distanceDiff = entryB.distanceFromStart - entryA.distanceFromStart

        // if false, assume distanceDiff is due to numeric rounding errors
        const isDistanceDiffSignificant = Math.abs(distanceDiff) > MAX_NUM_ERROR
        return isDistanceDiffSignificant ? distanceDiff : 0
    })

    for (let verticalLineDiv = minV + 1; verticalLineDiv <= maxV; verticalLineDiv++) {
        const lineXDim = verticalLineDiv * this.divSizeX

        const lineIntersectionY = slope * lineXDim + intercept
        const intersectionPoint = createPoint(lineXDim, lineIntersectionY)
        const intersectDistanceFromStart = getPointDistance(intersectionPoint, startPoint)
        intersectionsQueue.push({ 
            point: intersectionPoint, 
            distanceFromStart: intersectDistanceFromStart, 
            crossing: 'V' 
        })
    } 

    for (let horizontalLineDiv = minH + 1; horizontalLineDiv <= maxH; horizontalLineDiv++) {
        const lineYDim = horizontalLineDiv * this.divSizeY

        const lineIntersectionX = (lineYDim - intercept) / slope 
        const intersectionPoint = createPoint(lineIntersectionX, lineYDim)

        const intersectDistanceFromStart = getPointDistance(intersectionPoint, startPoint)
        intersectionsQueue.push({ 
            point: intersectionPoint, 
            distanceFromStart: intersectDistanceFromStart, 
            crossing: 'H' 
        })
    }

    return intersectionsQueue
}

function getLineDivKeys(line) {
    const startPoint = line.startPoint
    const endPoint = line.endPoint
    const [startPointX, startPointY] = this.__getDivIndicesFromCoordinates(startPoint.x, startPoint.y)
    const [endPointX, endPointY] = this.__getDivIndicesFromCoordinates(endPoint.x, endPoint.y)

    const [minV, maxV] = [startPointX, endPointX].sort((a, b) => a - b)
    const [minH, maxH] = [startPointY, endPointY].sort((a, b) => a - b)

    const { slope, intercept } = line.equation
    
    if (slope === 0) {
        // line is horizontal
        const divKeysArr = range(minV, maxV + 1).map(x => getDivKey(x, minH))
        return new Set(divKeysArr)
    } else if (Number.isNaN(slope)) {
        // line is vertical
        const divKeysArr = range(minH, maxH + 1).map(y => getDivKey(minV, y))
        return new Set(divKeysArr)
    }

    const intersectionsQueue = getIntersectionsQueue.call(this, {
        minV, maxV, minH, maxH,
        slope, intercept,
        startPoint
    })
    
    if (intersectionsQueue.size === 0) {
        // element is contained within a single HashGrid division
        const elementXDiv = getDimensionDivision1d(startPoint.x, this.startPosX, this.divSizeX)
        const elementYDiv = getDimensionDivision1d(startPoint.y, this.startPosY, this.divSizeY)

        return new Set([getDivKey(elementXDiv, elementYDiv)])
    }

    const containingDivs = getContainingDivsFromIntersectionsQueue.call(this, intersectionsQueue)

    return containingDivs
}

export default getLineDivKeys