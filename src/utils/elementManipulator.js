import { v4 as uuidv4 } from 'uuid'
import { createElement } from './elementFactory'
import Arc from '../drawingElements/arc'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'
import Circle from '../drawingElements/circle'
import Rectangle from '../drawingElements/rectangle'

class ElementManipulator {
    static copyElement(element, { keepIds = false, assignId = false }) {
        if (element.type === 'point') {
            return ElementManipulator.copyPoint(element, keepIds)
        }

        const methodName = `copy${element.type.charAt(0).toUpperCase() + element.type.slice(1)}`

        const copyingMethod = ElementManipulator[methodName]
        const newElement = copyingMethod(element, keepIds, assignId)
        if (!keepIds) {
            newElement.id = uuidv4()
        }

        return newElement
    }
    
    static copyLine(line, keepIds = false, assignId = false) {
        if (keepIds) {
            const newPointA = new Point(line.pointA.x, line.pointA.y, line.pointA.elementId)
            newPointA.pointId = line.pointA.pointId
    
            const newPointB = line.pointB ? ElementManipulator.copyPoint(line.pointB, keepIds) : null
            const newLine = new Line(newPointA, { 
                pointB: newPointB, 
                groupId: line.groupId, 
                id: line.id, 
                midPointId: line.midPoint ? line.midPoint.pointId : null 
            })

            if (assignId) {
                newLine.id = uuidv4()
            }
            
            return newLine
        }
    
        const newLine = createElement('line', line.pointA.x, line.pointA.y, { groupId: line.groupId, assignId })

        if (line.pointB) {
            newLine.setLastAttribute(line.pointB.x, line.pointB.y)
        }

        return newLine
    }

    static copyPolyline(polyline, keepIds = false, assignId = false) {
        const copiedElements = polyline.elements.map(e => ElementManipulator.copyElement(e, { keepIds, assignId: !keepIds }))
        if (keepIds) {
            const newInitialPoint = ElementManipulator.copyPoint(polyline.basePoint, keepIds)
            const newPolyline = new Polyline(newInitialPoint, { id: polyline.id, groupId: polyline.groupId, elements: copiedElements })
            if (assignId) {
                newPolyline.id = uuidv4()
            }

            return newPolyline
        }
        
        const newPolyline = createElement('polyline', polyline.basePoint.x, polyline.basePoint.y, { assignId })
        newPolyline.elements = copiedElements
    
        return newPolyline
    }

    static copyRectangle(rectangle, keepIds = false, assignId = false) {
        const initialPoint = rectangle.elements[0].pointA

        let newRectangle
        if (keepIds) {
            const newInitialPoint = ElementManipulator.copyPoint(initialPoint, keepIds)
            newRectangle = new Rectangle(newInitialPoint, { id: rectangle.id, groupId: rectangle.groupId }) 
        } else {
            newRectangle = createElement('rectangle', initialPoint.x, initialPoint.y, { assignId })
        }

        if (assignId) {
            newRectangle.id = uuidv4()
        }

        newRectangle.elements = rectangle.elements.map(line => ElementManipulator.copyLine(line, keepIds))
        return newRectangle
    } 
    
    static copyArc(arc, keepIds = false, assignId = false) {
        // const newStartLine = arc.startLine ? ElementManipulator.copyLine(arc.startLine, keepIds) : null
        // const newEndLine = arc.endLine ? ElementManipulator.copyLine(arc.endLine, keepIds) : null
        // const newMidLine = arc.midLine ? ElementManipulator.copyLine(arc.midLine, keepIds) : null

        // let newCenterPoint
        // if (keepIds) {
        //     newCenterPoint = new Point(arc.centerPoint.x, arc.centerPoint.y)
        //     newCenterPoint.pointId = arc.centerPoint.pointId
        // } else {
        //     newCenterPoint = createElement('point', arc.centerPoint.x, arc.centerPoint.y)
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
    
        const newArc = createElement('arc', arc.centerPoint.x, arc.centerPoint.y, { 
            groupId: arc.groupId, 
            assignId,
            ...(keepIds && { pointsElementId: arc.id }) 
        })

        if (keepIds && !assignId) {
            newArc.id = arc.id
        }

        newArc.startLine = arc.startLine ? ElementManipulator.copyLine(arc.startLine, keepIds) : null
        newArc.endLine = arc.endLine ? ElementManipulator.copyLine(arc.endLine, keepIds) : null
        newArc.midLine = arc.midLine ? ElementManipulator.copyLine(arc.midLine, keepIds) : null

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

    static copyCircle(circle, keepIds = false, assignId = false) {
        
        const newCircle = createElement('circle', circle.centerPoint.x, circle.centerPoint.y, {
            assignId,
            ...(keepIds && { pointsElementId: circle.id }) 
        })

        newCircle.radius = circle.radius
        const newEndPoints = circle.endPoints 
                                ? circle.endPoints.map(ep => ElementManipulator.copyPoint(ep, keepIds))
                                : null
        newCircle.endPoints = newEndPoints
            
        // const newCircle = new Circle(newCenterPoint, { radius: circle.radius, endPoints: newEndPoints, id: circle.id })
        return newCircle
    }

    static copyPoint(point, keepIds = false) {
        const newPoint = new Point(point.x, point.y)
        if (keepIds) {
            newPoint.pointId = point.pointId
            newPoint.elementId = point.elementId
        }

        return newPoint
    }
}

export default ElementManipulator