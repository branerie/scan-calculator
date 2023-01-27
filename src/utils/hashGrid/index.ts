import SetUtils from '../setUtils'
import { getDimensionDivision1d, getDivKey, parseDivKey } from './utils'
import { getDivIndicesFromCoordinates, getElementDivKeys } from './extensions/index'
import Polyline from '../../drawingElements/polyline'
import Point from '../../drawingElements/point'
import { ElementWithId } from '../../drawingElements/element'

export default class HashGrid {
  private _divsById: {[key: string]: Set<string>}
  private _idsByDiv: {[key: string]: Set<string>}
  divSizeX: number
  divSizeY: number
  startPosX: number
  startPosY: number
  initialNumDivsX: number
  initialNumDivsY: number

  constructor(
    initialNumDivsX: number, 
    divSizeX: number,
    initialNumDivsY: number, 
    divSizeY: number, 
    startPosX: number = 0, 
    startPosY: number = 0
  ) {
    this.divSizeX = divSizeX
    this.divSizeY = divSizeY
    this.startPosX = startPosX
    this.startPosY = startPosY

    this.initialNumDivsX = initialNumDivsX
    this.initialNumDivsY = initialNumDivsY

    this._divsById = {}
    this._idsByDiv = {}
    for (let xDivIndex = 0; xDivIndex < this.initialNumDivsX; xDivIndex++) {
      for (let yDivIndex = 0; yDivIndex < this.initialNumDivsY; yDivIndex++) {
        this._idsByDiv[getDivKey(xDivIndex, yDivIndex)] = new Set()
      }
    }
  }

