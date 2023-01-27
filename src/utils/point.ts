import Point from '../drawingElements/point'
import { degreesToRadians, getAngleBetweenPoints } from './angle'
import { createPoint } from './elementFactory'
import { generateId } from './general'
import { areAlmostEqual } from './number'

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

// TODO: not tested
const getPointDistanceOnArc = (pointA: Point, pointB: Point, arcCenter: Point) => {
  const angleA = getAngleBetweenPoints(arcCenter, pointA)
  const angleB = getAngleBetweenPoints(arcCenter, pointB)

  const angleBetweenPoints = 360 - angleA + angleB
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

export {
  copyPoint,
  getPointDistance,
  getPointDistanceOnArc,
  getRotatedPointAroundPivot,
  getUniquePoints,
  pointsMatch
}