import { v4 as uuidv4 } from 'uuid'
import Arc from '../drawingElements/arc'
import Circle from '../drawingElements/circle'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'
import Rectangle from '../drawingElements/rectangle'

const createElement = (type, initialX, initialY, groupId = null) => {
    if ((!initialX && initialX !== 0) || (!initialY && initialY !== 0)) {
        throw new Error('Cannot create element with undefined initial point coordinates.')
    }

    const initialPoint = new Point(initialX, initialY)
    initialPoint.pointId = uuidv4()

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

const createPoint = (pointX, pointY) => createElement('point', pointX, pointY)
const createLine = (initialPointX, initialPointY, lastPointX, lastPointY, groupId = null) => {
    const line = createElement('line', initialPointX, initialPointY, groupId)

    if ((lastPointX || lastPointX === 0) && (lastPointY || lastPointY === 0)) {
        line.setPointB(lastPointX, lastPointY)
    }

    return line
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
    createEditedElement
}