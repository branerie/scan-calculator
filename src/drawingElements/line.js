import { getPointDistance } from '../utils' 
import { getQuadrant } from '../utils/angle'
import Element from './element'

class Line extends Element {
    constructor(pointA, pointB, groupId = null) {
        super(groupId)
        // TODO: check if both points are the same point

        this.pointA = pointA
        this.pointB = pointB
    }

    isPointOnLine(point) {
        const pointDistA = getPointDistance(this.pointA, point)
        const pointDistB = getPointDistance(this.pointB, point)

        return Math.abs((pointDistA + pointDistB) - this.length) < 1
    }

    getMovedCopy(dX, dY) {
        const movedLine = new Line(this.pointA, this.pointB)

        movedLine.pointA.x += dX
        movedLine.pointB.x += dX
        movedLine.pointA.y += dY
        movedLine.pointB.y += dY

        return movedLine
    }

    getFoundationalElements() {
       return [this.pointA.x, this.pointA.y, this.pointB.x, this.pointB.y] 
    }
    
    get length() {
        return getPointDistance(this.pointA, this.pointB)
    }

    get angle() {
        const deltaX = this.pointB.x - this.pointA.x
        const deltaY = this.pointB.y - this.pointA.y

        const angle = Math.atan(Math.abs(deltaY) / Math.abs(deltaX))
        const quadrant = getQuadrant(deltaX, deltaY)

        switch(quadrant) {
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
}

export default Line