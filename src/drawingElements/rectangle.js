import { createLine } from '../utils/elementFactory'
import Polyline from './polyline'

class Rectangle extends Polyline {
    constructor(pointA, { pointB = null, id = null, groupId = null } = {}) {
        super(pointA, { id, groupId })

        if (pointB) {
            this.elements = [
                createLine(pointA.x, pointA.y, pointB.x, pointA.y, { groupId }),
                createLine(pointB.x, pointA.y, pointB.x, pointB.y, { groupId }),
                createLine(pointB.x, pointB.y, pointA.x, pointB.y, { groupId }),
                createLine(pointA.x, pointB.y, pointA.x, pointA.y, { groupId })
            ]

            this.joinEnds()
        }
    }

    get isFullyDefined() {
        return !!(this.elements[0]) && !!(this.elements[1])
    }

    get isAlmostDefined() {
        return this.elements[0].isAlmostDefined
    }

    setLastAttribute(pointX, pointY) {
        if (this.elements.length === 0) {
            throw new Error('Cannot setLastAttribute without initial base point')
        }

        const firstLine = this.elements[0]
        firstLine.setLastAttribute(pointX, firstLine.pointA.y)
        
        if (this.elements.length === 4) {
            const firstLine = this.elements[0]
            this.elements[1].setPointA(pointX, firstLine.pointA.y)
            this.elements[1].setPointB(pointX, pointY)

            this.elements[2].setPointA(pointX, pointY)
            this.elements[2].setPointB(firstLine.pointA.x, pointY)

            this.elements[2].setPointA(pointX, pointY)
            this.elements[2].setPointB(firstLine.pointA.x, pointY)

            this.elements[3].setPointA(firstLine.pointA.x, pointY)
            this.elements[3].setPointB(firstLine.pointA.x, firstLine.pointA.y)
            
            this._updateBoundingBox()
            this.joinEnds()

            return
        }

        this.elements = [
            firstLine,
            createLine(pointX, firstLine.pointA.y, pointX, pointY, { groupId: this.groupId }),
            createLine(pointX, pointY, firstLine.pointA.x, pointY, { groupId: this.groupId }),
            createLine(firstLine.pointA.x, pointY, firstLine.pointA.x, firstLine.pointA.y, { groupId: this.groupId })
        ]

        this._updateBoundingBox()
        this.joinEnds()
    }
}

export default Rectangle