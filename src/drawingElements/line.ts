import { getPointDistance } from '../utils/point'
import { degreesToRadians, getQuadrant, getAngleBetweenPoints, getQuadrantFromAngle } from '../utils/angle'
import Element, { NOT_DEFINED_ERROR } from './element'
import { createPoint } from '../utils/elementFactory'
import { SELECT_DELTA } from '../utils/constants'
import { BoundingBox, SelectionPoint } from '../utils/types/index'
import Point from './point'
import ElementManipulator from '../utils/elementManipulator'
import { SelectionPointType } from '../utils/enums/index'

class Line extends Element {
    private _pointA: Point
    private _pointB?: Point
    private _midPoint?: Point
    private _boundingBox?: BoundingBox
    
    constructor(
      pointA: Point, 
      options: { 
        pointB?: Point, 
        id?: string,
        groupId?: string, 
        midPointId?: string 
      }
    ) {
      const { pointB, id, groupId, midPointId } = options
      super(id, groupId)
      // TODO: check if both points are the same point

      this._pointA = ElementManipulator.copyPoint(pointA, true, false)
      if (!pointA.elementId && this.id) {
        this._pointA.elementId = this.id
      }

      if (pointB) {
        this._pointB = ElementManipulator.copyPoint(pointB, true, false)
        if (!pointB.elementId && this.id) {
          this._pointB.elementId = this.id
        }

        this.__updateDetails()

        if (midPointId) {
          this._midPoint!.pointId = midPointId
        }
      }
    }

    get basePoint() { return this._pointA }
    get startPoint(): Point | null { return this.pointA }
    get endPoint(): Point | null { return this.pointB }

    set startPoint(value: Point | null) {
      if (value) {
        this.setPointA(value.x, value.y)
      }
    }

    set endPoint(value: Point | null) {
      if (value) {
        this.setPointB(value.x, value.y)
      }
    }

    get pointA(): Point {
      return { ...this._pointA }
    }
    get pointB() {
      return this._pointB ? { ...this._pointB } : null
    }
    get midPoint() {
      return this._midPoint ? { ...this._midPoint } : null
    }

    get isFullyDefined() {
      return (
        !!this._pointA && !!this._pointB
        // (!!(this._pointA.x) || this._pointA.x === 0) &&
        // (!!(this._pointA.y) || this._pointA.y === 0) &&
        // (!!(this._pointB.x) || this._pointB.x === 0) &&
        // (!!(this._pointB.y) || this._pointB.y === 0)
      )
    }

    get isAlmostDefined() {
      return !!this._pointA
    }

    get length() {
      if (!this._pointA || !this._pointB) {
        throw new Error('Cannot get length of line until it is fully defined')
      }

      return getPointDistance(this._pointA, this._pointB)
    }

    get isVertical() {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      return this._pointA.x === this._pointB!.x
    }

    get isHorizontal() {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      return this._pointA.y === this._pointB!.y
    }

    get angle() {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      return getAngleBetweenPoints(this._pointA, this._pointB!)
    }

    get equation() {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      // m = (y2 - y1) / (x2 - x1)
      const xDiff = this._pointB!.x - this._pointA.x

      const slope = xDiff !== 0 ? (this._pointB!.y - this._pointA.y) / xDiff : Number.NaN
      // b = y - m * x
      const intercept = isNaN(slope) ? Number.NaN : this._pointA.y - this._pointA.x * slope

      return { slope, intercept }
    }

    setPointA(x: number, y: number) {
      this._pointA.x = x
      this._pointA.y = y
      this.__updateDetails()
    }

    setPointB(x: number, y: number) {
      if (!this._pointB) {
        this._pointB = createPoint(
          x, 
          y, 
          { elementId: this._pointA.elementId, assignId: true }
        )
      } else {
        this._pointB.x = x
        this._pointB.y = y
      }

      this.__updateDetails()
    }

    checkIfPointOnElement(
      point: Point, 
      maxDiff = SELECT_DELTA
    ) {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      const nearestPoint = this.getNearestPoint(point, false)
      const perpendicular = new Line(point, { pointB: nearestPoint })

      return perpendicular.length < maxDiff
    }

