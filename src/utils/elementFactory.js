import rough from 'roughjs/bundled/rough.esm'

import Arc from '../drawingElements/arc'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'


const generator = rough.generator()

// let nextId = 0
const createElement = (type, initialX, initialY, groupId = null) => {
    let element
    if (type === 'line') {
        const pointA = new Point(initialX, initialY)
        // const pointB = new Point(initialX, initialY)

        element = new Line(pointA)
    } else if (type === 'arc') {
        const centerPoint = new Point(initialX, initialY)

        element = new Arc(centerPoint)
    } else if (type === 'polyline') {
        const initialPoint = new Point(initialX, initialY)

        element = new Polyline(
            initialPoint, 
            groupId, 
            (secondPointX, secondPointY, groupId) => createElement('line', secondPointX, secondPointY, groupId)
        )
    }

    // element.id = nextId
    // if (groupId) {
    //     element.groupId = groupId
    // }

    // nextId++
    return element
}

const createEditedElement = (element, payload, keepIds = true) => {
    const newElement = createElement(element.constructor.name.toLowerCase(), element.baseX, element.baseY)
    for (const [key, value] of Object.entries(element)) {
        newElement[key] = value
    }

    // if (keepIds) {
    //     newElement.id = element.id
    //     newElement.groupId = element.groupId
    // } else {
    //     newElement.id = nextId
    //     nextId++
    // }

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

const getRoughElements = (elements) => {
    const roughElements = []
    for (const element of elements) {
        const foundationalElements = element.getFoundationalElements()
        switch (element.type) {
            case 'line':
                roughElements.push(generator.line(...foundationalElements, { roughness: 0 }))
                break
            case 'arc':
                // roughElements.push(generator.path(foundationalElements))
                roughElements.push(generator.arc(...foundationalElements))
                break
            case 'polyline':
                foundationalElements.forEach(fe => roughElements.push(generator.line(...fe, { roughness: 0 })))
                break
            default:
                break
        }
    }

    return roughElements
}

export {
    createElement,
    createEditedElement,
    getRoughElements
}