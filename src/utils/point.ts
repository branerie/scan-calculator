import Point from '../drawingElements/point'
import { degreesToRadians, getAngleBetweenPoints } from './angle'
import { generateId } from './general'
import { areAlmostEqual } from './number'

const createPoint = (
  pointX: number, 
  pointY: number, 
  options: { 
    elementId?: string, 
    assignId?: boolean
  } = {}
) => {
  const { elementId, assignId } = options
  let point
  if (elementId) {
    point = new Point(pointX, pointY, elementId)
  } else {
    point = new Point(pointX, pointY)
  }

  if (assignId) {
      point.pointId = generateId()
  }

  return point
}

const copyPoint = (point: Point, keepIds = false, assignId = false): Point => {
  const newPoint = new Point(point.x, point.y)
  if (keepIds) {
    newPoint.pointId = point.pointId
    newPoint.elementId = point.elementId
  }

  if (assignId) {
    newPoint.pointId = generateId()
  }

  return newPoint
}

const getPointDistance = (a: Point, b: Point) => {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2))
}

const getPointDistanceOnArc = (pointA: Point, pointB: Point, arcCenter: Point) => {
  const angleA = getAngleBetweenPoints(arcCenter, pointA)
  const angleB = getAngleBetweenPoints(arcCenter, pointB)

  let angleBetweenPoints = Math.abs(angleB - angleA)
  if (angleBetweenPoints > 180) {
    angleBetweenPoints = 360 - angleBetweenPoints
  }

  const arcRadius = getPointDistance(arcCenter, pointA)
  
  return 2 * Math.PI * arcRadius * angleBetweenPoints / 360
}

const getRotatedPointAroundPivot = (point: Point, pivotPoint: Point, angle: number) => {
  const rotatedPoint = createPoint(point.x, point.y)

  // uses negative of angle to get counter-clockwise rotation
  const angleInRadians = degreesToRadians(-angle)

  const angleCos = Math.cos(angleInRadians)
  const angleSin = Math.sin(angleInRadians)

  const dX = rotatedPoint.x - pivotPoint.x
  const dY = rotatedPoint.y - pivotPoint.y

  const rotatedX = angleCos * dX - angleSin * dY + pivotPoint.x
  const rotatedY = angleSin * dX + angleCos * dY + pivotPoint.y

  rotatedPoint.x = rotatedX
  rotatedPoint.y = rotatedY

  return rotatedPoint
}

const getPointByDeltasAndDistance = (originPoint: Point, deltaX: number, deltaY: number, distance: number) => {
  const slope = Math.abs(deltaX / deltaY)

  const deltaYSign = deltaY > 0 ? 1 : -1
  const dY = deltaYSign * Math.sqrt((distance**2)/(slope**2 + 1))

  const deltaXSign = deltaX > 0 ? 1: -1
  const dX = deltaXSign * Math.abs(slope * dY)

  const newPoint = createPoint(
    originPoint.x + dX,
    originPoint.y + dY,
  )

  return newPoint
}

const getUniquePoints = (points: Point[]) => {
  const pointsByCoordinates: Record<string, Point> = {}
  for (const point of points) {
    const coordinatesKey = `${point.x},${point.y}`

    if (coordinatesKey in pointsByCoordinates) {
      continue
    }

    pointsByCoordinates[coordinatesKey] = point
  }

  return Object.values(pointsByCoordinates)
}

const pointsMatch = (
  pointA: Point, 
  pointB: Point, 
  options: { 
    checkX: boolean, 
    checkY: boolean 
  } = {
    checkX: true,
    checkY: true
  }
) => {
  const { checkX, checkY } = options
  return (
    (checkX && areAlmostEqual(pointA.x, pointB.x)) && 
    (checkY && areAlmostEqual(pointA.y, pointB.y))
  )
}

const getThreePointDeterminantResult = (a: Point, b: Point, c: Point) => {
  return (b.x - a.x)*(c.y - a.y) - (b.y - a.y)*(c.x - a.x)
}

const arePointsColinear = (a: Point, b: Point, c: Point) => areAlmostEqual(getThreePointDeterminantResult(a, b, c),  0)

export {
  createPoint,
  copyPoint,
  getPointDistance,
  getPointDistanceOnArc,
  getRotatedPointAroundPivot,
  getPointByDeltasAndDistance,
  getUniquePoints,
  pointsMatch,
  getThreePointDeterminantResult,
  arePointsColinear
}