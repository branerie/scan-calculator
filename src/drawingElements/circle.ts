import { MAX_NUM_ERROR, SELECT_DELTA } from '../utils/constants'
import { createPoint } from '../utils/elementFactory'
import ElementManipulator from '../utils/elementManipulator'
import { SelectionPointType } from '../utils/enums/index'
import { getPointDistance } from '../utils/point'
import { BoundingBox } from '../utils/types/index'
import BaseArc from './baseArc'
import { NOT_DEFINED_ERROR } from './element'
import Point from './point'

const RADIUS_MIN_DIFF = 1e-3
const FULL_CIRCLE_ANGLE = 360

const INCONSISTENT_END_POINTS_ERROR =
  'Trying to manually set end points on a circle element which are inconsistent with circle size'

class Circle extends BaseArc {
  private _endPoints?: Point[]
  private _boundingBox?: BoundingBox
  
  constructor(
    centerPoint: Point, 
    options: { 
      radius?: number, 
      endPoints?: Point[], 
      id?: string 
    }
  ) {
    const { radius, endPoints, id } = options
    super(centerPoint, { radius, id })

    if (endPoints) {
      this._endPoints = endPoints
    }

    this.__verifyConsistency()

    if (this.radius) {
      this.__setDetails()
    }
  }

  get basePoint() { return this.centerPoint }
  get startPoint() {
    if (!this._endPoints) {
      return null
    }

    return this._endPoints[0]
  }

  get endPoint() {
    if (!this._endPoints) {
      return null
    }

    return this._endPoints[0]
  }

  get endPoints() {
    return this._endPoints
  }

  set endPoints(newEndPoints) {
    if (!newEndPoints) {
      this._endPoints = undefined
      return
    }

    if (!this.radius) {
      this._setRadius(getPointDistance(this.centerPoint, newEndPoints[0]))
    }

    const areConsistent = this.__checkNewEndPointsConsistency(newEndPoints)
    if (areConsistent) {
      this._endPoints = newEndPoints
      return
    }

    throw new Error(INCONSISTENT_END_POINTS_ERROR)
  }

  get radius() {
    return super.radius
  }
  set radius(newRadius) {
    this._setRadius(newRadius)
    this.__setDetails()
  }

  get isFullyDefined() {
    return !!this.centerPoint && this.radius > 0
  }

  get isAlmostDefined() {
    return !!this.centerPoint
  }

  get angle() {
    return FULL_CIRCLE_ANGLE
  }
  get length() {
    return 2 * Math.PI * this.radius
  }

  getSelectionPoints(pointType?: SelectionPointType) {
    if (!this.isFullyDefined) {
      return []
    }

    return [
      ...(!pointType || pointType === SelectionPointType.CenterPoint 
        ? [{ ...(this.centerPoint as Required<Point>), pointType: SelectionPointType.CenterPoint }] 
        : []
      ),
      ...(this._endPoints && (!pointType || pointType === SelectionPointType.EndPoint)
        ? this._endPoints.map(ep => ({ ...(ep as Required<Point>), pointType: SelectionPointType.EndPoint }))
        : [])
    ]
  }

  checkIfPointOnElement(point: Point, maxDiff: number = SELECT_DELTA) {
    const distanceFromCenter = getPointDistance(this.centerPoint, point)
    if (Math.abs(this.radius - distanceFromCenter) > maxDiff) {
      return false
    }

    return true
  }

  getNearestPoint() {
    // TODO: implement nearest point snap of arc
    throw new Error('Method getNearestPoint not implemented for Circle element type')
  }

  setLastAttribute(pointX: number, pointY: number) {
    this._setRadius(getPointDistance(this.centerPoint, createPoint(pointX, pointY, { assignId: false })))
    this.__setDetails()
  }

  defineNextAttribute(definingPoint: Point) {
    if (this.isFullyDefined) return

    this.setLastAttribute(definingPoint.x, definingPoint.y)
  }

  getPointById(pointId: string) {
    if (this.centerPoint.pointId === pointId) {
      return this.centerPoint
    }

    if (!this._endPoints) {
      return null
    }

    const endPoint = this._endPoints.find(ep => ep.pointId === pointId)
    return endPoint || null
  }

  setPointById(pointId: string, newPointX: number, newPointY: number) {
    const point = this.getPointById(pointId)
    if (!point) {
      return false
    }

    if (pointId === this.centerPoint.pointId) {
      this.move(newPointX - point.x, newPointY - point.y)
      return true
    }

    // point must be an end point
    this.setLastAttribute(newPointX, newPointY)
    return true
  }

