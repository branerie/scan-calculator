import { v4 as uuidv4 } from 'uuid'
import Arc from '../drawingElements/arc'
import Circle from '../drawingElements/circle'
import Element from '../drawingElements/element'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import ElementManipulator from './elementManipulator'
import { Ensure } from './types/generics'
import { FullyDefinedArc, FullyDefinedElement, FullyDefinedLine } from './types/index'

function createElement<TType extends Element> (
  type: {new(...args : any[]): TType ;},
  initialPoint: Point,
  options: { 
    groupId?: string | null, 
    assignId?: boolean, 
    pointsElementId?: string | null 
  } = {
    groupId: null,
    assignId: false,
    pointsElementId: null
  },
): Ensure<TType, 'startPoint' | 'endPoint'> {
  if (
    (!initialPoint.x && initialPoint.x !== 0) || 
    (!initialPoint.y && initialPoint.y !== 0)
  ) {
    throw new Error('Cannot create element with undefined initial point coordinates.')
  }

  const {
    groupId,
    assignId,
    pointsElementId
  } = options

  const initialPointCopy = ElementManipulator.copyPoint(initialPoint, false, true)

  let newElementId: string | undefined
  if (assignId) {
    newElementId = uuidv4()
    initialPointCopy.elementId = newElementId
  }

  if (pointsElementId) {
    initialPointCopy.elementId = pointsElementId
  }

  let createdElement: TType
  if (typeof Circle === typeof type) {
    createdElement = new type(initialPointCopy)
  } else {
    createdElement = new type(initialPointCopy, { groupId })
  }

  if (newElementId) {
    createdElement.id = newElementId
  }
  
  if (pointsElementId) {
    initialPoint.elementId = pointsElementId
  }
  
  return createdElement as Ensure<TType, 'startPoint' | 'endPoint'>
}

const createPoint = (
  pointX: number, 
  pointY: number, 
  options: { 
    elementId?: string, 
    assignId?: boolean
  } = {}) => {
    const { elementId, assignId } = options
    let point
    if (elementId) {
      point = new Point(pointX, pointY, elementId)
    } else {
      point = new Point(pointX, pointY)
    }

    if (assignId) {
        point.pointId = uuidv4()
    }

    return point
}

const createLine = (
  initialPointX: number, 
  initialPointY: number, 
  lastPointX: number | null, 
  lastPointY: number | null, 
  options: { 
    groupId?: string, 
    assignId?: boolean, 
    pointsElementId?: string 
  } = {}
): FullyDefinedLine => {
  const { groupId, assignId, pointsElementId } = options 
  const line = createElement(
    Line,
    { x: initialPointX, y: initialPointY },
    { groupId, assignId, pointsElementId }
  )

  if ((lastPointX || lastPointX === 0) && (lastPointY || lastPointY === 0)) {
      line.setPointB(lastPointX, lastPointY)
  }

  return line as FullyDefinedLine
}

const createArc = (
  centerPoint: Point, 
  startPoint: Point, 
  endPoint: Point
): FullyDefinedArc => {
  return new Arc(centerPoint, {
    startLine: new Line(centerPoint, { pointB: startPoint }) as FullyDefinedLine,
    endLine: new Line(centerPoint, { pointB: endPoint }) as FullyDefinedLine
  }) as FullyDefinedArc
}

export {
  createElement,
  createPoint,
  createLine,
  createArc,
}