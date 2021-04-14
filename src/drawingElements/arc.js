import { degreesToRadians, getQuadrant } from '../utils/angle'
import { SELECT_DELTA } from '../utils/constants'
import { createPoint } from '../utils/elementFactory'
import { getPointDistance } from '../utils/point'
import Element from './element'
import Line from './line'
import Point from './point'

class Arc extends Element {
    constructor(centerPoint, groupId = null) {
        super(groupId)

        this.centerPoint = centerPoint
        this.startLine = null
        this.endLine = null
    }

    get basePoint() {
        return this.centerPoint
    }

    get isFullyDefined() {
        return (
            this.centerPoint &&
            this.radius > 0 &&
            (!!(this.startLine) && this.startLine.angle >= 0 && this.startLine.angle <= 360) &&
            (!!(this.endLine) && this.endLine.angle >= 0 && this.endLine.angle <= 360)
        )
    }

    get isAlmostDefined() {
        return (
            this.centerPoint &&
            this.radius > 0 &&
            (!!(this.startLine) && this.startLine.angle >= 0 && this.startLine.angle <= 360)
        )
    }

    getSnappingPoints() {
        // TODO: test method
        return {
            center: [ { ...this.centerPoint, elementId: this.id } ],
            endPoints: [ { ...this.startLine.pointB, elementId: this.id }, { ...this.endLine.pointB, elementId: this.id } ]
        }
    }

    checkIfPointOnElement(point) {
        const distanceFromCenter = getPointDistance(this.centerPoint, point)
        if (Math.abs(this.radius - distanceFromCenter) > SELECT_DELTA) {
            return false
        }

        const lineFromCenter = new Line(this.centerPoint, point)
        const lineAngle = lineFromCenter.angle
        const startAngle = this.startLine.angle
        const endAngle = this.endLine.angle
        const isInArc = startAngle < endAngle 
                        ? lineAngle >= startAngle || lineAngle <= endAngle
                        : lineAngle <= startAngle && lineAngle >= endAngle

        if (isInArc) {
            return true
        }

        return false
    }

    getNearestPoint() {
        // TODO: implement nearest point snap of arc
    }

    setLastAttribute(pointX, pointY) {
        this.endLine = this.__getNewArcLineFromPoint(pointX, pointY)
    }

    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        if (!this.centerPoint) {
            this.centerPoint = definingPoint
            return
        }

        if (!this.radius) {
            this.radius = getPointDistance(this.centerPoint, definingPoint)

            const line = new Line(this.centerPoint, definingPoint)
            this.startLine = line

            return
        }
    }

    move(dX, dY) {
        // TODO: startLine and endLine not moved
        this.centerPoint.x += dX
        this.centerPoint.y += dY
    }

    getPointById(pointId) {
        if (this.centerPoint.pointId === pointId) {
            return this.centerPoint
        }
        
        if (this.startLine.pointB.pointId === pointId) {
            return this.startLine.pointB
        }

        if (this.endLine.pointB.pointId === pointId) {
            return this.endLine.pointB
        }
    
        return null
    }

    setPointById(pointId, newPointX, newPointY) {
        if (pointId === this.startLine.pointB.pointId) {
            this.startLine = this.__getNewArcLineFromPoint(newPointX, newPointY)
            this.startLine.pointB.pointId = pointId
            return true
        }

        this.endLine = this.__getNewArcLineFromPoint(newPointX, newPointY)
        this.endLine.pointB.pointId = pointId

        return true
    }

    __getNewArcLineFromPoint(pointX, pointY) {
        if (this.centerPoint.y === pointY) {
            const endPointX = this.centerPoint.x > pointX 
                                        ? this.centerPoint.x - this.radius
                                        : this.centerPoint.x + this.radius

            return new Line(this.centerPoint, createPoint(endPointX, this.centerPoint.y))
        }
        
        if (this.centerPoint.x === pointX) {
            const endPointY = this.centerPoint.y > pointY
                                        ? this.centerPoint.y - this.radius
                                        : this.centerPoint.y + this.radius

            return new Line(this.centerPoint, createPoint(this.centerPoint.x, endPointY))
        }

        const line = new Line(this.centerPoint, new Point(pointX, pointY))

        const quadrant = getQuadrant(line.angle)

        let endAngle,
            dXMultiplier,
            dYMultiplier
        switch(quadrant) {
            case 1:
                endAngle = line.angle
                dXMultiplier = 1
                dXMultiplier = 1
                break
            case 2:
                endAngle = 180 - line.angle
                dXMultiplier = -1
                dXMultiplier = 1
                break
            case 3:
                endAngle = line.angle - 180
                dXMultiplier = -1
                dYMultiplier = -1
                break
            case 4:
                endAngle = 360 - line.angle
                dXMultiplier = 1
                dYMultiplier = -1
                break
            default:
                throw new Error(`Invalid angle quadrant: ${quadrant}`)
        }

        const endAngleRadians = degreesToRadians(endAngle)
        const dX = Math.cos(endAngleRadians) * this.radius * dXMultiplier
        const dY = Math.sin(endAngleRadians) * this.radius * dYMultiplier

        const endPoint = createPoint(this.centerPoint.x + dX, this.centerPoint.y + dY)

        return new Line(this.centerPoint, endPoint)
    } 
}

export default Arc