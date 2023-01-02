import { MAX_NUM_ERROR, SELECT_DELTA } from '../utils/constants'
import { createLine } from '../utils/elementFactory'
import ElementManipulator from '../utils/elementManipulator'
import { SelectionPointType } from '../utils/enums/index'
import { getPointDistance, getRotatedPointAroundPivot, pointsMatch } from '../utils/point'
import { BoundingBox, FullyDefinedLine, SelectionPoint } from '../utils/types/index'
import BaseArc from './baseArc'
import { NOT_DEFINED_ERROR, NO_ID_ERROR } from './element'
import Line from './line'
import Point from './point'

const INCONSISTENT_LINE_ERROR =
    'Inconsistent inner line of arc - either line length does not equal arc radius or its startPoint does not coincide with arc center'

class Arc extends BaseArc {
    private _startLine?: FullyDefinedLine
    private _endLine?: FullyDefinedLine
    private _midLine?: FullyDefinedLine
    private _boundingBox?: BoundingBox
    private _isJoined: boolean = false
    private _isChanged: boolean = false

    constructor(
      centerPoint: Point,
      options: { 
        radius?: number, 
        groupId?: string,
        startLine?: FullyDefinedLine, 
        endLine?: FullyDefinedLine, 
        midLine?: FullyDefinedLine, 
        id?: string
      }
    ) {
      const { radius, groupId, startLine, endLine, midLine, id } = options
      super(centerPoint, { id, groupId, radius })

      this.startLine = startLine
      this.endLine = endLine
      this.midLine = midLine

      if (startLine && endLine) {
        this.__updateDetails()
      }
    }

    get basePoint() {
      return this.centerPoint
    }

    get startPoint() {
      if (!this._startLine) {
        return null
      }
      
      return this._startLine.pointB
    }

    get endPoint() {
      if (!this._endLine){ 
        return null
      }

      return this._endLine.pointB
    }

    set startPoint(value: Point | null) {
      if (!value) {
        return
      }

      if (this._startLine) {
        this._startLine.setPointB(value.x, value.y)
        this.__updateDetails()
      }
    }

    set endPoint(value: Point | null) {
      if (!value) {
        return
      }

      if (this._endLine) {
        this._endLine.setPointB(value.x, value.y)
        this.__updateDetails()
      }
    }

    get startLine() {
      return this._startLine
    }
    get endLine() {
      return this._endLine
    }
    get midLine() {
      return this._midLine
    }

    set startLine(newLine) {
      if (!newLine) {
        return
      }

      if (!this.radius) {
        this._setRadius(newLine.length)
      }

      const isConsistent = this.__checkNewInnerLineConsistency(newLine)
      if (isConsistent) {
        this._startLine = newLine
        this._isChanged = true
        return
      }

      throw new Error(INCONSISTENT_LINE_ERROR)
    }

    set endLine(newLine) {
      if (!newLine) return

      const isConsistent = this.__checkNewInnerLineConsistency(newLine)
      if (isConsistent) {
        this._endLine = newLine
        this._isChanged = true

        return
      }

      throw new Error(INCONSISTENT_LINE_ERROR)
    }

    set midLine(newLine) {
      if (!newLine) return

      const isConsistent = this.__checkNewInnerLineConsistency(newLine)
      if (isConsistent) {
        this._midLine = newLine
        return
      }

      throw new Error(INCONSISTENT_LINE_ERROR)
    }

    get radius() {
      return super.radius
    }

    set radius(value: number) {
      this._setRadius(value)
      this._startLine?.setLength(value, false)
      this._endLine?.setLength(value, false) 
      this._midLine?.setLength(value, false)
      this._isChanged = true

      this.__updateBoundingBox()
    }

    get isFullyDefined() {
      return !!this.centerPoint && this.radius > 0 && !!this._startLine && !!this._endLine
    }

    get isAlmostDefined() {
      return (
        this.centerPoint &&
        this.radius > 0 &&
        !!this._startLine &&
        this._startLine.angle >= 0 &&
        this._startLine.angle <= 360
      )
    }

    get isJoined() {
      if (this._isChanged) {
        this.__updateDetails()
      }

      return this._isJoined
    }

    get angle() {
      if (!this._startLine || !this._endLine) {
        throw new Error('Attempting to access angle of arc without defined inner lines')
      }

      if (!this.containsAngle(0)) {
        return Math.abs(this._startLine.angle - this._endLine.angle)
      }

      return 360 - this._endLine.angle + this._startLine.angle
    }

    get length() {
      const arcAngle = this.angle

      return (2 * Math.PI * this.radius * arcAngle) / 360
    }

