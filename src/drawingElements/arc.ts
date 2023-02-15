import { getAngleBetweenPoints } from '../utils/angle'
import { getArcCenterByThreePoints } from '../utils/arc'
import { SELECT_DELTA } from '../utils/constants'
import { SelectionPointType } from '../utils/enums/index'
import { generateId } from '../utils/general'
import { areAlmostEqual, isDiffSignificant } from '../utils/number'
import { arePointsColinear, copyPoint, createPoint, getPointByDeltasAndDistance, getPointDistance, getRotatedPointAroundPivot, getThreePointDeterminantResult } from '../utils/point'
import { Ensure } from '../utils/types/generics'
import { BoundingBox, SelectionPoint } from '../utils/types/index'
import BaseArc from './baseArc'
import { NOT_DEFINED_ERROR, NO_ID_ERROR } from './element'
import Line from './line'
import Point from './point'

export default class Arc extends BaseArc {
  private _startPoint: Point | null
  private _endPoint: Point | null
  private _midPoint?: Point | null
  private _boundingBox?: BoundingBox
  private _isJoined: boolean = false
  private _isChanged: boolean = false

  constructor(
    centerPoint: Point,
    options: { 
      radius?: number, 
      groupId?: string,
      startPoint?: Point,
      endPoint?: Point,
      id?: string
    } = {}
  ) {
    const { radius, groupId, startPoint, endPoint, id } = options
    super(centerPoint, { id, groupId, radius })

    this._startPoint = startPoint || null
    this._endPoint = endPoint || null
    if (startPoint && endPoint) {
      const startDistance = getPointDistance(centerPoint, startPoint)
      const endDistance = getPointDistance(centerPoint, endPoint)
      if (
        isDiffSignificant(startDistance, endDistance)
      ) {
        throw new Error('Creating arcs with different radiuses not currently supported')
      } else {
        this._radius = startDistance
      }

      this.__updateDetails()
    } else {
      this._midPoint = null
    }
  }

  get basePoint() {
    return this.centerPoint
  }

  get startPoint() {
    return this._startPoint
  }

  get endPoint() {
    return this._endPoint
  }

  set startPoint(value: Point | null) {
    if (!value) {
      this._startPoint = null
      return
    }

    const newStartPoint = getPointByDeltasAndDistance(
      this._centerPoint,
      value.x - this._centerPoint.x,
      value.y - this._centerPoint.y,
      // can be used with a not fully defined arc
      this._radius || getPointDistance(value, this._centerPoint)
    )
    
    newStartPoint.pointId = this._startPoint?.pointId || value.pointId
    newStartPoint.elementId = this.id || undefined
    this._startPoint = newStartPoint

    this.__updateMidPoint()
  }
  
  set endPoint(value: Point | null) {
    if (!value) {
      this._endPoint = null
      return
    }

    const newEndPoint = getPointByDeltasAndDistance(
      this._centerPoint,
      value.x - this._centerPoint.x,
      value.y - this._centerPoint.y,
      this._radius || getPointDistance(value, this._centerPoint)
    )
    
    newEndPoint.pointId = this._endPoint?.pointId || value.pointId
    newEndPoint.elementId = this.id || undefined
    this._endPoint = newEndPoint

    this.__updateMidPoint()
  }

  get midPoint() {
    return this._midPoint
  }

  set midPointId(value: string | undefined) {
    if (!this._midPoint) {
      return
    }

    this._midPoint.pointId = value
  }

  get startAngle() {
    if (!this._startPoint) {
      return undefined
    }

    return this.__pointAngle(true)!
  }

  get endAngle() {
    if (!this._endPoint) {
      return undefined
    }

    return this.__pointAngle(false)!
  }

  get radius() {
    return super.radius
  }

  set radius(value: number) {
    this._radius = value
    this._isChanged = true

    if (this._startPoint) {
      // just making it go through setter which takes care of updating
      // its position with the new radius
      this.startPoint = this._startPoint
    }

    if (this._endPoint) {
      // just making it go through setter which takes care of updating
      // its position with the new radius
      this.endPoint = this._endPoint
    }
 
    this.__updateBoundingBox()
  }