  get range() {
    let minX = Number.MAX_VALUE
    let maxX = Number.MIN_VALUE
    let minY = Number.MAX_VALUE
    let maxY = Number.MIN_VALUE
    for (const divKey of Object.keys(this._idsByDiv)) {
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

  addElements(newElements: ElementWithId[]) {
    for (const newElement of newElements) {
      if (newElement.baseType === 'polyline') {
        this.addElements((newElement as Polyline).elements as ElementWithId[])
        continue
      }

      const divKeys = this.__getElementDivKeys(newElement)
      this._divsById[newElement.id] = divKeys
      for (const divKey of divKeys) {
        if (!this._idsByDiv[divKey]) {
          this._idsByDiv[divKey] = new Set()
        }

        this._idsByDiv[divKey].add(newElement.id)
      }
      // const [leftDiv, topDiv, rightDiv, bottomDiv] = this.__getElementDivRanges(newElement)

      // this._divsById[newElement.id] = new Set()
      // for (let xDivIndex = leftDiv; xDivIndex <= rightDiv; xDivIndex++) {
      //     for (let yDivIndex = topDiv; yDivIndex <= bottomDiv; yDivIndex++) {
      //         const divKey = `${xDivIndex},${yDivIndex}`

              // this._divsById[newElement.id].add(divKey)

              // if (!this._idsByDiv[divKey]) {
              //     this._idsByDiv[divKey] = new Set()
              // }

              // this._idsByDiv[divKey].add(newElement.id)
      //     }
      // }
    }
  }

  removeElements(removedElements: ElementWithId[]) {
    for (const removedElement of removedElements) {
      if (removedElement instanceof Polyline) {
        this.removeElements(removedElement.elements as ElementWithId[])
        continue
      }

      this.removeElementById(removedElement.id)
    }
  }

  removeElementsById(elementIds: string[]) {
    for (const elementId of elementIds) {
      this.removeElementById(elementId)
    }
  }

  removeElementById(elementId: string) {
    const elementDivs = this._divsById[elementId]
    for (const elementDiv of elementDivs) {
      this._idsByDiv[elementDiv].delete(elementId)
    }

    delete this._divsById[elementId]
  }

  changeElements(changedElements: ElementWithId[]) {
    this.removeElements(changedElements)
    this.addElements(changedElements)
  }

  setElements(newElements: ElementWithId[]) {
    this._divsById = {}
    this._idsByDiv = {}

    this.addElements(newElements)
  }

  getDivisionContents(xDiv: number, yDiv: number) {
    return this._idsByDiv[getDivKey(xDiv, yDiv)]
  }

  getDivisionContentsFromCoordinates(pointX: number, pointY: number) {
    const xDiv = getDimensionDivision1d(pointX, this.startPosX, this.divSizeX)
    const yDiv = getDimensionDivision1d(pointY, this.startPosY, this.divSizeY)

    return this.getDivisionContents(xDiv, yDiv)
  }

  getContainerContents(firstContainerPoint: Point, secondContainerPoint: Point) {
    const startPointX = Math.min(firstContainerPoint.x, secondContainerPoint.x)
    const startPointY = Math.min(firstContainerPoint.y, secondContainerPoint.y)
    const startDivX = getDimensionDivision1d(startPointX, this.startPosX, this.divSizeX)
    const startDivY = getDimensionDivision1d(startPointY, this.startPosY, this.divSizeY)

    const endPointX = Math.max(firstContainerPoint.x, secondContainerPoint.x)
    const endPointY = Math.max(firstContainerPoint.y, secondContainerPoint.y)
    const endDivX = getDimensionDivision1d(endPointX, this.startPosX, this.divSizeX)
    const endDivY = getDimensionDivision1d(endPointY, this.startPosY, this.divSizeY)

    let elementIds = new Set<string>()
    for (let xIndex = startDivX; xIndex <= endDivX; xIndex++) {
      for (let yIndex = startDivY; yIndex <= endDivY; yIndex++) {
        const container = this._idsByDiv[getDivKey(xIndex, yIndex)]
        if (!container || container.size === 0) continue

        elementIds = SetUtils.union(elementIds, container)
      }
    }

    return elementIds
  }

  getElementIdsNearElement(element: ElementWithId): Set<string> {
    if (element instanceof Polyline) {
      const subElementsNearbyElementIds = (element.elements as ElementWithId[]).map(subElement => {
        return this.getElementIdsNearElement(subElement)
      })

      return SetUtils.union(...subElementsNearbyElementIds)
    }

    let elementDivs = this._divsById[element.id]

    let nearbyElementIds = new Set<string>()
    for (const elementDiv of elementDivs) {
      nearbyElementIds = SetUtils.union(nearbyElementIds, this._idsByDiv[elementDiv])
    }

    const deletedIdResult = nearbyElementIds.delete(element.id)
    if (!deletedIdResult) {
      throw new Error('Hash Grid not working correctly - discrepancy between idsByDiv and divsById')
    }

    return nearbyElementIds
  }

  getPointDivision(point: Point): [number, number] {
    return [
      getDimensionDivision1d(point.x, this.startPosX, this.divSizeX),
      getDimensionDivision1d(point.y, this.startPosY, this.divSizeY),
    ]
  }

  __getElementDivKeys = getElementDivKeys.bind(this)
  __getDivIndicesFromCoordinates = getDivIndicesFromCoordinates.bind(this)
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

  //             this._idsByDiv[indexToAdd] = new Set()
  //         }
  //     }
  // }

  // __getElementDivRanges(element) {
  //     const boundingBox = element.getBoundingBox()

  //     const leftDiv = getDimensionDivision1d(boundingBox.left, this.startPosX, this.divSizeX)
  //     const topDiv = getDimensionDivision1d(boundingBox.top, this.startPosY, this.divSizeY)
  //     const rightDiv = getDimensionDivision1d(boundingBox.right, this.startPosX, this.divSizeX)
  //     const bottomDiv = getDimensionDivision1d(boundingBox.bottom, this.startPosY, this.divSizeY)

  //     return [leftDiv, topDiv, rightDiv, bottomDiv]
  // }
}

