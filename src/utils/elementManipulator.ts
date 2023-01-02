import { v4 as uuidv4 } from 'uuid'
import { createElement } from './elementFactory'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline, { SubElement } from '../drawingElements/polyline'
import Rectangle from '../drawingElements/rectangle'
import Element from '../drawingElements/element'
import { Ensure } from './types/generics'
import Arc from '../drawingElements/arc'
import Circle from '../drawingElements/circle'
import { FullyDefinedLine } from './types/index'

class ElementManipulator {
  static copyElement(element: Element, { keepIds = false, assignId = false }): Element {
    // if (element.type === 'point') {
    //     return ElementManipulator.copyPoint(element, keepIds)
    // }

    // const methodName = `copy${element.type.charAt(0).toUpperCase() + element.type.slice(1)}`
    // const copyingMethod = ElementManipulator[methodName]

    // const newElement = copyingMethod(element, keepIds, assignId)
    // if (!keepIds) {
    //   newElement.id = uuidv4()
    // }

    // return newElement

    if (element instanceof Line) {
      return ElementManipulator.copyLine(element, keepIds, assignId)
    } else if (element instanceof Circle) {
      return ElementManipulator.copyCircle(element, keepIds, assignId)
    } else if (element instanceof Arc) {
      return ElementManipulator.copyArc(element, keepIds, assignId)
    } else if (element instanceof Rectangle) {
      return ElementManipulator.copyRectangle(element, keepIds, assignId)
    } else if (element instanceof Polyline) {
      if (!element.basePoint) {
        throw new Error('Cannot copy polyline with no base point')
      }

      return ElementManipulator.copyPolyline(
        element as Ensure<Polyline, 'basePoint'>, 
        keepIds, 
        assignId
      )
    }

    throw new Error('Method copyElement not implemented for elements of type ' + typeof element)
  }
  
  static copyLine(line: Line, keepIds = false, assignId = false): Line {
    if (keepIds) {
      if (!line.pointA) {
        throw new Error('Cannot copy line with keepIds = true if line does not have points set')
      }

      const newPointA = new Point(line.pointA.x, line.pointA.y, line.pointA.elementId)
      newPointA.pointId = line.pointA.pointId

      const newPointB = line.pointB ? ElementManipulator.copyPoint(line.pointB, keepIds) : null
      const newLine = new Line(newPointA, { 
        pointB: newPointB || undefined, 
        groupId: line.groupId || undefined, 
        id: line.id || undefined, 
        midPointId: line.midPoint ? line.midPoint.pointId : undefined 
      })

      if (assignId) {
        newLine.id = uuidv4()
      }
      
      return newLine
    }

    const newLine = createElement(
      Line, 
      ElementManipulator.copyPoint(line.pointA, keepIds),
      { groupId: line.groupId, assignId }
    )

    if (line.pointB) {
      newLine.setLastAttribute(line.pointB.x, line.pointB.y)
    }

    return newLine
  }

  static copyPolyline(
    polyline: Ensure<Polyline, 'basePoint'>, 
    keepIds = false, 
    assignId = false
  ): Polyline {
    const copiedElements = polyline.elements.map(e => 
      ElementManipulator.copyElement(e, { keepIds, assignId: !keepIds })
    ) as SubElement[]

    if (keepIds) {
      const newInitialPoint = ElementManipulator.copyPoint(polyline.basePoint, keepIds)
      const newPolyline = new Polyline(
        newInitialPoint, 
        { 
          id: polyline.id || undefined, 
          groupId: polyline.groupId || undefined, 
          elements: copiedElements
        }
      )

      if (assignId) {
        newPolyline.id = uuidv4()
      }

      return newPolyline
    }
    
    const newPolyline = createElement(
      Polyline, 
      ElementManipulator.copyPoint(polyline.basePoint,  keepIds),
      { assignId }
    )

    newPolyline.elements = copiedElements

    return newPolyline
  }

