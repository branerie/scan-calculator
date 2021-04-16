import { SELECT_DELTA } from '../utils/constants'
import { createLine, createPoint } from '../utils/elementFactory'
import { getPointDistance } from '../utils/point'
import Element from './element'
import Line from './line'

class Arc extends Element {
    constructor(centerPoint, groupId = null) {
        super(groupId)

        this.centerPoint = centerPoint
        this.startLine = null
        this.endLine = null
        this.midLine = null
    }

    get basePoint() {
        return this.centerPoint
    }

    get startPoint() {
        return this.startLine.pointB
    }

    get endPoint() {
        return this.endLine.pointB
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
        return [
            { ...this.centerPoint, pointType: 'center' },
            { ...this.startLine.pointB, pointType: 'endPoint' },
            { ...this.endLine.pointB, pointType: 'endPoint' },
            { ...this.midLine.pointB, pointType: 'midPoint' }
        ]
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
        this.endLine = createLine(this.centerPoint.x, this.centerPoint.y, this.groupId, pointX, pointY)
        this.endLine.setLength(this.radius, false)
        this.__updateMidLine()
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

        if (this.midLine.pointB.pointId === pointId) {
            return this.midLine.pointB
        }

        return null
    }

    setPointById(pointId, newPointX, newPointY) {
        let lineToChange
        if (pointId === this.startLine.pointB.pointId) {
            lineToChange = this.startLine
        }

        if (pointId === this.endLine.pointB.pointId) {
            lineToChange = this.endLine
        }

        if (!lineToChange) return false

        lineToChange.pointB.x = newPointX
        lineToChange.pointB.y = newPointY
        lineToChange.setLength(this.radius, false)
        this.__updateMidLine()
        return true
    }

    move(dX, dY) {
        this.centerPoint.x += dX
        this.centerPoint.y += dY

        this.startLine.move(dX, dY)
        this.endLine.move(dX, dY)
        this.midLine.move(dX, dY)
    }

    setRadius(newRadius) {
        this.startLine.setLength(newRadius, false)
        this.endLine.setLength(newRadius, false)
        this.midLine.setLength(newRadius,false)
        this.radius = newRadius
    }

    __updateMidLine() {
        if (!this.midLine) {
            this.midLine = createLine(this.centerPoint.x, this.centerPoint.y, this.groupId)
        }

        const point = createPoint(
            (this.startLine.pointB.x + this.endLine.pointB.x) / 2,
            (this.startLine.pointB.y + this.endLine.pointB.y) / 2
        )

        if (this.midLine.pointB) {
            point.pointId = this.midLine.pointB.pointId
        }

        this.midLine.pointB = point

        const isStartLessThanEnd = this.startLine.angle < this.endLine.angle
        const isBetweenLessThan180 = Math.abs(this.startLine.angle - this.endLine.angle) < 180

        const newLength = isStartLessThanEnd !== isBetweenLessThan180
            ? this.radius
            : -this.radius

        this.midLine.setLength(newLength, false)
    }
}

export default Arc