    getSelectionPoints(pointType?: SelectionPointType): SelectionPoint[] {
      if (!this.isFullyDefined) {
        return []
      }

      const centerPoint = this.centerPoint as Required<Point>
      const startLineEnd = this._startLine!.pointB! as Required<Point>
      const endLineEnd = this._endLine!.pointB! as Required<Point>
      const midLineEnd = this._midLine!.pointB! as Required<Point>
 
      return [
        ...(!pointType || pointType === SelectionPointType.CenterPoint 
          ? [{ ...centerPoint, pointType: SelectionPointType.CenterPoint }] 
          : []
        ),
        ...(!pointType || pointType === SelectionPointType.EndPoint
          ? [
            { ...startLineEnd, pointType: SelectionPointType.EndPoint },
            { ...endLineEnd, pointType: SelectionPointType.EndPoint }
            ]
          : []
        ),
        ...(!pointType || pointType === SelectionPointType.MidPoint
          ? [{ ...midLineEnd, pointType: SelectionPointType.MidPoint }]
          : []
        )
      ]
    }

    checkIfPointOnElement(point: Point, maxDiff: number = SELECT_DELTA) {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      const distanceFromCenter = getPointDistance(this.centerPoint, point)
      if (Math.abs(this.radius - distanceFromCenter) > maxDiff) {
        return false
      }

      const lineFromCenter = new Line(this.centerPoint, { pointB: point })
      const lineAngle = lineFromCenter.angle
      const startAngle = this._startLine!.angle
      const endAngle = this._endLine!.angle
      const isInArc =
          startAngle < endAngle
              ? lineAngle <= startAngle || lineAngle >= endAngle
              : lineAngle <= startAngle && lineAngle >= endAngle

      if (isInArc) {
        return true
      }

      return false
    }

    getNearestPoint() {
      // TODO: implement nearest point snap of arc
    }

    setLastAttribute(pointX: number, pointY: number) {
      this._endLine = createLine(this.centerPoint.x, this.centerPoint.y, pointX, pointY, {
        groupId: this.groupId || undefined,
        pointsElementId: this.id || undefined
      })

      this._endLine.setLength(this.radius, false)
      this.__updateDetails()
    }

    defineNextAttribute(definingPoint: Point) {
      if (this.isFullyDefined) return

      const centerPoint = this.centerPoint
      if (!centerPoint) {
        this._setCenterPoint(definingPoint)

        return
      }

      if (!this.radius) {
        this._setRadius(getPointDistance(centerPoint, definingPoint))

        this._startLine = createLine(
          centerPoint.x, 
          centerPoint.y, 
          definingPoint.x, 
          definingPoint.y, 
          {
            groupId: this.groupId || undefined,
            pointsElementId: this.id || undefined
          }
        )

        return
      }
    }

    getPointById(pointId: string) {
      if (this.centerPoint.pointId === pointId) {
        return this.centerPoint
      }

      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      if (this._startLine!.pointB!.pointId === pointId) {
        return this._startLine!.pointB
      }

      if (this._endLine!.pointB!.pointId === pointId) {
        return this._endLine!.pointB
      }

      if (this._midLine!.pointB!.pointId === pointId) {
        return this._midLine!.pointB
      }

      return null
    }

    setPointById(
      pointId: string,
      newPointX: number, 
      newPointY: number
    ) {
      if (!pointId) {
        throw new Error('Attempting to set point by an empty id parameter')
      }

      if (pointId === this.centerPoint.pointId) {
        const pointCopy = ElementManipulator.copyPoint(this.centerPoint, true)
        pointCopy.x = newPointX
        pointCopy.y = newPointY

        this._setCenterPoint(pointCopy)

        if (this._startLine) {
          this._startLine.setPointA(newPointX, newPointY)
        }

        if (this.isFullyDefined) {
          this._endLine!.setPointA(newPointX, newPointY)
          this._midLine!.setPointA(newPointX, newPointY)
        }

        return true
      }

      let lineToChange
      if (pointId === this._startLine?.pointB?.pointId) {
        lineToChange = this._startLine
      } else if (pointId === this._endLine?.pointB?.pointId) {
        lineToChange = this._endLine
      }

      if (!lineToChange) return false

      lineToChange.setPointB(newPointX, newPointY)
      lineToChange.setLength(this.radius, false)

      if (this.isFullyDefined) {
        this.__updateDetails()
      }

      return true
    }

    getBoundingBox() {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      if (this._isChanged) {
        this.__updateDetails()
      }

      return {
        top: this._boundingBox!.top,
        bottom: this._boundingBox!.bottom,
        left: this._boundingBox!.left,
        right: this._boundingBox!.right,
      }
    }

