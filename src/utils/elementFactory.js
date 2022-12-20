import { v4 as uuidv4 } from 'uuid'
import Arc from '../drawingElements/arc'
import Circle from '../drawingElements/circle'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'
import Rectangle from '../drawingElements/rectangle'

const createElement = (
    type, 
    initialPoint,
    { groupId = null, assignId = false, pointsElementId = null } = {}
) => {
    if ((!initialPoint.x && initialPoint.x !== 0) || (!initialPoint.y && initialPoint.y !== 0)) {
        throw new Error('Cannot create element with undefined initial point coordinates.')
    }

    if (assignId) {
        const newElementId = uuidv4()

        initialPoint.elementId = pointsElementId || newElementId
        const createdElement = createElementFromInitialPoint(type, initialPoint, groupId)
        createdElement.id = newElementId

        return createdElement
    }
    
    if (pointsElementId) {
        initialPoint.elementId = pointsElementId
    }
    
    return createElementFromInitialPoint(type, initialPoint, groupId)
}

const createEditedElement = (element, payload) => {
    const newElement = createElementFromInitialPoint(
        element.constructor.name.toLowerCase(),
        element.basePoint
    )

    for (const [key, value] of Object.entries(element)) {
        newElement[key] = value
    }

    if (payload) {
        switch (payload.action) {
            case 'move':
                const { dX, dY } = payload
                newElement.move(dX, dY)
                break
            default:
                break
        }
    }

    return newElement
}

const createPoint = (pointX, pointY, { elementId = null, assignId = true } = {}) => {
    const point = new Point(pointX, pointY, elementId)
    if (assignId) {
        point.pointId = uuidv4()
    }

    return point
}

const createLine = (
    initialPointX, 
    initialPointY, 
    lastPointX, 
    lastPointY, 
    { groupId = null, assignId = false, pointsElementId = null } = {}
) => {
    const line = createElement(
        'line', 
        { x: initialPointX, y: initialPointY },
        { groupId, assignId, pointsElementId }
    )

    if ((lastPointX || lastPointX === 0) && (lastPointY || lastPointY === 0)) {
        line.setPointB(lastPointX, lastPointY)
    }

    return line
}

const createArc = (centerPoint, startPoint, endPoint) => {
    return new Arc(centerPoint, {
        startLine: new Line(centerPoint, { pointB: startPoint }),
        endLine: new Line(centerPoint, { pointB: endPoint })
    })
}

function createElementFromInitialPoint(type, initialPoint, groupId = null) {
    if (type === 'point') {
        return initialPoint
    } else if (type === 'line') {
        return new Line(initialPoint, { groupId })
    } else if (type === 'arc') {
        return new Arc(initialPoint, { groupId })
    } else if (type === 'polyline') {
        return new Polyline(initialPoint, { groupId })
    } else if (type === 'circle') {
        return new Circle(initialPoint)
    } else if (type === 'rectangle') {
        return new Rectangle(initialPoint, { groupId })
    }
}

export {
    createElement,
    createPoint,
    createLine,
    createArc,
    createEditedElement
}