    setLastAttribute(pointX: number, pointY: number) {
      this.setPointB(pointX, pointY)
    }

    setPointById(
      pointId: string, 
      newPointX: number, 
      newPointY: number
    ) {
      const settingResult = super.setPointById(pointId, newPointX, newPointY)
      this.__updateDetails()

      return settingResult
    }

    getPointById(pointId: string) {
      if (this._pointA.pointId === pointId) {
        return this._pointA
      }

      if (this._pointB && this._pointB.pointId === pointId) {
        return this._pointB
      }

      if (this._midPoint && this._midPoint.pointId === pointId) {
        return this._midPoint
      }

      return null
    }

    getSelectionPoints(pointType?: SelectionPointType): SelectionPoint[] {
      if (!this.isFullyDefined) {
        return []
      }

      // this.__updateDetails()
      const pointA = this._pointA as Required<Point>
      const pointB = this._pointB! as Required<Point>
      const midPoint = this._midPoint! as Required<Point>

      return [
        ...(!pointType || pointType === SelectionPointType.EndPoint
          ? [
              { ...pointA, pointType: SelectionPointType.EndPoint },
              { ...pointB, pointType: SelectionPointType.EndPoint }
            ]
          : []
          ),
        ...(!pointType || pointType === SelectionPointType.MidPoint 
          ? [{ ...midPoint, pointType: SelectionPointType.MidPoint }] 
          : []
        )
      ]
    }

    defineNextAttribute(definingPoint: Point) {
      if (this.isFullyDefined) {
        // needs to set mid point when line is part of a polyline which is currently created
        // otherwise, the mid point is not set anywhere
        if (!this._midPoint) {
          this.__updateDetails()
        }

        return
      }

      // if (!this._pointA) {
      //   this._pointA = { ...definingPoint, elementId: definingPoint.elementId || this.id }
      //   return
      // }

      this._pointB = ElementManipulator.copyPoint(definingPoint, true, true)
      if (!definingPoint.elementId && this.id) {
        this._pointB.elementId = this.id
      }

      this.__updateDetails()
    }

    getNearestPoint(point: Point, shouldUseLineExtension = false) {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      let nearestPoint = null
      if (this.isVertical || this.isHorizontal) {
        nearestPoint = this.isVertical
          ? createPoint(this._pointA.x, point.y, { assignId: false })
          : createPoint(point.x, this._pointA.y, { assignId: false })
      } else {
        const { slope, intercept: lineIntercept } = this.equation

        // mp = - 1 / m (slope of perpendicular)
        // bp = yp - mp * xp = yp + (xp / m)
        const perpendicularIntercept = point.y + point.x / slope

        const intersectX = (slope * (perpendicularIntercept - lineIntercept)) / (slope ** 2 + 1)
        const intersectY = intersectX * slope + lineIntercept

        // // find perpendicular intercept from input point (bp)
        // const perpendicularIntercept = point.y + slope * point.x

        // // xi = (bp - b) / (2 * m)
        // const intersectX = (perpendicularIntercept - lineIntercept) / (2 * slope)
        // // yi = m * x + b
        // const intersectY = slope * intersectX + lineIntercept

        nearestPoint = createPoint(intersectX, intersectY, { assignId: false })
      }

      if (!shouldUseLineExtension) {
        // return pointA or pointB (whichever is nearest) if point from perpendicular to line
        // is outside the line

        const distanceFromStart = getPointDistance(this._pointA, nearestPoint)
        const distanceFromEnd = getPointDistance(this._pointB!, nearestPoint)

        // TODO: does not check if point lies on extension of line or is just really far away
        if (distanceFromStart > this.length) {
          return createPoint(this._pointB!.x, this._pointB!.y, { assignId: false })
        }

        if (distanceFromEnd > this.length) {
          return createPoint(this._pointA.x, this._pointA.y, { assignId: false })
        }
      }

      return nearestPoint
    }