    move(dX: number, dY: number) {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      if (this._isChanged) {
          this.__updateDetails()
      }

      const centerCopy = ElementManipulator.copyPoint(this.centerPoint, true)
      centerCopy.x += dX
      centerCopy.y += dY

      this._setCenterPoint(centerCopy)

      this._startLine!.move(dX, dY)
      this._endLine!.move(dX, dY)
      this._midLine!.move(dX, dY)

      this._boundingBox!.left += dX
      this._boundingBox!.right += dX
      this._boundingBox!.top += dY
      this._boundingBox!.bottom += dY
    }

    containsAngle(angle: number) {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      const startAngle = this._startLine!.angle
      const endAngle = this._endLine!.angle

      if (startAngle > endAngle) {
        return angle <= startAngle && angle >= endAngle
      }

      return angle <= startAngle || angle >= endAngle
    }

    setPointsElementId() {
      if (!this.id) {
        throw new Error(NO_ID_ERROR)
      }

      const elementId = this.id
      const newCenterPoint = ElementManipulator.copyPoint(this.centerPoint)
      newCenterPoint.elementId = elementId
      this._setCenterPoint(newCenterPoint)

      if (this._startLine) {
        this._startLine = createLine(
          this._startLine.pointA!.x,
          this._startLine.pointA!.y,
          this._startLine.pointB!.x,
          this._startLine.pointB!.y,
          { groupId: this.groupId || undefined, pointsElementId: elementId }
        )          
      }

      if (this._endLine) {
        this._endLine = createLine(
          this._endLine.pointA!.x,
          this._endLine.pointA!.y,
          this._endLine.pointB!.x,
          this._endLine.pointB!.y,
          { groupId: this.groupId || undefined, pointsElementId: elementId }
        )

        this._midLine = createLine(
          this._midLine!.pointA!.x,
          this._midLine!.pointA!.y,
          this._midLine!.pointB!.x,
          this._midLine!.pointB!.y,
          { groupId: this.groupId || undefined, pointsElementId: elementId }
        )
      }

    }

    __updateDetails() {
      this.__updateMidLine()
      this.__updateBoundingBox()

      if (!this._startLine || !this._endLine) {
        return
      }

      this._isJoined = 
        Math.abs(this._startLine.angle - this._endLine.angle) < MAX_NUM_ERROR
      this._isChanged = false
    }

    __updateBoundingBox() {
      if (!this._startLine || !this._endLine) {
        return
      }

      const centerPoint = this.centerPoint
      const radius = this.radius

      const left = this.containsAngle(180)
        ? centerPoint.x - radius
        : Math.min(this._startLine.pointB!.x, this._endLine.pointB!.x)
      const right = this.containsAngle(0)
        ? centerPoint.x + radius
        : Math.max(this._startLine.pointB!.x, this._endLine.pointB!.x)
      const top = this.containsAngle(270)
        ? centerPoint.y - radius
        : Math.min(this._startLine.pointB!.y, this._endLine.pointB!.y)
      const bottom = this.containsAngle(90)
        ? centerPoint.y + radius
        : Math.max(this._startLine.pointB!.y, this._endLine.pointB!.y)

      this._boundingBox = { left, right, top, bottom }
    }

    __updateMidLine() {
        const centerPoint = this.centerPoint

        if (!this._startLine || !this._endLine) return

        if (!this._midLine) {
          this._midLine = createLine(
            centerPoint.x, 
            centerPoint.y, 
            this._startLine.pointB!.x, // | only for initial creation
            this._startLine.pointB!.y, // | should always be changed further down
            {
              groupId: this.groupId || undefined,
              pointsElementId: this.id || undefined
            }
          )
        }

        const angleStartToEnd = Math.abs(this._startLine.angle - this._endLine.angle)

        if (Math.abs(angleStartToEnd - 180) <= MAX_NUM_ERROR) {
          const midLineEndPoint = getRotatedPointAroundPivot(
            this._startLine.pointB!, 
            centerPoint, 
            90
          )

          this._midLine.setPointB(midLineEndPoint.x, midLineEndPoint.y)
          return
        }

        const midPointX = (this._startLine.pointB!.x + this._endLine.pointB!.x) / 2
        const midPointY = (this._startLine.pointB!.y + this._endLine.pointB!.y) / 2
        this._midLine.setPointB(midPointX, midPointY)

        const isStartLessThanEnd = this._startLine.angle < this._endLine.angle
        const isLessThan180 = angleStartToEnd < 180

        const newLength = isStartLessThanEnd !== isLessThan180 ? this.radius : -this.radius

        this._midLine.setLength(newLength, false)
    }

    __checkNewInnerLineConsistency(newLine: FullyDefinedLine) {
      if (!this.isFullyDefined) {
        return true
      }

      if (Math.abs(newLine.length - this.radius) > MAX_NUM_ERROR) {
        return false
      }

      if (!pointsMatch(newLine.startPoint, this.centerPoint)) {
        return false
      }

      return true
    }
}

export default Arc
