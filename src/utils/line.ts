import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import { MAX_NUM_ERROR } from './constants'
import { createLine, createPoint } from './elementFactory'

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
  return createLine(initialPoint.x, initialPoint.y, perpendicularPoint.x, perpendicularPoint.y)
}

const getLineX = (slope: number, intercept: number, lineY: number) => (lineY - intercept) / (slope || MAX_NUM_ERROR)
const getLineY = (slope: number, intercept: number, lineX: number) => slope * lineX + intercept

export {
  getPerpendicularPointToLine,
  getPerpendicularToLine,
  getLineX,
  getLineY
}