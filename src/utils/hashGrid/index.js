import { MAX_NUM_ERROR } from '../constants'
import { createPoint } from '../elementFactory'
import SetUtils from '../setUtils'
import { getDimensionDivision1d } from './utils'
import PriorityQueue from '../priorityQueue'
import { getPointDistance } from '../point'

class HashGrid {
    #divsById
    #idsByDiv
    // #minDivIndexX
    // #minDivIndexY
    // #maxDivIndexX
    // #maxDivIndexY

    constructor(initialNumDivsX, divSizeX, initialNumDivsY, divSizeY, startPosX = 0, startPosY = 0) {
        this.divSizeX = divSizeX
        this.divSizeY = divSizeY
        this.startPosX = startPosX
        this.startPosY = startPosY
        // this.#minDivIndexX = 0
        // this.#minDivIndexY = 0
        // this.#maxDivIndexX = initialNumDivsX
        // this.#maxDivIndexY = initialNumDivsY
        this.initialNumDivsX = initialNumDivsX
        this.initialNumDivsY = initialNumDivsY

        this.__initializeGrid()
    }

    addElements(newElements) {
        for (const newElement of newElements) {
           if (newElement.baseType === 'polyline') {
               this.addElements(newElement.elements)
               continue
           }

           const [leftDiv, topDiv, rightDiv, bottomDiv] = this.__getElementDivRanges(newElement)

           this.#divsById[newElement.id] = new Set()
           for (let xDivIndex = leftDiv; xDivIndex <= rightDiv; xDivIndex++) {
               for (let yDivIndex = topDiv; yDivIndex <= bottomDiv; yDivIndex++) {
                   const divKey = `${xDivIndex},${yDivIndex}`

                   this.#divsById[newElement.id].add(divKey)

                   if (!this.#idsByDiv[divKey]) {
                       this.#idsByDiv[divKey] = new Set()
                   }

                   this.#idsByDiv[divKey].add(newElement.id)
               }
           }
        }
    }

    removeElements(removedElements) {
        for (const removedElement of removedElements) {
            if (removedElement.baseType === 'polyline') {
                this.removeElements(removedElement.elements)
                continue
            }

            this.removeElementById(removedElement.id)
        }
    }

    removeElementsById(elementIds) {
        for (const elementId of elementIds) {
            this.removeElementById(elementId)
        }
    }

    removeElementById(elementId) {
        const elementDivs = this.#divsById[elementId]
        for (const elementDiv of elementDivs) {
            this.#idsByDiv[elementDiv].delete(elementId)
        }

        delete this.#divsById[elementId]
    }

    changeElements(changedElements) {
        this.removeElements(changedElements)
        this.addElements(changedElements)
    }

    setElements(newElements) {
        this.#divsById = {}
        this.#idsByDiv = {}

        this.addElements(newElements)
    }

    getDivisionContents(pointX, pointY) {
        const xDiv = getDimensionDivision1d(pointX, this.startPosX, this.divSizeX)
        const yDiv = getDimensionDivision1d(pointY, this.startPosY, this.divSizeY)

        const divisionContents = this.#idsByDiv[`${xDiv},${yDiv}`]
        if (divisionContents && divisionContents.size > 0) {
            return Array.from(divisionContents)
        }

        return null
    }

    getContainerContents(firstContainerPoint, secondContainerPoint) {
        const startPointX = Math.min(firstContainerPoint.x, secondContainerPoint.x)
        const startPointY = Math.min(firstContainerPoint.y, secondContainerPoint.y)
        const startDivX = getDimensionDivision1d(startPointX, this.startPosX, this.divSizeX)
        const startDivY = getDimensionDivision1d(startPointY, this.startPosY, this.divSizeY)

        const endPointX = Math.max(firstContainerPoint.x, secondContainerPoint.x)
        const endPointY = Math.max(firstContainerPoint.y, secondContainerPoint.y)
        const endDivX = getDimensionDivision1d(endPointX, this.startPosX, this.divSizeX)
        const endDivY = getDimensionDivision1d(endPointY, this.startPosY, this.divSizeY)

        let elementIds = new Set()
        for (let xIndex = startDivX; xIndex <= endDivX; xIndex++) {
            for (let yIndex = startDivY; yIndex <= endDivY; yIndex++) {
                const container = this.#idsByDiv[`${xIndex},${yIndex}`]
                if (!container || container.size === 0) continue

                elementIds = SetUtils.union(elementIds, container)
            }
        }

        if (elementIds.size > 0) {
            return elementIds
        }

        return null
    }