  static copyRectangle(rectangle: Rectangle, keepIds = false, assignId = false): Rectangle {
    const initialPoint = rectangle.elements[0].pointA

    let newRectangle
    if (keepIds) {
      const newInitialPoint = ElementManipulator.copyPoint(initialPoint, keepIds)
      newRectangle = new Rectangle(
        newInitialPoint, 
        { 
          id: rectangle.id || undefined, 
          groupId: rectangle.groupId || undefined 
        }
      ) 
    } else {
      newRectangle = createElement(
        Rectangle, 
        ElementManipulator.copyPoint(initialPoint, keepIds), 
        { assignId }
      )
    }

    if (assignId) {
      newRectangle.id = uuidv4()
    }

    newRectangle.elements = rectangle.elements.map(line => ElementManipulator.copyLine(line, keepIds))
    return newRectangle
  } 
  
  static copyArc(arc: Arc, keepIds = false, assignId = false): Arc {
    // const newStartLine = arc.startLine ? ElementManipulator.copyLine(arc.startLine, keepIds) : null
    // const newEndLine = arc.endLine ? ElementManipulator.copyLine(arc.endLine, keepIds) : null
    // const newMidLine = arc.midLine ? ElementManipulator.copyLine(arc.midLine, keepIds) : null

    // let newCenterPoint
    // if (keepIds) {
    //     newCenterPoint = new Point(arc.centerPoint.x, arc.centerPoint.y)
    //     newCenterPoint.pointId = arc.centerPoint.pointId
    // } else {
    //     newCenterPoint = createElement('point', ElementManipulator.copyPoint(arc.centerPoint, keepIds))
    // }

    // const newArc = new Arc(
    //     newCenterPoint, 
    //     { 
    //         groupId: arc.groupId,
    //         id: arc.id,
    //         radius: arc.radius,
    //         startLine: newStartLine,
    //         endLine: newEndLine,
    //         midLine: newMidLine
    //     }
    // )

    // return newArc


    
    // const newCenterPoint = ElementManipulator.copyPoint(arc.centerPoint, keepIds)

    const newArc = createElement(
      Arc,
      ElementManipulator.copyPoint(arc.centerPoint, keepIds), { 
      groupId: arc.groupId, 
      assignId,
        ...(keepIds && { pointsElementId: arc.id }) 
    })

    if (keepIds && !assignId) {
      newArc.id = arc.id
    }

    newArc.startLine = arc.startLine ? ElementManipulator.copyLine(arc.startLine, keepIds) as FullyDefinedLine : undefined
    newArc.endLine = arc.endLine ? ElementManipulator.copyLine(arc.endLine, keepIds) as FullyDefinedLine : undefined
    newArc.midLine = arc.midLine ? ElementManipulator.copyLine(arc.midLine, keepIds) as FullyDefinedLine : undefined

    // const newArc = new Arc(
    //     newCenterPoint, 
    //     { 
    //         groupId: arc.groupId,
    //         id: arc.id,
    //         radius: arc.radius,
    //         startLine: newStartLine,
    //         endLine: newEndLine,
    //         midLine: newMidLine
    //     }
    // )

    return newArc
  }

  static copyCircle(circle: Circle, keepIds = false, assignId = false): Circle {
    const newCircle = createElement(
      Circle, 
      ElementManipulator.copyPoint(circle.centerPoint, keepIds, assignId), {
      assignId,
      ...(keepIds && { pointsElementId: circle.id }) 
    })

    newCircle.radius = circle.radius
    const newEndPoints = circle.endPoints 
        ? circle.endPoints.map(ep => ElementManipulator.copyPoint(ep, keepIds))
        : undefined
    newCircle.endPoints = newEndPoints
    if (keepIds && !assignId) {
      newCircle.id = circle.id
    }
        
    // const newCircle = new Circle(newCenterPoint, { radius: circle.radius, endPoints: newEndPoints, id: circle.id })
    return newCircle
  }

  static copyPoint(point: Point, keepIds = false, assignId = false): Point {
    const newPoint = new Point(point.x, point.y)
    if (keepIds) {
      newPoint.pointId = point.pointId
      newPoint.elementId = point.elementId
    }

    if (assignId) {
      newPoint.pointId = uuidv4()
    }

    return newPoint
  }
}

export default ElementManipulator