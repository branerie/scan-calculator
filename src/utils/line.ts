import Line, { FullyDefinedLine } from '../drawingElements/line'
import Point from '../drawingElements/point'
import { MAX_NUM_ERROR } from './constants'
import { generateId } from './general'
import { copyPoint, createPoint } from './point'

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
  if (keepIds) {
    if (!line.pointA) {
      throw new Error('Cannot copy line with keepIds = true if line does not have points set')
    }

    const newPointA = new Point(line.pointA.x, line.pointA.y, line.pointA.elementId)
    newPointA.pointId = line.pointA.pointId

    const newPointB = line.pointB ? copyPoint(line.pointB, keepIds) : null
    const newLine = new Line(newPointA, { 
      pointB: newPointB || undefined, 
      groupId: line.groupId || undefined, 
      id: line.id || undefined, 
      midPointId: line.midPoint ? line.midPoint.pointId : undefined 
    })

    if (assignId) {
      newLine.id = generateId()
    }
    
    return newLine as FullyDefinedLine
  }

  const newLine = createLine(
    line.pointA,
    line.pointB,
    { groupId: (line.groupId || undefined), assignId }
  )

  if (line.pointB) {
    newLine.setLastAttribute(line.pointB.x, line.pointB.y)
  }

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

const getLineX = (slope: number, intercept: number, lineY: number) => (lineY - intercept) / (slope || MAX_NUM_ERROR)
const getLineY = (slope: number, intercept: number, lineX: number) => slope * lineX + intercept

export {
  createLine,
  copyLine,
  getPerpendicularPointToLine,
  getPerpendicularToLine,
  getLineX,
  getLineY
}