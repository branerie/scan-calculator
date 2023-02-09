import { createElement } from './elementFactory'
import Line, { FullyDefinedLine } from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline, { SubElement } from '../drawingElements/polyline'
import Rectangle from '../drawingElements/rectangle'
import Element from '../drawingElements/element'
import { Ensure } from './types/generics'
import Arc from '../drawingElements/arc'
import Circle from '../drawingElements/circle'
import { generateId } from './general'
import { copyPoint } from './point'

class ElementManipulator {
  static copyElement(element: Element, { keepIds = false, assignId = false } = {}): Element {
    // if (element.type === 'point') {
    //     return copyPoint(element, keepIds)
    // }

    // const methodName = `copy${element.type.charAt(0).toUpperCase() + element.type.slice(1)}`
    // const copyingMethod = ElementManipulator[methodName]

    // const newElement = copyingMethod(element, keepIds, assignId)
    // if (!keepIds) {
    //   newElement.id = generateId()
    // }

    // return newElement

    let newElement: Element
    if (element instanceof Line) {
      newElement = ElementManipulator.copyLine(element, keepIds, assignId)
    } else if (element instanceof Circle) {
      newElement = ElementManipulator.copyCircle(element, keepIds, assignId)
    } else if (element instanceof Arc) {
      newElement = ElementManipulator.copyArc(element, keepIds, assignId)
    } else if (element instanceof Rectangle) {
      newElement = ElementManipulator.copyRectangle(element, keepIds, assignId)
    } else if (element instanceof Polyline) {
      if (!element.basePoint) {
        throw new Error('Cannot copy polyline with no base point')
      }

      newElement = ElementManipulator.copyPolyline(
        element as Ensure<Polyline, 'basePoint'>, 
        keepIds, 
        assignId
      )
    } else {
      throw new Error('Method copyElement not implemented for elements of type ' + typeof element)
    }

    if (assignId) {
      newElement.id = generateId()
    } else if (!keepIds) {
      newElement.id = null
    }

    return newElement
  }
  
  static copyLine(line: Line, keepIds = false, assignId = false): Line {
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
      
      return newLine
    }

    const newLine = createElement(
      Line, 
      line.pointA,
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
      const newInitialPoint = copyPoint(polyline.basePoint, keepIds)
      const newPolyline = new Polyline(
        newInitialPoint, 
        { 
          id: polyline.id || undefined, 
          groupId: polyline.groupId || undefined, 
          elements: copiedElements
        }
      )

      if (assignId) {
        newPolyline.id = generateId()
      }

      return newPolyline
    }
    
    const newPolyline = createElement(
      Polyline, 
      polyline.basePoint,
      { assignId }
    )

    newPolyline.elements = copiedElements

    return newPolyline
  }

  static copyRectangle(rectangle: Rectangle, keepIds = false, assignId = false): Rectangle {
    const initialPoint = rectangle.elements[0].pointA

    let newRectangle
    if (keepIds) {
      const newInitialPoint = copyPoint(initialPoint, keepIds)
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
        initialPoint, 
        { assignId }
      )
    }

    if (assignId) {
      newRectangle.id = generateId()
    }

    newRectangle.elements = rectangle.elements.map(line => ElementManipulator.copyLine(line, keepIds) as FullyDefinedLine)
    return newRectangle
  } 
  
  static copyArc(arc: Arc, keepIds = false, assignId = false): Arc {
    const newArc = createElement(
      Arc,
      arc.centerPoint, { 
      groupId: arc.groupId, 
      assignId,
        ...(keepIds && { pointsElementId: arc.id }) 
    })

    if (keepIds && !assignId && arc.id) {
      newArc.id = arc.id
    }

    if (arc.startPoint) {
      newArc.startPoint = {
        ...arc.startPoint,
        pointId: keepIds ? arc.startPoint.pointId : (assignId ? generateId() : undefined)
      }
    }

    if (arc.endPoint) {
      newArc.endPoint = {
        ...arc.endPoint,
        pointId: keepIds ? arc.endPoint.pointId : (assignId ? generateId() : undefined)
      }
    }

    newArc.radius = arc.radius
    if (keepIds) {
      newArc.midPointId = arc.midPoint?.pointId
    }

    return newArc
  }

  static copyCircle(circle: Circle, keepIds = false, assignId = false): Circle {
    const newCircle = createElement(
      Circle, 
      circle.centerPoint, {
        assignId,
        ...(keepIds && { pointsElementId: circle.id }) 
      }
    )

    newCircle.radius = circle.radius
    const newEndPoints = circle.endPoints 
        ? circle.endPoints.map(ep => copyPoint(ep, keepIds))
        : undefined
    newCircle.endPoints = newEndPoints
    if (keepIds && !assignId) {
      newCircle.id = circle.id
    }
        
    // const newCircle = new Circle(newCenterPoint, { radius: circle.radius, endPoints: newEndPoints, id: circle.id })
    return newCircle
  }
}

export default ElementManipulator