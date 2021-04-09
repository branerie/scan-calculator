import rough from 'roughjs/bundled/rough.esm'

import Arc from '../drawingElements/arc'
import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import { degreesToRadians } from './angle'


const generator = rough.generator()

const getGeneratorFunc = (elementType) => {
    switch (elementType) {
        case 'line':
            return function() {
                return (
                    generator.line(
                        [
                            this.pointA.x, 
                            this.pointA.y, 
                            this.pointB.x, 
                            this.pointB.y
                        ], 
                        { roughness: 0.5 }
                    )
                )
            }
                
        case 'arc':
            // roughElements.push(generator.path(foundationalElements))
            return () => generator.arc([
                this.centerPoint.x,
                this.centerPoint.y,
                this.radius,
                this.radius,
                degreesToRadians(this.startAngle),
                degreesToRadians(this.endAngle),
                false
            ], { roughness: 0.5 })
        default:
            return null
    }
}

// let nextId = 0
const createElement = (type, initialX, initialY, groupId = null) => {
    const generatorFunc = getGeneratorFunc(type)

    let element
    if (type === 'line') {
        const pointA = new Point(initialX, initialY)
        // const pointB = new Point(initialX, initialY)

        element = new Line({ pointA, generatorFunc })
    } else if (type === 'arc') {
        const centerPoint = new Point(initialX, initialY)

        element = new Arc(centerPoint)
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

export {
    createElement,
    createEditedElement
}