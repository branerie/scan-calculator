import Line, { FullyDefinedLine } from '../drawingElements/line'
import Point from '../drawingElements/point'
import { MAX_NUM_ERROR } from './constants'
import { generateId } from './general'
import { copyPoint, createPoint, getThreePointDeterminantResult } from './point'

const createLine = (
  initialPoint: Point, 
  lastPoint: Point,
  options: { 
    groupId?: string, 
    assignId?: boolean, 
    pointsElementId?: string 
  } = {}
): FullyDefinedLine => {
  const { groupId, assignId, pointsElementId } = options 

  if (pointsElementId) {
    initialPoint = copyPoint(initialPoint, true, false)
    initialPoint.elementId = pointsElementId

    lastPoint = copyPoint(lastPoint, true, false)
    lastPoint.elementId = pointsElementId
  }

  const line = new Line(initialPoint, {
    pointB: lastPoint,
    groupId,
  })

  if (assignId) {
    line.id = generateId()
  }

  return line as FullyDefinedLine
}

const copyLine = (line: FullyDefinedLine, keepIds = false, assignId = false): FullyDefinedLine => {
  const newPointA = copyPoint(line.pointA, keepIds, !keepIds)
  const newPointB = copyPoint(line.pointB, keepIds, !keepIds)
  if (keepIds) {
    const newLine = new Line(newPointA, { 
      pointB: newPointB || undefined, 
      groupId: line.groupId || undefined, 
      id: line.id || undefined, 
      midPointId: line?.midPoint?.pointId || undefined 
    })

    if (assignId) {
      newLine.id = generateId()
    }
    
    return newLine as FullyDefinedLine
  }

  const newLine = createLine(
    newPointA,
    newPointB,
    { assignId }
  )

  return newLine
}

const getPerpendicularPointToLine = (initialPoint: Point, line: Line) => {
  if (line.isVertical) {
    return createPoint(line.pointA.x, initialPoint.y)
  }

  if (line.isHorizontal) {
    return createPoint(initialPoint.x, line.pointA.y)
  }

  const { slope, intercept: lineIntercept } = line.equation

  // mp = - 1 / m (slope of perpendicular)
  // bp = yp - mp * xp = yp + (xp / m)
  const perpendicularIntercept = initialPoint.y + initialPoint.x / slope

  const intersectX = slope * (perpendicularIntercept - lineIntercept) / (slope ** 2 + 1)
  const intersectY = intersectX * slope + lineIntercept

  return createPoint(intersectX, intersectY)
}

const getPerpendicularToLine = (initialPoint: Point, line: Line) => {
  const perpendicularPoint = getPerpendicularPointToLine(initialPoint, line)
  return createLine(initialPoint, perpendicularPoint)
}

const getPointSideOfLine = (point: Point, line: FullyDefinedLine) => {
  const a = line.pointA,
        b = line.pointB,
        c = point

  const sideResult = getThreePointDeterminantResult(a, b, c)
  if (sideResult > 0) {
    return 'left'
  } 
  
  if (sideResult < 0) {
    return 'right'
  }

  return 'colinear'
}

const getLineX = (slope: number, intercept: number, lineY: number) => (lineY - intercept) / (slope || MAX_NUM_ERROR)
const getLineY = (slope: number, intercept: number, lineX: number) => slope * lineX + intercept

export {
  createLine,
  copyLine,
  getPerpendicularPointToLine,
  getPerpendicularToLine,
  getPointSideOfLine,
  getLineX,
  getLineY
}