  get isFullyDefined() {
    return !!this.centerPoint && this.radius > 0 && !!this._startPoint && !!this._endPoint
  }

  get isAlmostDefined() {
    if (!this._centerPoint || !this.radius) {
      return false
    }

    const startAngle = this.__pointAngle(true)
    if (!startAngle && startAngle !== 0) {
      return false
    }

    return (
      startAngle >= 0 &&
      startAngle <= 360
    )
  }

  get isJoined() {
    if (this._isChanged) {
      this.__updateDetails()
    }

    return this._isJoined
  }

  get angle() {
    if (!this._startPoint || !this._endPoint) {
      throw new Error('Attempting to access angle of arc without defined inner lines')
    }

    const startAngle = this.__pointAngle(true)!
    const endAngle = this.__pointAngle(false)!
    if (!this.containsAngle(0)) {
      return Math.abs(startAngle - endAngle)
    }

    return 360 - endAngle + startAngle
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
    const startPoint = this._startPoint! as Required<Point>
    const endPoint = this._endPoint! as Required<Point>
    const midPoint = this._midPoint! as Required<Point>

    return [
      ...(!pointType || pointType === SelectionPointType.CenterPoint 
        ? [{ ...centerPoint, pointType: SelectionPointType.CenterPoint }] 
        : []
      ),
      ...(!pointType || pointType === SelectionPointType.EndPoint
        ? [
          { ...startPoint, pointType: SelectionPointType.EndPoint },
          { ...endPoint, pointType: SelectionPointType.EndPoint }
          ]
        : []
      ),
      ...(!pointType || pointType === SelectionPointType.MidPoint
        ? [{ ...midPoint, pointType: SelectionPointType.MidPoint }]
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
    const startAngle = this.__pointAngle(true)!
    const endAngle = this.__pointAngle(false)!
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
    const deltaX = pointX - this._centerPoint.x
    const deltaY = pointY - this._centerPoint.y

    let endPoint: Point
    if (deltaY === 0) {
      const xDiff = deltaX > 0 ? this.radius : -this.radius
      endPoint = createPoint(
        this.centerPoint.x + xDiff,
        this.centerPoint.y
      )
    } else {
      endPoint = getPointByDeltasAndDistance(
        this._centerPoint,
        deltaX,
        deltaY,
        this._radius
      )
    }

    endPoint.elementId = this.id || undefined
    endPoint.pointId = this._endPoint?.pointId || generateId()

    this._endPoint = endPoint
    this.__updateDetails()
  }

  defineNextAttribute(definingPoint: Point) {
    if (this.isFullyDefined) {
      return
    }

    const centerPoint = this.centerPoint
    if (!this._centerPoint) {
      this._centerPoint = copyPoint(definingPoint, false, true)
      this._centerPoint.elementId = this.id || undefined

      return
    }

    if (!this.radius) {
      this._radius = getPointDistance(centerPoint, definingPoint)

      this._startPoint = copyPoint(definingPoint, false, true)
      this._startPoint.elementId = this.id || undefined
      
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

    if (this._startPoint!.pointId === pointId) {
      return this._startPoint
    }

    if (this._endPoint!.pointId === pointId) {
      return this._endPoint
    }

    if (this._midPoint!.pointId === pointId) {
      return this._midPoint || null
    }

    return null
  }

  setPointById(
    pointId: string,
    newPointX: number, 
    newPointY: number
  ) {
    /*
    TODO: Започнах промяна в едита на арката. Трябва да стане по начина, по който работи АутоКАД
    Тоест, като се едитва едната крайна точка на арката, центъра се мести така, че новата арка да минава 
    през оригиналната средна точка другият край на арката да. Начина на едитване е сменен, но не работи съвсем
    както трябва. Оригиналната средна точка не остава част от арката

    Също по подразбиране в АутоКАД арка се създава по три точки, принадлежащи на арката. Дали да не се добави това
    и да се сложи като дефолтния вариант?
    */
    if (!pointId) {
      throw new Error('Attempting to set point by an empty id parameter')
    }

    let isArcChanged: boolean = false
    if (pointId === this._centerPoint.pointId) {
      this.move(newPointX - this._centerPoint.x, newPointY - this.centerPoint.y)
      isArcChanged = true
    } else if (pointId === this._startPoint?.pointId) {
      const newStartPoint = copyPoint(this._startPoint, true, false)
      newStartPoint.x = newPointX
      newStartPoint.y = newPointY
      const threePointsDeterminant = getThreePointDeterminantResult(
        newStartPoint,
        this._endPoint!,
        this._midPoint!, 
      )
      
      if (
        areAlmostEqual(threePointsDeterminant, 0)
      ) {
        // new point, together with mid point and other end point, are colinear
        // we cannot change the arc that way, so we just hide it (autoCAD does the same)
       this.isShown = false
      } else {
        const oldPointsDeterminant = getThreePointDeterminantResult(
          this._startPoint,
          this._endPoint!,
          this._midPoint!,
        )

        // center point has to change side of imaginary line between start and end points
        // (since midPoint seems to have changed it too)
        const centerChangedSide = threePointsDeterminant > 0 !== oldPointsDeterminant > 0
        if (centerChangedSide) {
          this._startPoint = this._endPoint
          this._endPoint = newStartPoint
        } else {
          this._startPoint = newStartPoint
        }

        this.__updateCenterPoint()
        this.isShown = true
      }

      // const newPoint = getPointByDeltasAndDistance(
      //   this._centerPoint,
      //   newPointX - this._centerPoint.x,
      //   newPointY - this._centerPoint.y,
      //   this._radius
      // )

      // newPoint.pointId = pointId
      // newPoint.elementId = this._startPoint.elementId
      // this._startPoint = newPoint

      // isArcChanged = true
    } else if (pointId === this._endPoint?.pointId) {
      const newEndPoint = copyPoint(this._endPoint, true, false)
      newEndPoint.x = newPointX
      newEndPoint.y = newPointY
      const threePointsDeterminant = getThreePointDeterminantResult(
        this._startPoint!,
        newEndPoint,
        this._midPoint!, 
      )
      
      if (
        areAlmostEqual(threePointsDeterminant, 0)
      ) {
        // new point, together with mid point and other end point, are colinear
        // we cannot change the arc that way, so we just hide it (autoCAD does the same)
       this.isShown = false
      } else {
        const oldPointsDeterminant = getThreePointDeterminantResult(
          this._startPoint!,
          this._endPoint,
          this._midPoint!,
        )

        // center point has to change side of imaginary line between start and end points
        // (since midPoint seems to have changed it too)
        const centerChangedSide = threePointsDeterminant > 0 !== oldPointsDeterminant > 0
        if (centerChangedSide) {
          this._endPoint = this._startPoint
          this._startPoint = newEndPoint
        } else {
          this._endPoint = newEndPoint
        }

        this.__updateCenterPoint()
        this.isShown = true
      }

      // const newPoint = getPointByDeltasAndDistance(
      //   this._centerPoint,
      //   newPointX - this._centerPoint.x,
      //   newPointY - this._centerPoint.y,
      //   this._radius
      // )

      // newPoint.pointId = pointId
      // newPoint.elementId = this._endPoint.elementId
      // this._endPoint = newPoint

      // isArcChanged = true
    }

    if (isArcChanged && this.isFullyDefined) {
      this.__updateDetails()
      return true
    }

    return false
  }

  getBoundingBox() {
    if (!this.isFullyDefined) {
      throw new Error(NOT_DEFINED_ERROR)
    }

    // if (this._isChanged) {
    //   this.__updateDetails()
    // }

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

    this._centerPoint = copyPoint(this._centerPoint, true)
    this._centerPoint.x += dX
    this._centerPoint.y += dY

    this._startPoint = copyPoint(this._startPoint!, true)
    this._startPoint.x += dX
    this._startPoint.y += dY

    this._endPoint = copyPoint(this._endPoint!, true)
    this._endPoint.x += dX
    this._endPoint.y += dY

    this._boundingBox!.left += dX
    this._boundingBox!.right += dX
    this._boundingBox!.top += dY
    this._boundingBox!.bottom += dY
  }

  containsAngle(angle: number) {
    if (!this.isFullyDefined) {
      throw new Error(NOT_DEFINED_ERROR)
    }

    const startAngle = this.__pointAngle(true)!
    const endAngle = this.__pointAngle(false)!

    if (startAngle > endAngle) {
      return angle <= startAngle && angle >= endAngle
    }

    return angle <= startAngle || angle >= endAngle
  }

  setPointsElementId() {
    const elementId = this.id || undefined

    this._centerPoint.elementId = elementId
    if (this._startPoint) {
      this._startPoint.elementId = elementId
    }
    
    if (this._endPoint) {
      this._endPoint.elementId = elementId
    }

    if (this._midPoint) {
      this._midPoint.elementId = elementId
    }
  }

  __updateDetails() {
    this.__updateMidPoint()
    this.__updateBoundingBox()

    if (!this._startPoint || !this._endPoint) {
      return
    }

    const startAngle = this.__pointAngle(true)!
    const endAngle = this.__pointAngle(false)!
    this._isJoined = areAlmostEqual(startAngle, endAngle)
    this._isChanged = false
  }

  __updateBoundingBox() {
    if (!this.isFullyDefined) {
      return
    }

    const centerPoint = this.centerPoint
    const radius = this.radius

    const left = this.containsAngle(180)
      ? centerPoint.x - radius
      : Math.min(this._startPoint!.x, this._endPoint!.x)
    const right = this.containsAngle(0)
      ? centerPoint.x + radius
      : Math.max(this._startPoint!.x, this._endPoint!.x)
    const top = this.containsAngle(270)
      ? centerPoint.y - radius
      : Math.min(this._startPoint!.y, this._endPoint!.y)
    const bottom = this.containsAngle(90)
      ? centerPoint.y + radius
      : Math.max(this._startPoint!.y, this._endPoint!.y)

    this._boundingBox = { left, right, top, bottom }
  }

  private __pointAngle(fromStartPoint: boolean) {
    const point = fromStartPoint ? this._startPoint : this._endPoint
    if (!point) {
      return null
    }

    return getAngleBetweenPoints(this.centerPoint, point)
  }

  private __updateMidPoint() {
    if (!this._startPoint || !this._endPoint) {
      return
    }

    const startAngle = this.__pointAngle(true)!
    const endAngle = this.__pointAngle(false)!

    const angleStartToEnd = Math.abs(startAngle - endAngle)

    if (areAlmostEqual(angleStartToEnd, 180)) {
      const oldMidPoint = this._midPoint
      this._midPoint = getRotatedPointAroundPivot(
        this._startPoint, 
        this._centerPoint, 
        90
      )

      this._midPoint.pointId = oldMidPoint?.pointId || generateId()
      this._midPoint.elementId = this.id!
      
      return
    }

    const isStartLessThanEnd = startAngle < endAngle
    const isLessThan180 = angleStartToEnd < 180

    const deltaSign = isStartLessThanEnd !== isLessThan180 ? 1 : -1

    // line from centerPoint to midPoint has to pass through (midPointX, midPointY)
    // but have length equal to the radius
    const midPointX = (this._startPoint.x + this._endPoint.x) / 2
    const midPointY = (this._startPoint.y + this._endPoint.y) / 2
    const newMidPoint = getPointByDeltasAndDistance(
      this._centerPoint,
      deltaSign * (midPointX - this._centerPoint.x),
      deltaSign * (midPointY - this._centerPoint.y),
      this._radius
    )

    if (!this._midPoint) {
      this._midPoint = newMidPoint
      this._midPoint.pointId = generateId()
      this._midPoint.elementId = this.id!
      return
    }

    this._midPoint.x = newMidPoint.x
    this._midPoint.y = newMidPoint.y
  }

  private __updateCenterPoint() {
    const newCenterPoint = getArcCenterByThreePoints(
      this._startPoint!,
      this._midPoint!,
      this._endPoint!,
    )

    newCenterPoint.pointId = this._centerPoint.pointId
    newCenterPoint.elementId = this._centerPoint.elementId

    this._centerPoint = newCenterPoint
    this._radius = getPointDistance(newCenterPoint, this._startPoint!)
  }
}

export type FullyDefinedArc = Ensure<Arc, 'startPoint' | 'endPoint' | 'startAngle' | 'endAngle'>
