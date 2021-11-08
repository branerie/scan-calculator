import { MAX_NUM_ERROR } from '../constants'
import { getDimensionDivision1d, parseDivKey } from '../hashGrid/utils'
import { getLineX, getLineY } from '../line'
import { getPointDistance } from '../point'
import PriorityQueue from '../../utils/priorityQueue'
import { getNextInterceptPoint } from './gridUtils'
import getArcDivKeys, { getArcIntersectionsWithAxis } from '../hashGrid/extensions/arc'
import ElementManipulator from '../elementManipulator'
import { getArcEndPoints } from '../arc'
import { getAngleBetweenPoints } from '../angle'
import { getContainingDivsFromIntersectionPoint } from '../hashGrid/extensions/common'

class HashGridElementContainer {
    #hashGrid
    constructor(hashGrid) {
        this.#hashGrid = hashGrid
    }

    addElements(newElements) { return this.#hashGrid.addElements(newElements) }
    removeElements(removedElements) { return this.#hashGrid.removeElements(removedElements) }
    removeElementById(elementId) { return this.#hashGrid.removeElementById(elementId) }
    changeElements(changedElements) { return this.#hashGrid.changeElements(changedElements) }
    setElements(newElements) { return this.#hashGrid.setElements(newElements) }
    getElementsNearPoint(pointX, pointY) { return this.#hashGrid.getDivisionContentsFromCoordinates(pointX, pointY) }

    getElementsInContainer(firstContainerPoint, secondContainerPoint) {
        return this.#hashGrid.getContainerContents(firstContainerPoint, secondContainerPoint)
    }

    getElementIdsNearElement(element) {
        return this.#hashGrid.getElementIdsNearElement(element)
    }

    checkPointsLocality(pointA, pointB) {
        // returns true if both points are in the same hash grid division, false otherwise
        const pointADivision = this.#hashGrid.getPointDivision(pointA)
        const pointBDivision = this.#hashGrid.getPointDivision(pointB)

        return pointADivision[0] === pointBDivision[0] &&
               pointADivision[1] === pointBDivision[1]
    }

    checkIfPointInDivision(point, division) {
        const pointDivision = this.#hashGrid.getPointDivision(point)
        return division[0] === pointDivision[0] &&
               division[1] === pointDivision[1]
    }

    *getNextElementsInLineDirection(line, fromStart) {   
        const pointOfExtend = fromStart ? line.startPoint : line.endPoint
        const contents = this.#hashGrid.getDivisionContentsFromCoordinates(pointOfExtend.x, pointOfExtend.y)
                                       .filter(eid => eid !== line.id)

        yield {
            divContents: contents,
            checkIfPointInSameDiv: (function(point) {
                return this.checkIfPointInDivision(
                    point, 
                    this.#hashGrid.getPointDivision(pointOfExtend)
                )
            }).bind(this)
        }
        
        const linePointsXDiff = line.startPoint.x - line.endPoint.x
        const xDivsGoingDown = (fromStart && linePointsXDiff < 0) ||
            (!fromStart && linePointsXDiff > 0)
    
        const linePointsYDiff = line.startPoint.y - line.endPoint.y
        const yDivsGoingDown = (fromStart && linePointsYDiff < 0) ||
            (!fromStart && linePointsYDiff > 0)
    
        const xDiv = getDimensionDivision1d(pointOfExtend.x, this.#hashGrid.startPosX, this.#hashGrid.divSizeX)
        const yDiv = getDimensionDivision1d(pointOfExtend.y, this.#hashGrid.startPosY, this.#hashGrid.divSizeY)
    
        const { slope, intercept } = line.equation
        const { minXDiv, maxXDiv, minYDiv, maxYDiv } = this.#hashGrid.range
        const xDivInterceptGen = getNextInterceptPoint({
            slope, 
            intercept, 
            currentDiv: xDiv,
            linePointsDiff: linePointsXDiff,
            minDiv: minXDiv,
            maxDiv: maxXDiv,
            divSize: this.#hashGrid.divSizeX,
            getSecondaryDimensionIntercept: getLineY,
            isDivsGoingDown: xDivsGoingDown,
            isHorizontal: true
        })

        const yDivInterceptGen = getNextInterceptPoint({
            slope, 
            intercept, 
            currentDiv: yDiv,
            linePointsDiff: linePointsYDiff,
            minDiv: minYDiv,
            maxDiv: maxYDiv,
            divSize: this.#hashGrid.divSizeY,
            getSecondaryDimensionIntercept: getLineX,
            isDivsGoingDown: yDivsGoingDown,
            isHorizontal: false
        })
    
        const queue = new PriorityQueue((a, b) => {
            const distanceFromA = getPointDistance(pointOfExtend, a)
            const distanceFromB = getPointDistance(pointOfExtend, b)
    
            return distanceFromA < distanceFromB
        })
        
        const nextXDivIntercept = xDivInterceptGen.next().value
        if (nextXDivIntercept) {
            queue.push(nextXDivIntercept)
        }

        const nextYDivIntercept = yDivInterceptGen.next().value
        if (nextYDivIntercept) {
            queue.push(nextYDivIntercept)
        }
    
        let lastDivision = { xDiv, yDiv }
        while (queue.size > 0) {
            const interceptPoint = queue.pop()

            if (interceptPoint) {
                const nextDivision = this.__getDivTransitionFromPoint(
                    interceptPoint, { 
                        lastDivision, 
                        xDivsGoingDown, 
                        yDivsGoingDown
                    }
                )

                console.log(nextDivision)

                if (!nextDivision) {
                    throw new Error(`Invalid line intercept point. The point ${interceptPoint.x}, ${interceptPoint.y} does not
                    intercept with the hash grid`)
                }

                const divContents = this.#hashGrid.getDivisionContents(nextDivision.xDiv, nextDivision.yDiv)
        
                yield {
                    divContents: divContents || [],
                    checkIfPointInSameDiv: (function(point) {
                        return this.checkIfPointInDivision(point, [nextDivision.xDiv, nextDivision.yDiv])
                    }).bind(this)
                }

                lastDivision = nextDivision
            }
    
            // prepare for next round(s) of loop
            const nextXDivIntercept = xDivInterceptGen.next().value
            if (nextXDivIntercept) {
                queue.push(nextXDivIntercept)
            }
    
            const nextYDivIntercept = yDivInterceptGen.next().value
            if (nextYDivIntercept) {
                queue.push(nextYDivIntercept)
            }
        }
    
        return null
    }

    *getNextElementsInArcDirection(arc, fromStart) {
        const pointOfExtend = fromStart ? arc.startPoint : arc.endPoint

        const contents = this.#hashGrid.getDivisionContentsFromCoordinates(pointOfExtend.x, pointOfExtend.y)
                                       .filter(eid => eid !== arc.id)
        yield {
            divContents: contents,
            checkIfPointInSameDiv: (function(point) {
                return this.checkIfPointInDivision(
                    point, 
                    this.#hashGrid.getPointDivision(pointOfExtend)
                )
            }).bind(this)
        }
        
        const arcExtension = ElementManipulator.copyArc(arc, false)
        const newStartPoint = arcExtension.endPoint
        const newEndPoint = arcExtension.startPoint

        arcExtension.startPoint = newStartPoint
        arcExtension.endPoint = newEndPoint


        const { left, right, top, bottom } = arcExtension.getBoundingBox()
        const checkIfPointOnExtension = arcExtension.checkIfPointOnElement.bind(arcExtension)
        const arcExtensionXIntersectionsGen = getArcIntersectionsWithAxis.call(
            this.#hashGrid, {
            centerPoint: arcExtension.centerPoint,
            radius: arcExtension.radius,
            startPoint: arcExtension.startPoint,
            min: getDimensionDivision1d(left, this.#hashGrid.startPosX, this.#hashGrid.divSizeX),
            max: getDimensionDivision1d(right, this.#hashGrid.startPosX, this.#hashGrid.divSizeX),
            axis: 'x',
            checkIfPointOnElement: checkIfPointOnExtension
        })

        const arcExtensionYIntersectionsGen = getArcIntersectionsWithAxis({
            centerPoint: arcExtension.centerPoint,
            radius: arcExtension.radius,
            startPoint: arcExtension.startPoint,
            min: getDimensionDivision1d(top, this.#hashGrid.startPosY, this.#hashGrid.divSizeY),
            max: getDimensionDivision1d(bottom, this.#hashGrid.startPosY, this.#hashGrid.divSizeY),
            axis: 'y',
            checkIfPointOnElement: checkIfPointOnExtension
        })

        const centerPoint = arcExtension.centerPoint
        const startAngle = arcExtension.startLine.angle
        const queue = new PriorityQueue((intersectionA, intersectionB) => {
            return intersectionA.distanceFromSTart < intersectionB.distanceFromStart
        })

        for (const arcXIntersection of arcExtensionXIntersectionsGen) {
            const angle = getAngleBetweenPoints(centerPoint, arcXIntersection)

            queue.push({
                point: arcXIntersection,
                crossing: 'V',
                distanceFromStart: Math.abs(angle - startAngle)
            })
        }

        for (const arcYIntersection of arcExtensionYIntersectionsGen) {
            const angle = getAngleBetweenPoints(centerPoint, arcYIntersection)

            queue.push({
                point: arcYIntersection,
                crossing: 'H',
                distanceFromStart: Math.abs(angle - startAngle)
            })
        }

        while (queue.size > 0) {
            const currentIntersection = queue.pop()

            const intersectionDivs = getContainingDivsFromIntersectionPoint.call(
                this.#hashGrid,
                currentIntersection.point,
                currentIntersection.crossing
            )
            
            // TODO: Determine which of the two divs comes first and which second
            // for that, we can use quadrants of the intersection point (relative to)
            // arc centerPoint
        }
    }

    __getDivTransitionFromPoint(point, { lastDivision, xDivsGoingDown, yDivsGoingDown }) {
        const interceptsHorizontalBorder = 
                Math.abs(point.x % this.#hashGrid.divSizeX) < MAX_NUM_ERROR
        const interceptsVerticalBorder = 
                Math.abs(point.y % this.#hashGrid.divSizeY) < MAX_NUM_ERROR
    
        if (!interceptsHorizontalBorder && !interceptsVerticalBorder) return null
    
        // TODO: need to check for min/max divisions? 
        const potentialNewXDiv = xDivsGoingDown ? lastDivision.xDiv - 1 : lastDivision.xDiv + 1
        const potentialNewYDiv = yDivsGoingDown ? lastDivision.yDiv - 1 : lastDivision.yDiv + 1
        if (interceptsHorizontalBorder && !interceptsVerticalBorder) {
            return { xDiv: potentialNewXDiv, yDiv: lastDivision.yDiv }
        } else if (!interceptsHorizontalBorder && interceptsVerticalBorder) {
            return { xDiv: lastDivision.xDiv, yDiv: potentialNewYDiv }
        }
    
        // intercepts both x and y division borders at the same time
        return { xDiv: potentialNewXDiv, yDiv: potentialNewYDiv }
    }
}

export default HashGridElementContainer