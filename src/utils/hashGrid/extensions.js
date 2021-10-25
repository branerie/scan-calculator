// NOTE: For extension functions to work, this must be bound to an object of type HashGrid

import { MAX_NUM_ERROR } from '../constants'
import { createPoint } from '../elementFactory'
import { getPointDistance } from '../point'
import PriorityQueue from '../priorityQueue'
import SetUtils from '../setUtils'
import { getDimensionDivision1d } from './utils'

function getLineDivs(line) {
    const startPoint = line.startPoint
    const endPoint = line.endPoint
    const [startPointX, startPointY] = this.getDivIndicesFromCoordinates(startPoint.x, startPoint.y)
    const [endPointX, endPointY] = this.getDivIndicesFromCoordinates(endPoint.x, endPoint.y)

    const [minX, maxX] = [startPointX, endPointX].sort((a, b) => a - b)
    const [minY, maxY] = [startPointY, endPointY].sort((a, b) => a - b)

    const queue = new PriorityQueue((entryA, entryB) => {
        const distanceDiff = entryB.distanceFromStart - entryA.distanceFromStart

        // if false, assume distanceDiff is due to numeric rounding errors
        const isDistanceDiffSignificant = Math.abs(distanceDiff) > MAX_NUM_ERROR
        return isDistanceDiffSignificant ? distanceDiff : 0
    })

    const { slope, intercept } = line.equation

    const firstXLineDiv = Math.ceil(minX / this.divSizeX) || 0 // assume value of 0 in case -0 is returned
    const lastXLineDiv = Math.floor(maxX / this.divSizeX) || 0 // assume value of 0 in case -0 is returned
    for (let xLineDiv = firstXLineDiv; xLineDiv <= lastXLineDiv; xLineDiv++) {
        const lineXDim = xLineDiv * this.divSizeX

        const lineIntersectionY = slope * lineXDim + intercept
        const intersectionPoint = createPoint(lineXDim, lineIntersectionY)
        const intersectDistanceFromStart = getPointDistance(intersectionPoint, startPoint)
        queue.push({ 
            point: intersectionPoint, 
            distanceFromStart: intersectDistanceFromStart, 
            isCrossingX: true 
        })
    } 

    const firstYLineDiv = Math.ceil(minY / this.divSizeY) || 0 // assume value of 0 in case -0 is returned
    const lastYLineDiv = Math.floor(maxY / this.divSizeY) || 0 // assume value of 0 in case -0 is returned
    for (let yLineDiv = firstYLineDiv; yLineDiv <= lastYLineDiv; yLineDiv++) {
        const lineYDim = yLineDiv * this.divSizeY

        // TODO: What if slope is 0 or NaN?
        const lineIntersectionX = (lineYDim - intercept) / slope 
        const intersectionPoint = createPoint(lineIntersectionX, lineYDim)

        const intersectDistanceFromStart = getPointDistance(intersectionPoint, startPoint)
        queue.push({ 
            point: intersectionPoint, 
            distanceFromStart: intersectDistanceFromStart, 
            isCrossingX: false 
        })
    } 

    // TODO: loop through x and y divisions, get interceptions of line and add them to a 
    // priority queue based on distance from startPoint. Find out how to merge intercepts 
    // with same distanceFromStart (if that happens, line is crossing through an intersection
    // between a horizontal an a vertical division)
}

function getArcDivs(arc) {

}

function getElementDivKeys(element) {
    if (element.baseType === 'polyline') {
        let divKeys = new Set()
        for (const subElement of element.elements) {
            const subElementDivKeys = subElement.type === 'line'
                    ? getLineDivs.call(this, subElement)
                    : getArcDivs.call(this, subElement)
            divKeys = SetUtils.union(divKeys, subElementDivKeys)
        }

        return divKeys
    }
    
    if (element.baseType === 'line') {
        return getLineDivs.call(this, element)
    }

    // TODO: Is circle case needed or arc and circle can use the same?
    if (element.baseType === 'arc') {
        return getArcDivs.call(this, element)
    }
}

function getDivIndicesFromCoordinates(x, y) {
    const xDiv = getDimensionDivision1d(x, this.startPosX, this.divSizeX)
    const yDiv = getDimensionDivision1d(y, this.startPosY, this.divSizeY)

    return [xDiv, yDiv]
}

export {
    getElementDivKeys,
    getDivIndicesFromCoordinates
}