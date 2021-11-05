import { getArcEndPoints } from '../../arc'
import { MAX_NUM_ERROR } from '../../constants'
import { createPoint } from '../../elementFactory'
import { getPointDistanceOnArc } from '../../point'
import PriorityQueue from '../../priorityQueue'
import { getDivKey } from '../utils'
import { getContainingDivsFromIntersectionsQueue } from './common'

function* getIntersectionsWithAxis({
    centerPoint: c,
    radius: r,
    startPoint,
    min,
    max,
    axis,
    checkIfPointOnElement
}) {
    let perpDivSize, perpAxis, crossing, createPointWithAxisDimensions
    if (axis === 'y') {
        perpDivSize = this.divSizeX
        perpAxis = 'x'
        crossing = 'V'
        createPointWithAxisDimensions = (mainAxisDim, perpAxisDim) => createPoint(perpAxisDim, mainAxisDim)
    } else {
        perpDivSize = this.divSizeY
        perpAxis = 'y'
        crossing = 'H'
        createPointWithAxisDimensions = (mainAxisDim, perpAxisDim) => createPoint(mainAxisDim, perpAxisDim)
    }

    for (let lineDiv = min + 1; lineDiv <= max; lineDiv++) {
        const perpAxisDim = lineDiv * perpDivSize

        // value to adjust from <axis>-coordinate of circle centerPoint
        // if negative, line does not intersect with circle; if zero - line is tangent
        // if positive - there are two intersections between line and circle (in case of
        // partial arc we adjust later)
        const adjust = (r - perpAxisDim + c[perpAxis]) * (r + perpAxisDim - c[perpAxis])
        if (adjust < 0) continue

        if (adjust === 0) {
            const intersectionPoint = createPointWithAxisDimensions(c[axis], perpAxisDim)

            if (checkIfPointOnElement && checkIfPointOnElement(intersectionPoint)) {
                yield {
                    point: intersectionPoint,
                    distanceFromStart: getPointDistanceOnArc(startPoint, intersectionPoint, c),
                    crossing
                }
            }

            continue
        }

        const adjustSqrt = Math.sqrt(adjust)

        const firstIntersection = createPointWithAxisDimensions(c[axis] + adjustSqrt, perpAxisDim)
        const secondIntersection = createPointWithAxisDimensions(c[axis] - adjustSqrt, perpAxisDim)

        if (!checkIfPointOnElement || checkIfPointOnElement(firstIntersection)) {
            yield {
                point: firstIntersection,
                distanceFromStart: getPointDistanceOnArc(startPoint, firstIntersection, c),
                crossing
            }
        }

        if (!checkIfPointOnElement || checkIfPointOnElement(secondIntersection)) {
            yield {
                point: secondIntersection,
                distanceFromStart: getPointDistanceOnArc(startPoint, secondIntersection, c),
                crossing
            }
        }
    }
}

function getIntersectionsQueue({
    minV,
    maxV,
    minH,
    maxH,
    arc,
}) {
    
    // TODO: filter out intersections which do not lie on arc
    const intersectionsQueue = new PriorityQueue((entryA, entryB) => {
        const distanceDiff = entryB.distanceFromStart - entryA.distanceFromStart
        
        // if false, assume distanceDiff is due to numeric rounding errors
        const isDistanceDiffSignificant = Math.abs(distanceDiff) > MAX_NUM_ERROR
        // TODO: check if queue is working correctly
        return isDistanceDiffSignificant ? distanceDiff : 0
    })
    
    const generalParams = {
        startPoint: arc.startPoint,
        centerPoint: arc.centerPoint,
        radius: arc.radius,
        checkIfPointOnElement: (point) => arc.checkIfPointOnElement(point)
    }

    const verticalGen = getIntersectionsWithAxis.call(this, {
        ...generalParams,
        min: minV,
        max: maxV,
        axis: 'y'
    })
    
    for (const intersectionInfo of verticalGen) {
        intersectionsQueue.push(intersectionInfo)
    }

    const horizontalGen = getIntersectionsWithAxis.call(this, {
        ...generalParams,
        min: minH,
        max: maxH,
        axis: 'x'
    })

    for (const intersectionInfo of horizontalGen) {
        intersectionsQueue.push(intersectionInfo)
    }

    return intersectionsQueue
}

function getArcDivKeys(arc) {
    const { left, right, top, bottom } = getArcEndPoints(arc)

    let [minV] = this.__getDivIndicesFromCoordinates(left.x)
    let [maxV] = this.__getDivIndicesFromCoordinates(right.x)
    let [, minH] = this.__getDivIndicesFromCoordinates(top.x, top.y)
    let [, maxH] = this.__getDivIndicesFromCoordinates(bottom.x, bottom.y)

    const isRightOnBorder = right.x % this.divSizeX === 0
    if (isRightOnBorder) {
        maxV -= 1
    }

    const isBottomOnBorder = bottom.y % this.divSizeY === 0
    if (isBottomOnBorder) {
        maxH -= 1
    }

    if (minV === maxV && minH === maxH) {
        return new Set([getDivKey(minV, minH)])
    }

    const intersectionsQueue = getIntersectionsQueue.call(this, {
        minV,
        maxV,
        minH,
        maxH,
        arc,
    })

    const containingDivs = getContainingDivsFromIntersectionsQueue.call(this, intersectionsQueue)
    return containingDivs
}

export default getArcDivKeys
