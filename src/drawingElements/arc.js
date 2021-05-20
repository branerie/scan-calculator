import { MAX_NUM_ERROR } from '../utils/constants'
import { createLine } from '../utils/elementFactory'
import { getPointDistance, getRotatedPointAroundPivot } from '../utils/point'
import Element from './element'
import Line from './line'

const INCONSISTENT_ARC_ERROR = 'Inconsistent arc - the end of startLine and the end of endLine must lie the same distance from the arc center (its radius)'

class Arc extends Element {
    #centerPoint
    #radius
    #startLine
    #endLine
    #midLine
    #boundingBox

    constructor(centerPoint, { 
        radius = null, 
        groupId = null, 
        startLine = null, 
        endLine = null,
        midLine = null, 
        id = null 
    } = {}) {
        super(id, groupId)

        this.#centerPoint = centerPoint
        this.#radius = radius
        this.#startLine = startLine
        this.#endLine = endLine
        this.#midLine = midLine

        if (startLine) {
            if (getPointDistance(centerPoint, startLine.pointA) > 0) {
                this.#startLine.setPointA(this.#centerPoint)
            }

            if (!this.#radius) {
                this.#radius = getPointDistance(centerPoint, startLine.pointB)
            }

            if (Math.abs(getPointDistance(centerPoint, startLine.pointB) - this.#radius) > MAX_NUM_ERROR) {
                throw new Error(INCONSISTENT_ARC_ERROR)
            }
        }

        if (endLine) {
            if (getPointDistance(centerPoint, endLine.pointA) > 0) {
                this.#endLine.setPointA(this.#centerPoint)
            }

            if (!this.#radius) {
                this.#radius = getPointDistance(centerPoint, endLine.pointB)
            }

            if (Math.abs(getPointDistance(centerPoint, endLine.pointB) - this.#radius) > MAX_NUM_ERROR) {
                throw new Error(INCONSISTENT_ARC_ERROR)
            }
        }

        if (startLine && endLine) {
            this.__updateDetails()
        }
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

        this.__updateBoundingBox()
    }

    get isFullyDefined() {
        return (
            !!(this.#centerPoint) &&
            this.#radius > 0 &&
            !!(this.#startLine) &&
            !!(this.#endLine)
        )
    }

    get isAlmostDefined() {
        return (
            this.#centerPoint &&
            this.#radius > 0 &&
            (!!(this.#startLine) && this.#startLine.angle >= 0 && this.#startLine.angle <= 360)
        )
    }

    getSelectionPoints() {
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
            ? lineAngle <= startAngle || lineAngle >= endAngle
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
        this.#endLine = createLine(this.#centerPoint.x, this.#centerPoint.y, pointX, pointY, this.groupId)
        this.#endLine.setLength(this.#radius, false)
        this.__updateDetails()
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
        if (pointId === this.#centerPoint.pointId) {
            this.#centerPoint.x = newPointX
            this.#centerPoint.y = newPointY

            this.#startLine.setPointA(newPointX, newPointY)
            this.#endLine.setPointA(newPointX, newPointY)
            this.#midLine.setPointA(newPointX, newPointY)

            return true
        }

        let lineToChange
        if (pointId === this.#startLine.pointB.pointId) {
            lineToChange = this.#startLine
        } else if (pointId === this.#endLine.pointB.pointId) {
            lineToChange = this.#endLine
        }

        if (!lineToChange) return false

        lineToChange.setPointB(newPointX, newPointY)
        lineToChange.setLength(this.#radius, false)

        if (this.isFullyDefined) {
            this.__updateDetails()
        }

        return true
    }

    getBoundingBox() { return this.#boundingBox }

    move(dX, dY) {
        this.#centerPoint.x += dX
        this.#centerPoint.y += dY

        this.#startLine.move(dX, dY)
        this.#endLine.move(dX, dY)
        this.#midLine.move(dX, dY)

        this.#boundingBox.left += dX
        this.#boundingBox.right += dX
        this.#boundingBox.top += dY
        this.#boundingBox.bottom += dY
    }

    __updateDetails() {
        this.__updateMidLine()
        this.__updateBoundingBox()
    }

    __updateBoundingBox() {
        const left = this.__isAngleInArc(180) 
                        ? this.#centerPoint.x - this.#radius 
                        : Math.min(this.#startLine.pointB.x, this.#endLine.pointB.x)
        const right = this.__isAngleInArc(0) 
                        ? this.#centerPoint.x + this.#radius  
                        : Math.max(this.#startLine.pointB.x, this.#endLine.pointB.x)
        const top = this.__isAngleInArc(270) 
                        ? this.#centerPoint.y - this.#radius 
                        : Math.min(this.#startLine.pointB.y, this.#endLine.pointB.y)
        const bottom = this.__isAngleInArc(90) 
                        ? this.centerPoint.y + this.#radius 
                        : Math.max(this.#startLine.pointB.y, this.#endLine.pointB.y)
    
        this.#boundingBox = { left, right, top, bottom }
    }

    __updateMidLine() {
        if (!this.#midLine) {
            this.#midLine = createLine(this.#centerPoint.x, this.#centerPoint.y, null, null, this.groupId)
        }

        const angleStartToEnd = Math.abs(this.#startLine.angle - this.#endLine.angle)

        if (Math.abs(angleStartToEnd - 180) <= MAX_NUM_ERROR) {
            const midLineEndPoint = getRotatedPointAroundPivot(this.#startLine.pointB, this.#centerPoint, 90)
            this.#midLine.setPointB(midLineEndPoint.x, midLineEndPoint.y)
            return
        }

        const midPointX = (this.#startLine.pointB.x + this.#endLine.pointB.x) / 2
        const midPointY = (this.#startLine.pointB.y + this.#endLine.pointB.y) / 2
        this.#midLine.setPointB(midPointX, midPointY)

        const isStartLessThanEnd = this.#startLine.angle < this.#endLine.angle
        const isLessThan180 = angleStartToEnd < 180

        const newLength = isStartLessThanEnd !== isLessThan180
            ? this.#radius
            : -this.#radius

        this.#midLine.setLength(newLength, false)
    }

    __isAngleInArc(angle) {
        const startAngle = this.#startLine.angle
        const endAngle = this.#endLine.angle

        if (startAngle > endAngle) {
            return angle <= startAngle && angle >= endAngle
        }

        return angle <= startAngle || angle >= endAngle
    }
}

export default Arc