    setLength(newLength: number, shouldMovePointA = false) {
      if (!this._pointA || !this._pointB) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      if (this._pointA.y === this._pointB.y) {
        if (shouldMovePointA) {
          this._pointA.x =
              this._pointA.x > this._pointB.x ? this._pointB.x + newLength : this._pointB.x - newLength
        } else {
          this._pointB.x =
            this._pointB.x > this._pointA.x ? this._pointA.x + newLength : this._pointA.x - newLength
        }

        return this.__updateDetails()
      }

      if (this._pointA.x === this._pointB.x) {
        if (shouldMovePointA) {
          this._pointA.y =
              this._pointA.y > this._pointB.y ? this._pointB.y + newLength : this._pointB.y - newLength
        } else {
          this._pointB.y =
              this._pointB.y > this._pointA.y ? this._pointA.y + newLength : this._pointA.y - newLength
        }

        return this.__updateDetails()
      }

      const quadrant = getQuadrantFromAngle(this.angle)

      let angle: number, 
          dXMultiplier: number, 
          dYMultiplier: number
      switch (quadrant) {
        case 1:
          angle = this.angle
          dXMultiplier = 1
          dYMultiplier = 1
          break
        case 2:
          angle = 180 - this.angle
          dXMultiplier = -1
          dYMultiplier = 1
          break
        case 3:
          angle = this.angle - 180
          dXMultiplier = -1
          dYMultiplier = -1
          break
        case 4:
          angle = 360 - this.angle
          dXMultiplier = 1
          dYMultiplier = -1
          break
        default:
          throw new Error(`Invalid angle quadrant: ${quadrant}`)
      }

      const angleRadians = degreesToRadians(angle)
      const dX = Math.cos(angleRadians) * newLength * dXMultiplier
      const dY = Math.sin(angleRadians) * newLength * dYMultiplier

      if (shouldMovePointA) {
        return this.setPointA(this._pointB.x - dX, this._pointB.y - dY)
      }

      this.setPointB(this._pointA.x + dX, this._pointA.y + dY)
    }

    getBoundingBox() {
      if (!this.isFullyDefined) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      return {
        top: this._boundingBox!.top,
        bottom: this._boundingBox!.bottom,
        left: this._boundingBox!.left,
        right: this._boundingBox!.right,
      }
    }

    move(dX: number, dY: number) {
      if (!this._pointA || !this._pointB) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      this._pointA.x += dX
      this._pointA.y += dY
      this._pointB.x += dX
      this._pointB.y += dY
      this._midPoint!.x += dX
      this._midPoint!.y += dY

      this._boundingBox!.left += dX
      this._boundingBox!.right += dX
      this._boundingBox!.top += dY
      this._boundingBox!.bottom += dY
    }

    setPointsElementId() {
      if (!this.id) {
        throw new Error('Attempting to set an undefined element id to points')
      }

      const elementId = this.id

      this._pointA.elementId = elementId
      if (this._pointB) {
        this._pointB.elementId = elementId
        this._midPoint!.elementId = elementId
      }
    }

    __updateDetails() {
      this.__updateMidPoint()
      this.__updateBoundingBox()
    }

    __updateBoundingBox() {
      if (!this._pointB) {
        throw new Error(NOT_DEFINED_ERROR)
      }

      let left, right
      if (this._pointA.x <= this._pointB.x) {
        left = this._pointA.x
        right = this._pointB.x
      } else {
        left = this._pointB.x
        right = this._pointA.x
      }

      let top, bottom
      if (this._pointA.y <= this._pointB.y) {
        top = this._pointA.y
        bottom = this._pointB.y
      } else {
        top = this._pointB.y
        bottom = this._pointA.y
      }

      this._boundingBox = { left, right, top, bottom }
    }

    __updateMidPoint() {
      if (!this._pointA || !this._pointB) return

      if (!this._midPoint) {
        this._midPoint = createPoint(
          (this._pointA.x + this._pointB.x) / 2,
          (this._pointA.y + this._pointB.y) / 2,
          { assignId: true, elementId: this._pointA.elementId }
        )
        return
      }

      this._midPoint.x = (this._pointA.x + this._pointB.x) / 2
      this._midPoint.y = (this._pointA.y + this._pointB.y) / 2
    }
}

export default Line
