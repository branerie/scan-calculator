import Arc from '../drawingElements/arc'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'

const createLine = (startPoint, endPoint) => {

}  

let nextId = 0
const createElement = (type, elementProps, groupId = null) => {
    let element
    if (type === 'line') {
        const { pointA, pointB } = elementProps
        element = new Line(pointA, pointB)
    } else if (type === 'arc') {
        const { centerX, centerY, radius, startAngle, endAngle } = elementProps
        element = new Arc(new Point(centerX, centerY), radius, startAngle, endAngle)
    }

    element.id = nextId
    if (groupId) {
        element.groupId = groupId
    }

    nextId++
}

const createEditedElement = (element, payload) => {
    const newElement = createElement(element.constructor.name.toLowerCase(), element)
    newElement.id = element.id
    newElement.groupId = element.groupId

    switch (payload.action) {
        case 'move':
            const { dX, dY } = payload
            newElement.move(dX, dY)
            break
        default:
            break
    }

    return newElement
}

export {
    createElement,
    createEditedElement
}