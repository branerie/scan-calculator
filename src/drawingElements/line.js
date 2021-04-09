import { getPointDistance } from '../utils/point'
import { getQuadrant, radiansToDegrees } from '../utils/angle'
import Element from './element'
import Point from './point'

class Line extends Element {
    constructor(pointA, pointB, groupId = null) {
        super(groupId)
        // TODO: check if both points are the same point

        this.pointA = pointA
        this.pointB = pointB
    }

    get baseX() {
        return this.pointA.x
    }

    get baseY() {
        return this.pointA.y
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
        return (!!this.pointA)
    }

    checkIfPointOnElement(point) {
        const pointDistA = getPointDistance(this.pointA, point)
        const pointDistB = getPointDistance(this.pointB, point)

        return Math.abs((pointDistA + pointDistB) - this.length) < 1
    }

    setLastAttribute(lastPoint) {
        this.pointB = lastPoint
    }

    getSnappingPoints() {
        // TODO: test snapping points 
        return {
            edges: [ this.pointA, this.pointB ],
            midPoints: [ (this.pointA.x + this.pointB.x) / 2, (this.pointA.y + this.pointB.y) / 2 ],
            nearestPoint(point) {
                // m = (y2 - y1) / (x2 - x1)
                const slope = (this.pointB.y - this.pointA.y) / (this.pointB.x - this.pointA.x)
                // b = y - m * x
                const lineIntercept = this.pointA.y - slope * this.pointA.x

                // find perpendicular intercept from input point
                const perpendicularIntercept = point.y + slope * point.x

                const intersectX = (perpendicularIntercept - lineIntercept) / (2 * slope)
                const intersectY = slope * intersectX + lineIntercept

                return new Point(intersectX, intersectY)
            }
        }
    }
    
    getFoundationalElements() {
        return [this.pointA.x, this.pointA.y, this.pointB.x, this.pointB.y]
    }

    // Should never have to be used for Line element
    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        if (!this.pointA) {
            this.pointA = definingPoint
            return
        }

        this.pointB = definingPoint
        this.pointB.finalizePosition()
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
}

export default Line