    *getDivContentsInLineDirection(line, fromStart) {
        const { slope, intercept} = line.equation

        yield fromStart 
                ? this.getDivisionContents(line.startPointX.x, line.startPointX.y)
                : this.getDivisionContents(line.endPointX.x, line.endPointX.y)

        const { minXDiv, maxXDiv, minYDiv, maxYDiv } = this.__getDivRanges()
                
        function* getNextXInterceptPoint(slope, intercept, currentXDiv) {
            const linePointsXDiff = line.pointA.x - line.pointB.x
            if (linePointsXDiff === 0) return null

            const xDivsGoingDown = (fromStart && linePointsXDiff < 0 ) || 
                                   (!fromStart && linePointsXDiff > 0)

            if (xDivsGoingDown) {
                for (let xDivNum = currentXDiv; xDivNum >= minXDiv; xDivNum--) {
                    const currentXDivXCoordinate = xDivNum * this.divSizeX
                    const yOfXDivIntercept = slope * currentXDivXCoordinate + intercept
    
                    yield createPoint(currentXDivXCoordinate, yOfXDivIntercept)
                }   
            } else {
                for (let xDivNum = currentXDiv; xDivNum <= maxXDiv; xDivNum++) {
                    const currentXDivXCoordinate = xDivNum * this.divSizeX
                    const yOfXDivIntercept = slope * currentXDivXCoordinate + intercept
    
                    yield createPoint(currentXDivXCoordinate, yOfXDivIntercept)
                }
            }

            yield null
        }
        
        function* getNextYInterceptPoint(slope, intercept, currentYDiv) {
            const linePointsYDiff = line.pointA.y - line.pointB.y
            if (linePointsYDiff === 0) return null

            const yDivsGoingDown = (fromStart && linePointsYDiff < 0 ) || 
                                   (!fromStart && linePointsYDiff > 0)

            if (yDivsGoingDown) {
                for (let yDivNum = currentYDiv; yDivNum >= minYDiv; yDivNum--) {
                    const currentYDivYCoordinate = yDivNum * this.divSizeY
                    const xOfYDivIntercept = (currentYDivYCoordinate - intercept) / (slope || MAX_NUM_ERROR)
    
                    yield createPoint(xOfYDivIntercept, currentYDivYCoordinate)
                }   
            } else {
                for (let yDivNum = currentYDiv; yDivNum <= maxYDiv; yDivNum++) {
                    const currentYDivYCoordinate = yDivNum * this.divSizeY
                    const xOfYDivIntercept = (currentYDivYCoordinate - intercept) / (slope || MAX_NUM_ERROR)
    
                    yield createPoint(xOfYDivIntercept, currentYDivYCoordinate)
                }   
            }

            yield null
        }

        const pointOfExtend = fromStart ? line.startPoint : line.endPoint 
        const xDiv = getDimensionDivision1d(pointOfExtend, this.startPosX, this.divSizeX)
        const yDiv = getDimensionDivision1d(pointOfExtend, this.startPosY, this.divSizeY)

        const xDivInterceptGen = getNextXInterceptPoint(slope, intercept, xDiv)
        const yDivInterceptGen = getNextYInterceptPoint(slope, intercept, yDiv)

        const queue = new PriorityQueue((a, b) => {
            const distanceFromA = getPointDistance(pointOfExtend, a)
            const distanceFromB = getPointDistance(pointOfExtend, b)

            return distanceFromA < distanceFromB
        })

        queue.push(xDivInterceptGen.next().value)
        queue.push(yDivInterceptGen.next().value)

        while (queue.size > 0) {
            // TODO: Maybe directly get divs (`${xDiv},${yDiv}`) in order, instead of intercept points?
            const intercept = queue.pop()
            const { fromDiv, toDiv } = this.__getDivTransitionFromPoint(intercept)


            const nextXDivIntercept = xDivInterceptGen.next().value
            if (nextXDivIntercept) {
                queue.push(nextXDivIntercept)
            }

            const nextYDivIntercept = yDivInterceptGen.next().value
            if (nextYDivIntercept) {
                queue.push(nextYDivIntercept)
            }
        }
    }

