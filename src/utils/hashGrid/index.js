import SetUtils from '../setUtils'
import { getDimensionDivision1d } from './utils'

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
            const elementDivs = this.#divsById[removedElement.id]
            for (const elementDiv of elementDivs) {
                this.#idsByDiv[elementDiv].delete(removedElement.id)
            }

            delete this.#divsById[removedElement.id]
        }
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
        for (let xIndex =  startDivX; xIndex <= endDivX; xIndex++) {
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

        return [ leftDiv, topDiv, rightDiv, bottomDiv ]
    }
}

export default HashGrid