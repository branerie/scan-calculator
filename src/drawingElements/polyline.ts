import Element, { NOT_DEFINED_ERROR } from './element'
import { copyPoint, pointsMatch } from '../utils/point'
import { SELECT_DELTA } from '../utils/constants'
import { BoundingBox, SelectionPoint } from '../utils/types/index'
import Point from './point'
import Line, { FullyDefinedLine } from './line'
import { SelectionPointType } from '../utils/enums/index'
import { Ensure } from '../utils/types/generics'
import { FullyDefinedArc } from './arc'
import { copyLine } from '../utils/line'
import { copyArc } from '../utils/arc'
import { generateId } from '../utils/general'

export default class Polyline extends Element {
  private _isFullyDefined: boolean = false
  // private _isJoined
  private _elements: SubElement[] = []
  private _boundingBox?: BoundingBox
  private _startPoint?: Point
  private _endPoint?: Point
  private _isStartInPolyDirection: boolean = true
  private _isEndInPolyDirection: boolean = true

  constructor(
    initialPoint: Point,
    opts: {
      id?: string
      groupId?: string
      elements?: SubElement[]
    } = {}
  ) {
    const { id, groupId, elements } = opts
    super(id, groupId)
    if (groupId && !id) {
      this.id = groupId
      this.groupId = null
    }

    // this._isJoined = false

    if (elements) {
      // do not use this._elements directly; must go through setter logic
      this.elements = elements

      if (elements.length > 1) {
        this._isStartInPolyDirection = pointsMatch(
          elements[0].endPoint,
          elements[1].startPoint
        )

        this._isEndInPolyDirection = pointsMatch(
          elements[elements.length - 2].endPoint,
          elements[elements.length - 1].startPoint
        )
      } else {
        this._isStartInPolyDirection = true
        this._isEndInPolyDirection = true
      }

      if (elements.every(e => e.isFullyDefined)) {
        this._updateEndPoints()
      }

      return
    }

    const initialLine = new Line(
      copyPoint(initialPoint, false, true), { 
        groupId: this.id || undefined 
      }
    )
    initialLine.id = generateId()
    this._elements = [
      initialLine as SubElement
    ]

    this._isFullyDefined = false
  }

  get basePoint() {
    return this._elements && this._elements.length > 0 
      ? this._elements[0].basePoint 
      : null
  }
  
  get startPoint() {
    if (this._startPoint) {
      return this._startPoint
    }

    if (this._elements) {
      return this._elements[0].startPoint
    }

    return null
  }

  get endPoint() {
    return this._endPoint 
      ? this._endPoint 
      : this._elements[this._elements.length - 1].endPoint
  }

  get isFullyDefined() {
    return this._isFullyDefined
  }

  get elements(): SubElement[] {
    return this._elements
  }

  /* Should return true if all but the last dimension of the element are defined */
  get isAlmostDefined() {
    if (this.isFullyDefined) {
      return true
    }

    // if polyline is not fully defined, user must still be drawing it
    // therefore, the first element will always be a Line 
    return !!this._elements.length && !!(this._elements[0] as Line).pointA
  }

  get isClosed() {
    if (this._elements.length < 2) {
      return false
    }

    const startPoint = this._startPoint || this._elements[0].startPoint
    
    const lastElement = this._elements[this._elements.length - 1]
    return (
      pointsMatch(startPoint, lastElement.endPoint) ||
      pointsMatch(startPoint, lastElement.startPoint)
    )
  }

  // get isJoined() { return this._isJoined }
  get isJoined() {
    return this.isClosed
  }

  set elements(newElements: SubElement[]) {
    this._elements = newElements

    let isFullyDefined = true
    for (const element of newElements) {
      element.groupId = this.id
      isFullyDefined = isFullyDefined && element.isFullyDefined
    }

    this._isFullyDefined = isFullyDefined
    if (isFullyDefined) {
      this._updateBoundingBox()
      this._updateEndPoints()
      // this.joinEnds()
    }
  }

