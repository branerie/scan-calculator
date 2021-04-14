import Arc from '../drawingElements/arc'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'

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
const createLine = (initialPointX, initialPointY, groupId) => 
                        createElement('line', initialPointX, initialPointY, groupId)

export {
    createElement,
    createPoint,
    createLine,
    createEditedElement
}