  move(dX: number, dY: number) {
    if (!this.isFullyDefined) {
      throw new Error(NOT_DEFINED_ERROR)
    }

    const centerCopy = ElementManipulator.copyPoint(this.centerPoint, true)
    centerCopy.x += dX
    centerCopy.y += dY

    this._setCenterPoint(centerCopy)

    this._endPoints!.forEach(ep => {
      ep.x += dX
      ep.y += dY
    })

    this._boundingBox!.left += dX
    this._boundingBox!.top += dY
    this._boundingBox!.right += dX
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
      right: this._boundingBox!.right,
    }
  }

  containsAngle(angle: number) {
    return true
  }

  setPointsElementId() {
    const elementId = this.id

    const newCenterPoint = ElementManipulator.copyPoint(this.centerPoint, true)
    if (elementId) {
      newCenterPoint.elementId = elementId
    }

    this._setCenterPoint(newCenterPoint)

    if (!this._endPoints) return

    for (const endPoint of this._endPoints) {
      endPoint.elementId = elementId || undefined
    }
  }

  __setDetails() {
    this.__createEndPoints()
    this.__setBoundingBox()
  }

  __setBoundingBox() {
    if (!this._endPoints) {
      throw new Error('Attempting to set bounding box on circle with no end points')
    }

    const xDims = this._endPoints.map(ep => ep.x)
    const yDims = this._endPoints.map(ep => ep.y)

    this._boundingBox = {
      left: Math.min(...xDims),
      top: Math.min(...yDims),
      right: Math.max(...xDims),
      bottom: Math.max(...yDims)
    }
  }

  __createEndPoints() {
    const centerPoint = this.centerPoint
    const radius = this.radius

    if (!this._endPoints) {
      this._endPoints = [
        createPoint(centerPoint.x + radius, centerPoint.y, {
          elementId: centerPoint.elementId,
          assignId: true
        }),
        createPoint(centerPoint.x - radius, centerPoint.y, {
          elementId: centerPoint.elementId,
          assignId: true
        }),
        createPoint(centerPoint.x, centerPoint.y + radius, {
          elementId: centerPoint.elementId,
          assignId: true
        }),
        createPoint(centerPoint.x, centerPoint.y - radius, {
          elementId: centerPoint.elementId,
          assignId: true
        })
      ]

      return
    }

    this._endPoints[0].x = centerPoint.x + radius
    this._endPoints[1].x = centerPoint.x - radius
    this._endPoints[2].y = centerPoint.y + radius
    this._endPoints[3].y = centerPoint.y - radius
  }

  __verifyConsistency() {
    const centerPoint = this.centerPoint
    const radius = this.radius

    if (!centerPoint) {
      throw new Error('Cannot have a circle element without a center point')
    }

    // radius is not set yet, we will not check further for points consistency
    if (!radius) {
      if (!this._endPoints) return

      if (this._endPoints.length !== 4) {
        throw new Error('Circle must contain exactly four(4) end points')
      }

      const firstPointDistance = getPointDistance(this._endPoints[0], centerPoint)
      const secondPointDistance = getPointDistance(this._endPoints[1], centerPoint)
      const thirdPointDistance = getPointDistance(this._endPoints[2], centerPoint)
      const fourthPointDistance = getPointDistance(this._endPoints[3], centerPoint)

      if (
        Math.abs(firstPointDistance - secondPointDistance) > MAX_NUM_ERROR ||
        Math.abs(firstPointDistance - thirdPointDistance) > MAX_NUM_ERROR ||
        Math.abs(firstPointDistance - fourthPointDistance) > MAX_NUM_ERROR
      ) {
        throw new Error(
          'Circle end points must be an equal distance from the circle center (its radius)'
        )
      }

      this._setRadius(firstPointDistance)
    }

    if (isNaN(Number(radius)) || radius <= 0) {
      throw new Error('Circle radius must be a positive number')
    }

    if (!this._endPoints || !Array.isArray(this._endPoints)) {
      return this.__setDetails()
    }

    const isEndPointsInconsistent = this._endPoints.some(
      ep => Math.abs(getPointDistance(ep, centerPoint) - radius) > RADIUS_MIN_DIFF
    )

    if (isEndPointsInconsistent) {
      throw new Error('Inconsisent circle element. End points not lying on the circle')
    }
  }

  __checkNewEndPointsConsistency(newEndPoints: Point[]) {
    if (!this.isFullyDefined) {
      return true
    }

    const centerPoint = this.centerPoint
    const radius = this.radius
    for (const newEndPoint of newEndPoints) {
      const distanceFromCenter = getPointDistance(newEndPoint, centerPoint)
      if (Math.abs(distanceFromCenter - radius) > MAX_NUM_ERROR) {
        return false
      }
    }

    return true
  }
}

export default Circle