    // __updateHashGridDivs(leftDiv, topDiv, rightDiv, bottomDiv) {
    //     const leftDiff = this.#minDivIndexX - leftDiv
    //     if (leftDiff > 0) {
    //         this.__addDivSections(false, leftDiv, this.#minDivIndexX - 1)
    //         this.#minDivIndexX = leftDiv
    //     }

    //     const topDiff = this.#minDivIndexY - topDiv
    //     if (topDiff > 0) {
    //         this.__addDivSections(true, topDiv, this.#minDivIndexY - 1)
    //         this.#minDivIndexY = topDiv
    //     }

    //     const rightDiff = rightDiv - this.#maxDivIndexX
    //     if (rightDiff > 0) {
    //         this.__addDivSections(false, this.#maxDivIndexX + 1, rightDiv)
    //         this.#maxDivIndexX = rightDiv
    //     }

    //     const bottomDiff = bottomDiv - this.#maxDivIndexY
    //     if (bottomDiff > 0) {
    //         this.__addDivSections(true, this.#maxDivIndexY + 1, bottomDiv)
    //         this.#maxDivIndexY = bottomDiv
    //     }
    // }

    // __addDivSections(shouldAddRow, startIndex, endIndex) {
    //     const [otherDimStart, otherDimEnd] = shouldAddRow 
    //                                             ? [this.#minDivIndexX, this.#maxDivIndexX] 
    //                                             : [this.#minDivIndexY, this.#maxDivIndexY] 
    //     for (let index = startIndex; index <= endIndex; index++) {
    //         for (let otherDimIndex = otherDimStart; otherDimIndex <= otherDimEnd; otherDimIndex++) {
    //             const indexToAdd = shouldAddRow ? `${otherDimIndex},${index}` : `${index},${otherDimIndex}`

    //             this.#idsByDiv[indexToAdd] = new Set()
    //         }
    //     }
    // }

    __initializeGrid() {
        this.#divsById = {}
        this.#idsByDiv = {}
        for (let xDivIndex = 0; xDivIndex < this.initialNumDivsX; xDivIndex++) {
            for (let yDivIndex = 0; yDivIndex < this.initialNumDivsY; yDivIndex++) {
                this.#idsByDiv[`${xDivIndex},${yDivIndex}`] = new Set()
            }
        }
    }

    __getElementDivRanges(element) {
        const boundingBox = element.getBoundingBox()

        const leftDiv = getDimensionDivision1d(boundingBox.left, this.startPosX, this.divSizeX)
        const topDiv = getDimensionDivision1d(boundingBox.top, this.startPosY, this.divSizeY)
        const rightDiv = getDimensionDivision1d(boundingBox.right, this.startPosX, this.divSizeX)
        const bottomDiv = getDimensionDivision1d(boundingBox.bottom, this.startPosY, this.divSizeY)

        return [leftDiv, topDiv, rightDiv, bottomDiv]
    }

    __getDivRanges() {
        let minX = Number.MAX_VALUE
        let maxX = Number.MIN_VALUE
        let minY = Number.MAX_VALUE
        let maxY = Number.MIN_VALUE
        for (const divKey of Object.keys(this.#idsByDiv)) {
            const [xKey, yKey] = divKey.split(',')

            const numXKey = Number(xKey)
            const numYKey = Number(yKey)

            if (numXKey < minX) {
                minX = numXKey
            } else if (numXKey > maxX) {
                maxX = numXKey
            }

            if (numYKey < minY) {
                minY = numYKey
            } else if (numYKey > maxY) {
                maxY = numYKey
            }
        }

        return { minXDiv: minX, maxXDiv: maxX, minYDiv: minY, maxYDiv: maxY }
    }
}

export default HashGrid