import { degreesToRadians, getQuadrant } from '../utils/angle'
import { createPoint } from '../utils/elementFactory'
import { getPointDistance } from '../utils/point'
import Element from './element'
import Line from './line'

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
            (this.startLine && this.startLine.angle >= 0 && this.startLine.angle <= 360)
        )
    }

    getSnappingPoints() {
        // TODO: test method
        return {
            center: [ { ...this.centerPoint, elementId: this.id } ],
            endPoints: [ { ...this.startLine.pointB, elementId: this.id }, { ...this.endLine.pointB, elementId: this.id } ]
        }
    }

    getNearestPoint() {
        // TODO: implement nearest point snap of arc
    }

    setLastAttribute(lastPoint) {
        // TODO: test method
        if (this.centerPoint.y === lastPoint.y) {
            const endPointX = this.centerPoint.x > lastPoint.x 
                                        ? this.centerPoint.x - this.radius
                                        : this.centerPoint.x + this.radius

            this.endLine = new Line(this.centerPoint, createPoint(endPointX, this.centerPoint.y))
            return
        }
        
        if (this.centerPoint.x === lastPoint.x) {
            const endPointY = this.centerPoint.y > lastPoint.y 
                                        ? this.centerPoint.y - this.radius
                                        : this.centerPoint.y + this.radius

            this.endLine = new Line(this.centerPoint, createPoint(this.centerPoint.x, endPointY))
            return
        }

        const line = new Line(this.centerPoint, lastPoint)

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

        this.endLine = new Line(this.centerPoint, endPoint)
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
        this.centerPoint.x += dX
        this.centerPoint.y += dY
    }
}

export default Arc