  set startPoint(value: Point | null) {
    if (!value) {
      return
    }

    if (!this._elements.length) {
      throw new Error('Cannot set startPoint of polyline with no elements')
    }

    const startElement = this._elements[0]
    const isStartInPolyDirection = pointsMatch(startElement.startPoint!, this._startPoint!)
    this._isStartInPolyDirection = isStartInPolyDirection
    if (isStartInPolyDirection) {
      // if (!pointsMatch(value, this._startPoint)) {
      //     throw new Error(END_POINT_ERROR)
      // }

      startElement.startPoint = value
    } else {
      startElement.endPoint = value
    }

    // if (!pointsMatch(value, this._endPoint)) {
    //     throw new Error(END_POINT_ERROR)
    // }

    this._startPoint = copyPoint(value, true, true)
    if (this.id) {
      this._startPoint.elementId = this.id
    }
  }

  set endPoint(value) {
    if (!value) {
      return
    }

    const endElement = this._elements[this._elements.length - 1]
    const isEndInPolyDirection = pointsMatch(endElement.endPoint!, this._endPoint!)
    this._isEndInPolyDirection = isEndInPolyDirection
    if (isEndInPolyDirection) {
        // if (!pointsMatch(value, this._startPoint)) {
        //     throw new Error(END_POINT_ERROR)
        // }

        endElement.endPoint = value
    } else {
        endElement.startPoint = value
    }

    // if (!pointsMatch(value, this._endPoint)) {
    //     throw new Error(END_POINT_ERROR)
    // }

    this._endPoint = copyPoint(value, true, true)
    if (this.id) {
      this._endPoint.elementId = this.id
    }
  }

  checkIfPointOnElement(point: Point, maxDiff: number = SELECT_DELTA) {
      return this._elements.some(e => e.checkIfPointOnElement(point, maxDiff))
  }

  defineNextAttribute(definingPoint: Point) {
      const elementToDefine = this._elements[this._elements.length - 1]
      elementToDefine.defineNextAttribute(
        copyPoint(definingPoint, false, true)
      )

      // const line = createLine(definingPoint, null, {
      //   groupId: this.id || undefined,
      //   assignId: true
      // })

      const newPoint = copyPoint(definingPoint, false, true)
      const line = new Line(newPoint, { groupId: this.id || undefined })
      line.id = generateId()

      this._elements.push(line as SubElement)
      this._endPoint = undefined
  }

  getSelectionPoints(pointType?: SelectionPointType): SelectionPoint[] {
    const result = this._elements.reduce<SelectionPoint[]>((acc, element) => {
      const selectionPoints = element.getSelectionPoints(pointType)
      return [...acc, ...selectionPoints]
    }, [])

    return result
  }

  getNearestPoint(point: Point) {
      // TODO: implement nearest point snap of polyline
      throw new Error('Method getNearestPoint is not implemented on element type Polyline')
  }

  setLastAttribute(pointX: number, pointY: number) {
    if (!this._elements.length) {
      throw new Error('Attempting to set point on polyline with no elements')
    }

    const elementToDefine = this._elements[this._elements.length - 1]

    elementToDefine.setLastAttribute(pointX, pointY)
    this._isFullyDefined = this._elements.every(e => e.isFullyDefined)

    if (this._isFullyDefined) {
      this._updateBoundingBox()
      this._updateEndPoints()
      // this.joinEnds()
    }
  }

  setPointById(pointId: string, newPointX: number, newPointY: number) {
    const isSuccessful = this._elements.reduce((acc, element) => {
      return acc || element.setPointById(pointId, newPointX, newPointY)
    }, false)

    if (isSuccessful) {
      this._updateBoundingBox()
    }

    return isSuccessful
  }

  getPointById(pointId: string) {
    let point = null
    for (const element of this._elements) {
      point = element.getPointById(pointId)

      if (point) break
    }

    return point
  }

  move(dX: number, dY: number) {
    if(!this.isFullyDefined) {
      throw new Error(NOT_DEFINED_ERROR)
    }

    this._elements.forEach(e => e.move(dX, dY))

    this._boundingBox!.left += dX
    this._boundingBox!.right += dX
    this._boundingBox!.top += dY
    this._boundingBox!.bottom += dY
  }

