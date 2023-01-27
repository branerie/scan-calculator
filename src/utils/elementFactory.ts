import Arc, { FullyDefinedArc } from '../drawingElements/arc'
import Circle from '../drawingElements/circle'
import Element, { FullyDefinedElement } from '../drawingElements/element'
import Line, { FullyDefinedLine } from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'
import Rectangle from '../drawingElements/rectangle'
import { DrawTool } from '../stores/tools/index'
import { generateId } from './general'
import { copyPoint } from './point'
import { Ensure } from './types/generics'

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

  const initialPointCopy = copyPoint(initialPoint, false, true)

  let newElementId: string | undefined
  if (assignId) {
    newElementId = generateId()
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

function createElementFromName(
  type: DrawTool['name'],
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
): FullyDefinedElement {
  switch(type) {
    case 'line':
      return createElement(Line, initialPoint, options)
    case 'arc':
      return createElement(Arc, initialPoint, options)
    case 'circle':
      return createElement(Circle, initialPoint, options) 
    case 'polyline':
      return createElement(Polyline, initialPoint, options) 
    case 'rectangle':
      return createElement(Rectangle, initialPoint, options) 
    default:
      throw new Error(`Function createElement not implemented for type ${type}`)
  }
}

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
  createElementFromName,
  createPoint,
  createLine,
  createArc,
}