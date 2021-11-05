import SetUtils from '../setUtils'
import { getDimensionDivision1d, getDivKey, parseDivKey } from './utils'
import { getDivIndicesFromCoordinates, getElementDivKeys } from './extensions'

class HashGrid {
    #divsById
    #idsByDiv

    constructor(initialNumDivsX, divSizeX, initialNumDivsY, divSizeY, startPosX = 0, startPosY = 0) {
        this.divSizeX = divSizeX
        this.divSizeY = divSizeY
        this.startPosX = startPosX
        this.startPosY = startPosY

        this.initialNumDivsX = initialNumDivsX
        this.initialNumDivsY = initialNumDivsY

        this.__initializeGrid()
    }

    get range() {
        let minX = Number.MAX_VALUE
        let maxX = Number.MIN_VALUE
        let minY = Number.MAX_VALUE
        let maxY = Number.MIN_VALUE
        for (const divKey of Object.keys(this.#idsByDiv)) {
            const [xKey, yKey] = parseDivKey(divKey)

            if (xKey < minX) {
                minX = xKey
            } else if (xKey > maxX) {
                maxX = xKey
            }

            if (yKey < minY) {
                minY = yKey
            } else if (yKey > maxY) {
                maxY = yKey
            }
        }

        return { minXDiv: minX, maxXDiv: maxX, minYDiv: minY, maxYDiv: maxY }
    }

    addElements(newElements) {
        for (const newElement of newElements) {
            if (newElement.baseType === 'polyline') {
                this.addElements(newElement.elements)
                continue
            }

            const divKeys = this.__getElementDivKeys(newElement)
            this.#divsById[newElement.id] = divKeys
            for (const divKey of divKeys) {
                if (!this.#idsByDiv[divKey]) {
                    this.#idsByDiv[divKey] = new Set()
                }

                this.#idsByDiv[divKey].add(newElement.id)
            }
            // const [leftDiv, topDiv, rightDiv, bottomDiv] = this.__getElementDivRanges(newElement)

            // this.#divsById[newElement.id] = new Set()
            // for (let xDivIndex = leftDiv; xDivIndex <= rightDiv; xDivIndex++) {
            //     for (let yDivIndex = topDiv; yDivIndex <= bottomDiv; yDivIndex++) {
            //         const divKey = `${xDivIndex},${yDivIndex}`

                    // this.#divsById[newElement.id].add(divKey)

                    // if (!this.#idsByDiv[divKey]) {
                    //     this.#idsByDiv[divKey] = new Set()
                    // }

                    // this.#idsByDiv[divKey].add(newElement.id)
            //     }
            // }
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

    getDivisionContents(xDiv, yDiv) {
        const divisionContents = this.#idsByDiv[getDivKey(xDiv, yDiv)]
        if (divisionContents && divisionContents.size > 0) {
            return Array.from(divisionContents)
        }

        return null
    }

    getDivisionContentsFromCoordinates(pointX, pointY) {
        const xDiv = getDimensionDivision1d(pointX, this.startPosX, this.divSizeX)
        const yDiv = getDimensionDivision1d(pointY, this.startPosY, this.divSizeY)

        return this.getDivisionContents(xDiv, yDiv)
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
                const container = this.#idsByDiv[getDivKey(xIndex, yIndex)]
                if (!container || container.size === 0) continue

                elementIds = SetUtils.union(elementIds, container)
            }
        }

        if (elementIds.size > 0) {
            return elementIds
        }

        return null
    }

    getElementIdsNearElement(element) {
        if (element.baseType === 'polyline') {
            const subElementsNearbyElementIds = element.elements.map(subElement => {
                return this.getElementIdsNearElement(subElement)
            })

            return SetUtils.union(...subElementsNearbyElementIds)
        }

        let elementDivs = this.#divsById[element.id]

        let nearbyElementIds = new Set()
        for (const elementDiv of elementDivs) {
            nearbyElementIds = SetUtils.union(nearbyElementIds, this.#idsByDiv[elementDiv])
        }

        const deletedIdResult = nearbyElementIds.delete(element.id)
        if (!deletedIdResult) {
            throw new Error('Hash Grid not working correctly - discrepancy between idsByDiv and divsById')
        }

        return nearbyElementIds
    }

    getPointDivision(point) {
        return [
            getDimensionDivision1d(point.x, this.startPosX, this.divSizeX),
            getDimensionDivision1d(point.y, this.startPosY, this.divSizeY),
        ]
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
                this.#idsByDiv[getDivKey(xDivIndex, yDivIndex)] = new Set()
            }
        }
    }

    // __getElementDivRanges(element) {
    //     const boundingBox = element.getBoundingBox()

    //     const leftDiv = getDimensionDivision1d(boundingBox.left, this.startPosX, this.divSizeX)
    //     const topDiv = getDimensionDivision1d(boundingBox.top, this.startPosY, this.divSizeY)
    //     const rightDiv = getDimensionDivision1d(boundingBox.right, this.startPosX, this.divSizeX)
    //     const bottomDiv = getDimensionDivision1d(boundingBox.bottom, this.startPosY, this.divSizeY)

    //     return [leftDiv, topDiv, rightDiv, bottomDiv]
    // }
}

HashGrid.prototype.__getElementDivKeys = getElementDivKeys
HashGrid.prototype.__getDivIndicesFromCoordinates = getDivIndicesFromCoordinates

export default HashGrid