import Arc from '../drawingElements/arc'
import Circle from '../drawingElements/circle'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'
import Rectangle from '../drawingElements/rectangle'

let nextPointId = 0

// let nextId = 0
const createElement = (type, initialX, initialY, groupId = null) => {
    const initialPoint = new Point(initialX, initialY)
    initialPoint.pointId = nextPointId++

    let element
    if (type === 'point') {
        element = initialPoint
    } else if (type === 'line') {
        element = new Line(initialPoint, null, groupId)
    } else if (type === 'arc') {
        element = new Arc(initialPoint, groupId)
    } else if (type === 'polyline') {
        element = new Polyline(initialPoint, groupId)
    } else if (type === 'circle') {
        element = new Circle(initialPoint)
    } else if (type === 'rectangle') {
        element = new Rectangle(initialPoint, null, groupId)
    }

    // element.id = nextId
    // if (groupId) {
    //     element.groupId = groupId
    // }

    // nextId++
    return element
}

const createEditedElement = (element, payload) => {
    const newElement = createElement(
        element.constructor.name.toLowerCase(),
        element.basePoint.x,
        element.basePoint.y
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

const createPoint = (pointX, pointY) => createElement('point', pointX, pointY)
const createLine = (initialPointX, initialPointY, groupId, lastPointX, lastPointY) => {
    const line = createElement('line', initialPointX, initialPointY, groupId)

    if ((lastPointX || lastPointX === 0) && (lastPointY || lastPointY === 0)) {
        line.pointB = createPoint(lastPointX, lastPointY)
    }

    return line
}

export {
    createElement,
    createPoint,
    createLine,
    createEditedElement
}