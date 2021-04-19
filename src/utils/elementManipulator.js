import { createElement } from './elementFactory'
import Arc from '../drawingElements/arc'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'
import Circle from '../drawingElements/circle'
import Rectangle from '../drawingElements/rectangle'

class ElementManipulator {
    static copyElement(element, keepIds = false) {
        const functionName = `copy${element.type.charAt(0).toUpperCase() + element.type.slice(1)}`

        const func = ElementManipulator[functionName]
        return func(element, keepIds)
    }
    
    static copyLine(line, keepIds = false) {
        if (keepIds) {
            const newPointA = new Point(line.pointA.x, line.pointA.y)
            newPointA.pointId = line.pointA.pointId
    
            const newPointB = line.pointB ? ElementManipulator.copyPoint(line.pointB, keepIds) : null
            const newLine = new Line(newPointA, { 
                pointB: newPointB, 
                groupId: line.groupId, 
                id: line.id, 
                midPointId: line.midPoint ? line.midPoint.pointId : null 
            })
            
            return newLine
        }
    
        const newLine = createElement('line', line.pointA.x, line.pointA.y, line.groupId)

        if (line.pointB) {
            newLine.setLastAttribute(createElement('point', line.pointB.x, line.pointB.y))
        }

        return newLine
    }

    static copyPolyline(polyline, keepIds = false) {
        let newPolyline
        if (keepIds) {
            const newInitialPoint = ElementManipulator.copyPoint(polyline.basePoint, keepIds)
            newPolyline = new Polyline(newInitialPoint, { id: polyline.id, groupId: polyline.groupId })
        } else {
            newPolyline = createElement('polyline', polyline.basePoint.x, polyline.basePoint.y)
        }
    
        newPolyline.elements = polyline.elements.map(e => ElementManipulator.copyElement(e, keepIds))
        return newPolyline
    }

    static copyRectangle(rectangle, keepIds = false) {
        const initialPoint = rectangle.elements[0].pointA

        let newRectangle
        if (keepIds) {
            const newInitialPoint = ElementManipulator.copyPoint(initialPoint, keepIds)
            newRectangle = new Rectangle(newInitialPoint, { id: rectangle.id, groupId: rectangle.groupId }) 
        } else {
            newRectangle = createElement('rectangle', initialPoint.x, initialPoint.y)
        }

        newRectangle.elements = rectangle.elements.map(line => ElementManipulator.copyLine(line, keepIds))
        return newRectangle
    } 
    
    static copyArc(arc, keepIds = false) {
        const newStartLine = arc.startLine ? ElementManipulator.copyLine(arc.startLine, keepIds) : null
        const newEndLine = arc.endLine ? ElementManipulator.copyLine(arc.endLine, keepIds) : null
        const newMidLine = arc.midLine ? ElementManipulator.copyLine(arc.midLine, keepIds) : null

        let newCenterPoint
        if (keepIds) {
            newCenterPoint = new Point(arc.centerPoint.x, arc.centerPoint.y)
            newCenterPoint.pointId = arc.centerPoint.pointId
        } else {
            newCenterPoint = createElement('point', arc.centerPoint.x, arc.centerPoint.y)
        }
    
        const newArc = new Arc(
            newCenterPoint, 
            { 
                groupId: arc.groupId,
                id: arc.id,
                radius: arc.radius,
                startLine: newStartLine,
                endLine: newEndLine,
                midLine: newMidLine
            }
        )

        return newArc
    }

    static copyCircle(circle, keepIds = false) {
        const newCenterPoint = ElementManipulator.copyPoint(circle.centerPoint, keepIds)
        const newEndPoints = circle.endPoints 
                                ? circle.endPoints.map(ep => ElementManipulator.copyPoint(ep, keepIds))
                                : null

        const newCircle = new Circle(newCenterPoint, { radius: circle.radius, endPoints: newEndPoints, id: circle.id })
        return newCircle
    }

    static copyPoint(point, keepIds = false) {
        const newPoint = new Point(point.x, point.y)
        if (keepIds) {
            newPoint.pointId = point.pointId
        }

        return newPoint
    }
}

export default ElementManipulator