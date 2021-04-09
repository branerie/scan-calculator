import { getPointDistance } from '../utils/point'
import { getQuadrant, radiansToDegrees } from '../utils/angle'
import Element from './element'

class Line extends Element {
    #drawingElement

    constructor({ pointA, pointB, groupId, generatorFunc }) {
        super(groupId)
        // TODO: check if both points are the same point
        this.generatorFunc = generatorFunc.bind(this)

        this.pointA = pointA
        this.pointB = pointB || { x: 10, y: 10 }
    }

    get baseX() {
        return this.pointA.x
    }

    get baseY() {
        return this.pointA.y
    }

    get drawingElement() {
        if (!this.isFullyDefined) return null

        if (!this.#drawingElement) {
            this.__setDrawingElement()
        }

        return this.#drawingElement
    }

    get isFullyDefined() {
        return (
            this.pointA && (!!(this.pointA.x) || this.pointA.x === 0) &&
            this.pointA && (!!(this.pointA.y) || this.pointA.y === 0) &&
            this.pointB && (!!(this.pointB.x) || this.pointB.x === 0) &&
            this.pointB && (!!(this.pointB.y) || this.pointB.y === 0)
        )
    }

    get isAlmostDefined() {
        return this.pointA
    }

    get length() {
        return getPointDistance(this.pointA, this.pointB)
    }

    get angle() {
        const deltaX = this.pointB.x - this.pointA.x
        const deltaY = this.pointA.y - this.pointB.y

        const angleInRadians = Math.atan(Math.abs(deltaY) / Math.abs(deltaX))
        const angle = radiansToDegrees(angleInRadians)
        const quadrant = getQuadrant(deltaX, deltaY)

        switch (quadrant) {
            case 0:
                // we have either a vertical or a horizontal line
                if (deltaX === 0) {
                    // line is vertical
                    return deltaY > 0 ? 90 : 270
                }

                // line is horizontal
                return deltaX > 0 ? 0 : 180
            case 1:
                return angle
            case 2:
                return 180 - angle
            case 3:
                return 180 + angle
            case 4:
                return 360 - angle
            default:
                throw new Error()
        }
    }

    isPointOnLine(point) {
        const pointDistA = getPointDistance(this.pointA, point)
        const pointDistB = getPointDistance(this.pointB, point)

        return Math.abs((pointDistA + pointDistB) - this.length) < 1
    }

    setLastAttribute(lastPoint) {
        this.pointB = lastPoint
        this.__setDrawingElement()
    }

    getMovedCopy(dX, dY) {
        const movedLine = new Line({ pointA: this.pointA, pointB: this.pointB })

        movedLine.pointA.x += dX
        movedLine.pointB.x += dX
        movedLine.pointA.y += dY
        movedLine.pointB.y += dY

        return movedLine
    }

    // Should never have to be used for Line element
    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        if (!this.pointA) {
            this.pointA = definingPoint
            return
        }

        this.pointB = definingPoint
    }

    __setDrawingElement() {
        this.#drawingElement = this.generatorFunc()
    }
}

export default Line