  getBoundingBox() {
    if (!this.isFullyDefined) {
      throw new Error(NOT_DEFINED_ERROR)
    }
      
    return { 
      top: this._boundingBox!.top,
      bottom: this._boundingBox!.bottom,
      left: this._boundingBox!.left,
      right: this._boundingBox!.right
    }
  }

  // joinEnds() {
  //     if (!this.isClosed) return

  //     this._isJoined = true
  // }

  stretchByMidPoint(dX: number, dY: number, midPointId: string) {
    const movedElementIndex = this._elements.findIndex(e => e.getPointById(midPointId))
    if (movedElementIndex < 0) {
      return false
    }

    const movedElement = this._elements[movedElementIndex]
    if (this.isClosed) {
      if (movedElementIndex === 0) {
        const lastElement = this._elements[this._elements.length - 1]
        const { pointId, connectionPoint } = this.__findConnectionEndPoint(lastElement, movedElement)

        lastElement.setPointById(
          pointId,
          connectionPoint!.x + dX, connectionPoint!.y + dY
        )
      }

      if (movedElementIndex === this._elements.length - 1) {
        const firstElement = this._elements[0]
        const { pointId, connectionPoint } = this.__findConnectionEndPoint(firstElement, movedElement)

        firstElement.setPointById(
          pointId,
          connectionPoint!.x + dX, connectionPoint!.y + dY
        )
      }
    }

    if (movedElementIndex > 0) {
      // the previous element's connecting point needs to be moved
      const previousElement = this._elements[movedElementIndex - 1]
      const { pointId, connectionPoint } = this.__findConnectionEndPoint(previousElement, movedElement)

      previousElement.setPointById(
        pointId,
        connectionPoint!.x + dX, connectionPoint!.y + dY
      )
    }

    if (movedElementIndex < this._elements.length - 1) {
      // the next element's connecting point needs to be moved
      const nextElement = this._elements[movedElementIndex + 1]
      const { pointId, connectionPoint } = this.__findConnectionEndPoint(nextElement, movedElement)

      nextElement.setPointById(
        pointId,
        connectionPoint!.x + dX, connectionPoint!.y + dY
      )
    }

    // element whose midPoint is being edited should be moved
    this._elements[movedElementIndex].move(dX, dY)

    this._updateBoundingBox()
    return true
  }

  completeDefinition() {
    this._isFullyDefined = true
    this._elements.pop()
    this._elements.forEach(e => (e.groupId = this.id))

    this._updateBoundingBox()
    this._updateEndPoints()
  }

  replaceElement(newElement: Ensure<SubElement, 'startPoint' | 'endPoint'>, elementId?: string) {
    const replacedElementId = elementId || newElement.id
    if (!replacedElementId) {
      throw new Error('Cannot replace polyline element with no provided target id')
    }

    for (let elementIndex = 0; elementIndex < this._elements.length; elementIndex++) {
      if (this._elements[elementIndex].id !== replacedElementId) {
        continue
      }

      if (!this._validateElementReplacement(elementIndex, newElement)) {
        throw new Error('Invalid polyline element replacement')
      }

      if (newElement.groupId !== this.id) {
        if (newElement instanceof Line) {
          newElement = copyLine(newElement, true, false)
        } else {
          newElement = copyArc(newElement, true, false)
        }

        newElement.groupId = this.id
      }

      this._elements[elementIndex] = newElement

      if (elementIndex === 0 || elementIndex === this._elements.length - 1) {
        this._updateEndPoints()
      }

      break
    }
  }

  setPointsElementId() {
    if (!this._elements) {
      return
    }

    const elementId = this.id || undefined
    for (const element of this._elements) {
      element.groupId = this.id
      // element.setPointsElementId()
    }

    if (this._startPoint) {
      this._startPoint.elementId = elementId
    }

    if (this._endPoint) {
      this._endPoint.elementId = elementId
    }
  }

