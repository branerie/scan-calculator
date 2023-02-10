import SetUtils from '../setUtils'
import { getDimensionDivision1d, getDivKey, parseDivKey } from './utils'
import { getDivIndicesFromCoordinates, getElementDivKeys } from './extensions/index'
import Polyline from '../../drawingElements/polyline'
import Point from '../../drawingElements/point'
import { ElementWithId } from '../../drawingElements/element'

export default class HashGrid {
  private _minXDiv: number
  private _maxXDiv: number
  private _minYDiv: number
  private _maxYDiv: number
  private _divsById: {[key: string]: Set<string>}
  private _idsByDiv: {[key: string]: Set<string>}
  divSizeX: number
  divSizeY: number
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
    this._minXDiv = startPosX
    this._minYDiv = startPosY
    this._maxXDiv = startPosX + initialNumDivsX
    this._maxYDiv = startPosY + initialNumDivsY

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
  
  get minXDiv() { return this._minXDiv }
  get maxXDiv() { return this._maxXDiv }
  get minYDiv() { return this._minYDiv }
  get maxYDiv() { return this._maxYDiv }

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
        this.__updateDivBoundaries(divKey, true)
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
      if (this._idsByDiv[elementDiv]?.size === 0) {
        delete this._idsByDiv[elementDiv]
      }

      this.__updateDivBoundaries(elementDiv, false)
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
    return new Set(this._idsByDiv[getDivKey(xDiv, yDiv)])
  }

  getDivisionContentsFromCoordinates(pointX: number, pointY: number) {
    const xDiv = getDimensionDivision1d(pointX, this._minXDiv, this.divSizeX)
    const yDiv = getDimensionDivision1d(pointY, this._minYDiv, this.divSizeY)

    return this.getDivisionContents(xDiv, yDiv)
  }

  getContainerContents(firstContainerPoint: Point, secondContainerPoint: Point) {
    const startPointX = Math.min(firstContainerPoint.x, secondContainerPoint.x)
    const startPointY = Math.min(firstContainerPoint.y, secondContainerPoint.y)
    const startDivX = getDimensionDivision1d(startPointX, this._minXDiv, this.divSizeX)
    const startDivY = getDimensionDivision1d(startPointY, this._minYDiv, this.divSizeY)

    const endPointX = Math.max(firstContainerPoint.x, secondContainerPoint.x)
    const endPointY = Math.max(firstContainerPoint.y, secondContainerPoint.y)
    const endDivX = getDimensionDivision1d(endPointX, this._minXDiv, this.divSizeX)
    const endDivY = getDimensionDivision1d(endPointY, this._minYDiv, this.divSizeY)

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
      getDimensionDivision1d(point.x, this._minXDiv, this.divSizeX),
      getDimensionDivision1d(point.y, this._minYDiv, this.divSizeY),
    ]
  }

  /**
   * Updates min/max of x/y div boundaries after altering a div key (if needed)
   * @param divKey - div key which is being altered
   * @param isAddingDiv - whether we are adding this div or removing from it
   */
  private __updateDivBoundaries(divKey: string, isAddingDiv: boolean) {
    const [xDiv, yDiv] = parseDivKey(divKey)

    if (
      (isAddingDiv && xDiv < this._minXDiv) ||
      (!isAddingDiv && xDiv === this._minXDiv)
    ) {
      const newValue = this.__updateDivAxisBoundary(xDiv, 'x', 'min', isAddingDiv)
      if (newValue !== null) {
        this._minXDiv = newValue
      }
    } else if (
      (isAddingDiv && xDiv > this._maxXDiv) ||
      (!isAddingDiv && xDiv === this._maxXDiv)
    ) {
      const newValue = this.__updateDivAxisBoundary(xDiv, 'x', 'max', isAddingDiv)
      if (newValue !== null) {
        this._maxXDiv = newValue
      }
    }

    if (
      (isAddingDiv && yDiv < this._minYDiv) ||
      (!isAddingDiv && yDiv === this._minYDiv)
    ) {
      const newValue = this.__updateDivAxisBoundary(yDiv, 'y', 'min', isAddingDiv)
      if (newValue !== null) {
        this._minYDiv = newValue
      }
    } else if (
      (isAddingDiv && yDiv > this._maxYDiv) ||
      (!isAddingDiv && yDiv === this._maxYDiv)
    ) {
      const newValue = this.__updateDivAxisBoundary(yDiv, 'y', 'max', isAddingDiv)
      if (newValue !== null) {
        this._maxYDiv = newValue
      }
    }
  }

  /**
   * Helper method to __updateDivBoundaries
   */
  private __updateDivAxisBoundary(this: HashGrid, divValue: number, axis: 'x' | 'y', boundaryToUpdate: 'min' | 'max', isAddingDiv: boolean) {
    if (isAddingDiv) {
      return divValue
    }

    let shouldRemove = true
    const divMinBoundary = axis === 'x' ? this._minYDiv : this._minXDiv
    const divMaxBoundary = axis === 'x' ? this._maxYDiv : this._maxXDiv
    for (let currDiv = divMinBoundary; currDiv <= divMaxBoundary; currDiv++) {
      const currDivKey = axis === 'x' ? getDivKey(divValue, currDiv) : getDivKey(currDiv, divValue)
      if (this._idsByDiv[currDivKey] && this._idsByDiv[currDivKey].size > 0) {
        shouldRemove = false
        break
      }
    }

    if (!shouldRemove) {
      return null
    }

    const dim = axis === 'x' ? 0 : 1
    const sortFunc = boundaryToUpdate === 'min' 
      ? (a: number[], b: number[]) => a[dim] - b[dim]
      : (a: number[], b: number[]) => b[dim] - a[dim]
    const sortedKeys = Object.keys(this._idsByDiv)
                              .map(k => parseDivKey(k))
                              .sort(sortFunc)

    return sortedKeys[0][dim]                                
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

  //     const leftDiv = getDimensionDivision1d(boundingBox.left, this._minXDiv, this.divSizeX)
  //     const topDiv = getDimensionDivision1d(boundingBox.top, this._minYDiv, this.divSizeY)
  //     const rightDiv = getDimensionDivision1d(boundingBox.right, this._minXDiv, this.divSizeX)
  //     const bottomDiv = getDimensionDivision1d(boundingBox.bottom, this._minYDiv, this.divSizeY)

  //     return [leftDiv, topDiv, rightDiv, bottomDiv]
  // }
}

