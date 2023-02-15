import Arc, { FullyDefinedArc } from '../drawingElements/arc'
import Point from '../drawingElements/point'
import { getAngleBetweenPoints } from './angle'
import { generateId } from './general'
import { createLine, getPerpendicularToLine } from './line'
import { copyPoint, createPoint } from './point'
import { Ensure } from './types/generics'

const createArc = (
  centerPoint: Point, 
  startPoint: Point, 
  endPoint: Point,
  options: { 
    groupId?: string, 
    assignId?: boolean, 
    pointsElementId?: string 
  } = {}
): FullyDefinedArc => {
  const { groupId, assignId, pointsElementId } = options

  if (pointsElementId) {
    centerPoint = copyPoint(centerPoint, true, false)
    centerPoint.elementId = pointsElementId
    startPoint = copyPoint(startPoint, true, false)
    startPoint.elementId = pointsElementId
    endPoint = copyPoint(endPoint, true, false)
    endPoint.elementId = pointsElementId
  }

  const newArc = new Arc(centerPoint, {
    startPoint,
    endPoint,
    groupId
  }) as FullyDefinedArc

  if (assignId) {
    newArc.id = generateId()
  }

  return newArc
}

const copyArc = (arc: FullyDefinedArc, keepIds = false, assignId = false): FullyDefinedArc => {
  let centerPoint = arc.centerPoint,
      startPoint = arc.startPoint,
      endPoint = arc.endPoint
  if (!keepIds) {
    centerPoint = copyPoint(centerPoint, false, true)
    startPoint = copyPoint(startPoint, false, true)
    endPoint = copyPoint(endPoint, false, true)
  }

  const groupId = keepIds ? arc.groupId || undefined : undefined
  return createArc(
    centerPoint,
    startPoint,
    endPoint, { 
      groupId, 
      assignId 
    }
  )
}

const getPointWithMinDimension = (firstPoint: Point, secondPoint: Point, dim: 'x' | 'y') =>
    firstPoint[dim] < secondPoint[dim] ? firstPoint : secondPoint

const getPointWithMaxDimension = (firstPoint: Point, secondPoint: Point, dim: 'x' | 'y') =>
    firstPoint[dim] > secondPoint[dim] ? firstPoint : secondPoint



const getArcEndPoints = (arc: Ensure<Arc, 'startPoint' | 'endPoint'>) => {
    const centerPoint = arc.centerPoint
    const radius = arc.radius
    const startPoint = arc.startPoint
    const endPoint = arc.endPoint

    const left = arc.containsAngle(180) 
      ? createPoint(centerPoint.x - radius, centerPoint.y)
      : getPointWithMinDimension(startPoint, endPoint, 'x')
    const right = arc.containsAngle(0) 
      ? createPoint(centerPoint.x + radius, centerPoint.y)
      : getPointWithMaxDimension(startPoint, endPoint, 'x')
    const top = arc.containsAngle(270) 
      ? createPoint(centerPoint.x, centerPoint.y - radius)
      : getPointWithMinDimension(startPoint, endPoint, 'y')
    const bottom = arc.containsAngle(90) 
      ? createPoint(centerPoint.x, centerPoint.y + radius)
      : getPointWithMaxDimension(startPoint, endPoint, 'y')

    return { left, right, top, bottom }
}

const getPointsAngleDistance = (
  arcCenter: Point, 
  shouldCheckClockwise: boolean, 
  pointFrom: Point, 
  pointTo: Point
) => {
  const angleFrom = getAngleBetweenPoints(arcCenter, pointFrom)
  const angleTo = getAngleBetweenPoints(arcCenter, pointTo)

  if (shouldCheckClockwise) {
    if (angleFrom < angleTo) {
      return angleTo - angleFrom
    }

    return (360 - angleFrom) + angleTo
  }

  if (angleFrom > angleTo) {
    return angleFrom - angleTo
  }

  return (360 - angleTo) + angleFrom
}

const getArcCenterByThreePoints = (pointA: Point, pointB: Point, pointC: Point) => {
  const firstLine = createLine(pointA, pointB, { assignId: false })
  const secondLine = createLine(pointB, pointC, { assignId: false })

  const { slope: firstLineSlope } = firstLine.equation
  const { slope: secondLineSlope } = secondLine.equation

  const firstLineMidPoint = firstLine.midPoint!
  const secondLineMidPoint = secondLine.midPoint!

  /**
   * Idea is to get the perpendiculars of two lines between the three points
   * The intersection of these perpendiculars is where the center point is located
   */

  // mp = - 1 / m (slope of perpendicular)
  // bp = yp - mp * xp = yp + (xp / m) (intercept of perpendicular)
  const firstPerpSlope = -1 / firstLineSlope
  const firstPerpIntercept = firstLineMidPoint.y - firstPerpSlope * firstLineMidPoint.x

  const secondPerpSlope = -1 / secondLineSlope
  const secondPerpIntercept = secondLineMidPoint.y - secondPerpSlope * secondLineMidPoint.x

  // m1 * x + b1 = m2 * x + b2 => x = (b2 - b1) / (m1 - m2)
  // y = m1 * x + b1 || m2 * x + b2
  const centerX = (secondPerpIntercept - firstPerpIntercept) / (firstPerpSlope - secondPerpSlope)
  const centerY = firstPerpSlope * centerX + firstPerpIntercept

  return createPoint(centerX, centerY, { assignId: false })
}

export {
  createArc,
  copyArc,
  getArcEndPoints,
  getPointsAngleDistance,
  getArcCenterByThreePoints
}