  _updateBoundingBox() {
      let left = Number.POSITIVE_INFINITY
      let right = Number.NEGATIVE_INFINITY
      let top = Number.POSITIVE_INFINITY
      let bottom = Number.NEGATIVE_INFINITY
      for (const element of this._elements) {
          const box = element.getBoundingBox()

          left = box.left < left ? box.left : left
          right = box.right > right ? box.right : right
          top = box.top < top ? box.top : top
          bottom = box.bottom > bottom ? box.bottom : bottom
      }

      this._boundingBox = { left, right, top, bottom }
  }

  _updateEndPoints() {
    const startPoint = this._isStartInPolyDirection
      ? this._elements[0].startPoint
      : this._elements[0].endPoint
    const endPoint = this._isEndInPolyDirection
      ? this._elements[this._elements.length - 1].endPoint
      : this._elements[this._elements.length - 1].startPoint

    this._startPoint = copyPoint(startPoint!, true, false)
    if (this.id) {
      this._startPoint.elementId = this.id
    }
    
    this._endPoint = copyPoint(endPoint!, true, false)
    if (this.id) {
      this._endPoint.elementId = this.id
    }

    this._isStartInPolyDirection = pointsMatch(
      this._elements[0].startPoint,
      this._startPoint
    )
  }

  _validateElementReplacement(elementIndex: number, newElement: Ensure<SubElement, 'startPoint' | 'endPoint'>) {
    let isStartValid = true
    if (elementIndex > 0) {
      const previousElement = this._elements[elementIndex - 1] as Ensure<SubElement, 'startPoint' | 'endPoint'>
      isStartValid =
        pointsMatch(previousElement.endPoint, newElement.startPoint) ||
        pointsMatch(previousElement.startPoint, newElement.startPoint) ||
        pointsMatch(previousElement.startPoint, newElement.endPoint) ||
        pointsMatch(previousElement.endPoint, newElement.endPoint)
    }

    let isEndValid = true
    if (elementIndex < this._elements.length - 1) {
      const nextElement = this._elements[elementIndex + 1] as Ensure<SubElement, 'startPoint' | 'endPoint'>
      isEndValid =
        pointsMatch(nextElement.startPoint, newElement.endPoint) ||
        pointsMatch(nextElement.endPoint, newElement.endPoint) ||
        pointsMatch(nextElement.endPoint, newElement.startPoint) ||
        pointsMatch(nextElement.startPoint, newElement.startPoint)
    }

    return isStartValid && isEndValid
  }

  __findConnectionEndPoint(
    comparedTo: SubElement, 
    comparedWith: SubElement
  ): { pointId: string, connectionPoint: Point } {
    const comparedToStartPoint = comparedTo.startPoint!
    const comparedWithStartPoint = comparedWith.startPoint!
    const comparedWithEndPoint = comparedWith.endPoint!
    if (
      pointsMatch(comparedToStartPoint, comparedWithStartPoint) ||
      pointsMatch(comparedToStartPoint, comparedWithEndPoint)
    ) {
      if (!comparedToStartPoint.pointId) {
        throw new Error('Points of polyline subElement have pointId undefined')
      }

      return {
        pointId: comparedToStartPoint.pointId,
        connectionPoint: comparedToStartPoint
      }
    }

    const comparedToEndPoint = comparedTo.endPoint!
    if (
      pointsMatch(comparedToEndPoint, comparedWithStartPoint) ||
      pointsMatch(comparedToEndPoint, comparedWithEndPoint)
    ) {
      if (!comparedToEndPoint.pointId) {
        throw new Error('Points of polyline subElement have pointId undefined')
      }

      return {
        pointId: comparedToEndPoint.pointId,
        connectionPoint: comparedToEndPoint
      }
    }

    throw new Error(MID_POINT_STRECH_ERROR)
  }
}

export type FullyDefinedPolyline = Ensure<Polyline, 'startPoint' | 'endPoint'>

export type SubElement = FullyDefinedArc | FullyDefinedLine

const MID_POINT_STRECH_ERROR = 'Cannot stretch polyline by midpoint - polyline seems to be disjointed'