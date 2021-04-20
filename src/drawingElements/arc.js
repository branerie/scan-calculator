import { createLine } from '../utils/elementFactory'
import { getPointDistance } from '../utils/point'
import Element from './element'
import Line from './line'

class Arc extends Element {
    #centerPoint
    #radius
    #startLine
    #endLine
    #midLine

    constructor(centerPoint, { 
        radius = null, 
        groupId = null, 
        startLine = null, 
        endLine = null,
        midLine = null, 
        id = null 
    }) {
        super(id, groupId)

        this.#centerPoint = centerPoint
        this.#radius = radius
        this.#startLine = startLine
        this.#endLine = endLine
        this.#midLine = midLine
    }

    get basePoint() { return this.#centerPoint }
    get centerPoint() { return { ...this.#centerPoint } }
    get radius() { return this.#radius }
    get startPoint() { return { ...this.#startLine.pointB } }
    get endPoint() { return { ...this.#endLine.pointB } }

    get startLine() { return this.#startLine }
    get endLine() { return this.#endLine }
    get midLine() { return this.#midLine }

    set radius(value) {
        this.#radius = value
        this.#startLine.setLength(value, false)
        this.#endLine.setLength(value, false)
        this.#midLine.setLength(value, false)
    }

    get isFullyDefined() {
        return (
            this.#centerPoint &&
            this.#radius > 0 &&
            (!!(this.#startLine) && this.#startLine.angle >= 0 && this.#startLine.angle <= 360) &&
            (!!(this.#endLine) && this.#endLine.angle >= 0 && this.#endLine.angle <= 360)
        )
    }

    get isAlmostDefined() {
        return (
            this.#centerPoint &&
            this.#radius > 0 &&
            (!!(this.#startLine) && this.#startLine.angle >= 0 && this.#startLine.angle <= 360)
        )
    }

    getSnappingPoints() {
        return [
            { ...this.#centerPoint, pointType: 'center' },
            { ...this.#startLine.pointB, pointType: 'endPoint' },
            { ...this.#endLine.pointB, pointType: 'endPoint' },
            { ...this.#midLine.pointB, pointType: 'midPoint' }
        ]
    }

    checkIfPointOnElement(point, maxDiff) {
        const distanceFromCenter = getPointDistance(this.#centerPoint, point)
        if (Math.abs(this.#radius - distanceFromCenter) > maxDiff) {
            return false
        }

        const lineFromCenter = new Line(this.#centerPoint, { pointB: point })
        const lineAngle = lineFromCenter.angle
        const startAngle = this.#startLine.angle
        const endAngle = this.#endLine.angle
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
        this.#endLine = createLine(this.#centerPoint.x, this.#centerPoint.y, this.groupId, pointX, pointY)
        this.#endLine.setLength(this.#radius, false)
        this.__updateMidLine()
    }

    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        if (!this.#centerPoint) {
            this.#centerPoint = definingPoint
            return
        }

        if (!this.#radius) {
            this.#radius = getPointDistance(this.#centerPoint, definingPoint)

            const line = new Line(this.#centerPoint, { pointB: definingPoint })
            this.#startLine = line

            return
        }
    }

    getPointById(pointId) {
        if (this.#centerPoint.pointId === pointId) {
            return this.#centerPoint
        }

        if (this.#startLine.pointB.pointId === pointId) {
            return this.#startLine.pointB
        }

        if (this.#endLine.pointB.pointId === pointId) {
            return this.#endLine.pointB
        }

        if (this.#midLine.pointB.pointId === pointId) {
            return this.#midLine.pointB
        }

        return null
    }

    setPointById(pointId, newPointX, newPointY) {
        let lineToChange
        if (pointId === this.#startLine.pointB.pointId) {
            lineToChange = this.#startLine
        }

        if (pointId === this.#endLine.pointB.pointId) {
            lineToChange = this.#endLine
        }

        if (!lineToChange) return false

        lineToChange.setPointB(newPointX, newPointY)
        lineToChange.setLength(this.radius, false)

        if (this.isFullyDefined) {
            this.__updateMidLine()
        }

        return true
    }

    setLineId(lineName, lineId) {
        switch(lineName) {
            case 'startLine':
                this.#startLine.id = lineId
                break
            case 'endLine':
                this.#startLine.id = lineId
                break
            case 'midLine':
                this.#startLine.id = lineId
                break
            default:
                return
        }
    }

    move(dX, dY) {
        this.#centerPoint.x += dX
        this.#centerPoint.y += dY

        this.#startLine.move(dX, dY)
        this.#endLine.move(dX, dY)
        this.#midLine.move(dX, dY)
    }

    __updateMidLine() {
        if (!this.#midLine) {
            this.#midLine = createLine(this.#centerPoint.x, this.#centerPoint.y, this.groupId)
        }

        const midPointX = (this.#startLine.pointB.x + this.#endLine.pointB.x) / 2
        const midPointY = (this.#startLine.pointB.y + this.#endLine.pointB.y) / 2
        this.#midLine.setPointB(midPointX, midPointY)

        const isStartLessThanEnd = this.#startLine.angle < this.#endLine.angle
        const isBetweenLessThan180 = Math.abs(this.#startLine.angle - this.#endLine.angle) < 180

        const newLength = isStartLessThanEnd !== isBetweenLessThan180
            ? this.#radius
            : -this.#radius

        this.#midLine.setLength(newLength, false)
    }
}

export default Arc