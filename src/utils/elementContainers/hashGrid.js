import { MAX_NUM_ERROR } from '../constants'
import { createPoint } from '../elementFactory'
import { getDimensionDivision1d } from '../hashGrid/utils'
import { getLineX, getLineY } from '../line'
import { getPointDistance } from '../point'
import PriorityQueue from '../../utils/priorityQueue'
import { findClosestIntersectPoint } from '../intersections'

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

    __getDivTransitionFromPoint(point, lastDivision, xDivsGoingDown, yDivsGoingDown) {
        const interceptsHorizontalBorder = 
                Math.abs(this.#hashGrid.divSizeX - (point.x % this.#hashGrid.divSizeX)) < MAX_NUM_ERROR
        const interceptsVerticalBorder = 
                Math.abs(this.#hashGrid.divSizeY - (point.y % this.#hashGrid.divSizeY)) < MAX_NUM_ERROR
    
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

    *getNextElementsInLineDirection(line, fromStart) {
        const { slope, intercept } = line.equation
    
        const pointOfExtend = fromStart ? line.startPoint : line.endPoint
        yield this.#hashGrid.getDivisionContentsFromCoordinates(pointOfExtend.x, pointOfExtend.y)
    
        const { minXDiv, maxXDiv, minYDiv, maxYDiv } = this.#hashGrid.range
    
        const linePointsXDiff = line.startPoint.x - line.endPoint.x
        const xDivsGoingDown = (fromStart && linePointsXDiff < 0) ||
            (!fromStart && linePointsXDiff > 0)
    
        const linePointsYDiff = line.startPoint.y - line.endPoint.y
        const yDivsGoingDown = (fromStart && linePointsYDiff < 0) ||
            (!fromStart && linePointsYDiff > 0)
    
        function* getNextInterceptPoint(
            slope, 
            intercept, 
            currentDiv,
            linePointsDiff, 
            minDiv, 
            maxDiv, 
            divSize, 
            getSecondaryDimensionIntercept, 
            isDivsGoingDown, 
            isHorizontal
        ) {
            if (linePointsDiff === 0) return null
    
            if (isDivsGoingDown) {
                for (let divNum = currentDiv; divNum > minDiv; divNum--) {
                    const currentDivCoordinate = divNum * divSize
                    const secondaryDimCoordinate = getSecondaryDimensionIntercept(slope, intercept, currentDivCoordinate)
    
                    yield isHorizontal 
                            ? createPoint(currentDivCoordinate, secondaryDimCoordinate) 
                            : createPoint(secondaryDimCoordinate, currentDivCoordinate)
                }
            } else {
                for (let divNum = currentDiv; divNum < maxDiv; divNum++) {
                    const currentDivCoordinate = divNum * divSize
                    const secondaryDimCoordinate = getSecondaryDimensionIntercept(slope, intercept, currentDivCoordinate)
    
                    yield isHorizontal 
                            ? createPoint(currentDivCoordinate, secondaryDimCoordinate) 
                            : createPoint(secondaryDimCoordinate, currentDivCoordinate)
                }
            }
    
            return null
        }
    
        const xDiv = getDimensionDivision1d(pointOfExtend, this.#hashGrid.startPosX, this.#hashGrid.divSizeX)
        const yDiv = getDimensionDivision1d(pointOfExtend, this.#hashGrid.startPosY, this.#hashGrid.divSizeY)
    
        const xDivInterceptGen = getNextInterceptPoint(
            slope, 
            intercept, 
            xDiv,
            linePointsXDiff,
            minXDiv,
            maxXDiv,
            this.#hashGrid.divSizeX,
            getLineY,
            xDivsGoingDown,
            true
        )
        const yDivInterceptGen = getNextInterceptPoint(
            slope, 
            intercept, 
            yDiv,
            linePointsYDiff,
            minYDiv,
            maxYDiv,
            this.#hashGrid.divSizeY,
            getLineX,
            yDivsGoingDown,
            false
        )
    
        const queue = new PriorityQueue((a, b) => {
            const distanceFromA = getPointDistance(pointOfExtend, a)
            const distanceFromB = getPointDistance(pointOfExtend, b)
    
            return distanceFromA < distanceFromB
        })
    
        queue.push(xDivInterceptGen.next().value)
        queue.push(yDivInterceptGen.next().value)
    
        let lastDivision = { xDiv, yDiv }
        while (queue.size > 0) {
            const interceptPoint = queue.pop()
            const nextDivision = this.__getDivTransitionFromPoint(this.#hashGrid, interceptPoint, lastDivision, xDivsGoingDown, yDivsGoingDown)
            if (!nextDivision) {
                throw new Error(`Invalid line intercept point. The point ${interceptPoint.x}, ${interceptPoint.y} does not
                intercept with the hash grid`)
            }
    
            yield this.#hashGrid.getDivisionContents(nextDivision.xDiv, nextDivision.yDiv)
    
            // prepare for next round(s) of loop
            const nextXDivIntercept = xDivInterceptGen.next().value
            if (nextXDivIntercept) {
                queue.push(nextXDivIntercept)
            }
    
            const nextYDivIntercept = yDivInterceptGen.next().value
            if (nextYDivIntercept) {
                queue.push(nextYDivIntercept)
            }
    
            lastDivision = nextDivision
        }
    
        return null
    }
}

export default HashGridElementContainer