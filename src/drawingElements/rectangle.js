import { createLine } from '../utils/elementFactory'
import Polyline from './polyline'

class Rectangle extends Polyline {
    constructor(pointA, pointB, groupId = null) {
        super(pointA, groupId)

        if (pointB) {
            this.elements = [
                createLine(pointA.x, pointA.y, groupId, pointB.x, pointA.y),
                createLine(pointB.x, pointA.y, groupId, pointB.x, pointB.y),
                createLine(pointB.x, pointB.y, groupId, pointA.x, pointB.y),
                createLine(pointA.x, pointB.y, groupId, pointA.x, pointA.y)
            ]
        }
    }

    get isFullyDefined() {
        return !!(this.elements[0]) && !!(this.elements[1])
    }

    get isAlmostDefined() {
        return this.elements[0].isAlmostDefined
    }

    setLastAttribute(pointX, pointY) {
        const firstLine = this.elements[0]
        firstLine.setLastAttribute(pointX, firstLine.pointA.y)
        this.elements = [
            firstLine,
            createLine(pointX, firstLine.pointA.y, this.groupId, pointX, pointY),
            createLine(pointX, pointY, this.groupId, firstLine.pointA.x, pointY),
            createLine(firstLine.pointA.x, pointY, this.groupId, firstLine.pointA.x, firstLine.pointA.y)
        ]
    }
}

export default Rectangle