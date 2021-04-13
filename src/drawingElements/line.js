import { getPointDistance } from '../utils/point'
import { getQuadrant, radiansToDegrees } from '../utils/angle'
import { createPoint, createLine } from '../utils/elementFactory'
import Element from './element'
import Point from './point'

class Line extends Element {
    constructor(pointA, pointB, groupId = null) {
        super(groupId)
        // TODO: check if both points are the same point

        this.pointA = pointA
        this.pointB = pointB
    }

    get basePoint() {
        return this.pointA
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

    checkIfPointOnElement(point) {
        const pointDistA = getPointDistance(this.pointA, point)
        const pointDistB = getPointDistance(this.pointB, point)

        return Math.abs((pointDistA + pointDistB) - this.length) < 0.3
    }

    setLastAttribute(lastPoint) {
        this.pointB = lastPoint
    }

    copy(keepIds = false) {
        if (keepIds) {
            const newPointA = new Point(this.pointA.x, this.pointA.y)
            newPointA.pointId = this.pointA.pointId
            
            const newPointB = new Point(this.pointB.x, this.pointB.y)
            newPointB.pointId = this.pointB.pointId
            const newLine = new Line(newPointA, newPointB, this.groupId)
            newLine.id = this.id
            return newLine
        }
            
        const newLine = createLine(this.pointA.x, this.pointA.y, this.groupId)
        newLine.setLastAttribute(createPoint(this.pointB.x, this.pointB.y))
        return newLine
    }

    getPointById(pointId) {
        if (this.pointA.pointId === pointId) {
            return this.pointA
        }
        
        if (this.pointB.pointId === pointId) {
            return this.pointB
        }
    
        return null
    }

    setPointById(pointId, newPointX, newPointY) {
        const point = this.getPointById(pointId)
        if (!point) {
            return false
        }

        point.x = newPointX
        point.y = newPointY
        return true
    }

    getSnappingPoints() {
        // TODO: test snapping points 
        const midPoint = createPoint((this.pointA.x + this.pointB.x) / 2, (this.pointA.y + this.pointB.y) / 2)

        return {
            endPoints: [ { ...this.pointA, id: this.id }, { ...this.pointB, id: this.id } ],
            midPoint: [ { ...midPoint, id: this.id } ]
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

    getNearestPoint(point) {
        // m = (y2 - y1) / (x2 - x1)
        const slope = (this.pointB.y - this.pointA.y) / (this.pointB.x - this.pointA.x)
        // b = y - m * x
        const lineIntercept = this.pointA.y - slope * this.pointA.x

        // find perpendicular intercept from input point
        const perpendicularIntercept = point.y + slope * point.x

        const intersectX = (perpendicularIntercept - lineIntercept) / (2 * slope)
        const intersectY = slope * intersectX + lineIntercept

        return { elementId: this.id, nearestPoint: createPoint(intersectX, intersectY) }
    }
}

export default Line