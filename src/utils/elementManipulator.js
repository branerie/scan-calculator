import { createElement } from './elementFactory'
import Arc from "../drawingElements/arc"
import Line from "../drawingElements/line"
import Point from "../drawingElements/point"
import Polyline from "../drawingElements/polyline"
import Circle from '../drawingElements/circle'

class ElementManipulator {
    static copyElement(element, keepIds = false) {
        const functionName = `copy${element.type.charAt(0).toUpperCase() + element.type.slice(1)}`

        const func = ElementManipulator[functionName]
        console.log(func)
        return func(element, keepIds)
    }
    
    static copyLine(line, keepIds = false) {
        if (keepIds) {
            const newPointA = new Point(line.pointA.x, line.pointA.y)
            newPointA.pointId = line.pointA.pointId
    
            const newPointB = new Point(line.pointB.x, line.pointB.y)
            newPointB.pointId = line.pointB.pointId
            const newLine = new Line(newPointA, newPointB, line.groupId)
            newLine.id = line.id
            return newLine
        }
    
        const newLine = createElement('line', line.pointA.x, line.pointA.y, line.groupId)
        newLine.setLastAttribute(createElement('point', line.pointB.x, line.pointB.y))
        return newLine
    }

    static copyPolyline(polyline, keepIds = false) {
        let newPolyline
        if (keepIds) {
            const newInitialPoint = new Point(polyline.basePoint.x, polyline.basePoint.y)
            newInitialPoint.pointId = polyline.basePoint.pointId
            newPolyline = new Polyline(newInitialPoint, polyline.groupId)
            newPolyline.id = polyline.id
        } else {
            newPolyline = createElement('polyline', polyline.basePoint.x, polyline.basePoint.y)
        }
    
        newPolyline.elements = polyline.elements.map(e => ElementManipulator.copyElement(e, keepIds))
        return newPolyline
    }
    
    static copyArc(arc, keepIds = false) {
        const newStartLine = ElementManipulator.copyLine(arc.startLine, keepIds)
        const newEndLine = ElementManipulator.copyLine(arc.endLine, keepIds)
    
        if (keepIds) {
            const newCenterPoint = new Point(arc.centerPoint.x, arc.centerPoint.y)
            newCenterPoint.pointId = arc.centerPoint.pointId
    
            const newArc = new Arc(newCenterPoint, arc.groupId)
            newArc.startLine = newStartLine
            newArc.endLine = newEndLine
            newArc.radius = arc.radius
            newArc.id = arc.id
            return newArc
        }
    
        const newArc = createElement('arc', arc.centerPoint.x, arc.centerPoint.y, arc.groupId)
        newArc.startLine = newStartLine
        newArc.endLine = newEndLine
        newArc.radius = arc.radius
        return newArc
    }

    static copyCircle(circle, keepIds = false) {
        if (keepIds) {
            const newCenterPoint = new Point(circle.centerPoint.x, circle.centerPoint.y)
            newCenterPoint.pointId = circle.centerPoint.pointId

            const newCircle = new Circle(newCenterPoint)
            newCircle.endPoints = [...circle.endPoints]
            newCircle.radius = circle.radius
            newCircle.id = circle.id
            return newCircle
        }

        const newCircle = createElement('circle', circle.centerPoint.x, circle.centerPoint.y)
        newCircle.radius = circle.radius
        return newCircle
    }
}

export default ElementManipulator