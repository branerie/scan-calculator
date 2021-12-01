import { MAX_NUM_ERROR } from '../utils/constants'
import { createLine } from '../utils/elementFactory'
import ElementManipulator from '../utils/elementManipulator'
import { getPointDistance, getRotatedPointAroundPivot, pointsMatch } from '../utils/point'
import BaseArc from './baseArc'
import Line from './line'

const INCONSISTENT_ARC_ERROR =
    'Inconsistent arc - the end of startLine and the end of endLine must lie the same distance from the arc center (its radius)'
const INCONSISTENT_LINE_ERROR =
    'Inconsistent inner line of arc - either line length does not equal arc radius or its startPoint does not coincide with arc center'

class Arc extends BaseArc {
    #startLine
    #endLine
    #midLine
    #boundingBox
    #isJoined

    constructor(
        centerPoint,
        { radius = null, groupId = null, startLine = null, endLine = null, midLine = null, id = null } = {}
    ) {
        super(centerPoint, { id, groupId, radius })

        this.#startLine = startLine
        this.#endLine = endLine
        this.#midLine = midLine

        if (startLine) {
            if (Math.abs(getPointDistance(centerPoint, startLine.pointB) - this.radius) > MAX_NUM_ERROR) {
                throw new Error(INCONSISTENT_ARC_ERROR)
            }

            if (getPointDistance(centerPoint, startLine.pointA) > 0) {
                this.#startLine.setPointA(centerPoint)
            }

            if (!this.radius) {
                this._setRadius(getPointDistance(centerPoint, startLine.pointB))
            }
        }

        if (endLine) {
            if (getPointDistance(centerPoint, endLine.pointA) > 0) {
                this.#endLine.setPointA(this.centerPoint)
            }

            if (!this.radius) {
                this._setRadius(getPointDistance(centerPoint, endLine.pointB))
            }

            if (Math.abs(getPointDistance(centerPoint, endLine.pointB) - this.radius) > MAX_NUM_ERROR) {
                throw new Error(INCONSISTENT_ARC_ERROR)
            }
        }

        if (startLine && endLine) {
            this.__updateDetails()
        }
    }

    get basePoint() {
        return this.centerPoint
    }
    get startPoint() {
        return this.#startLine.pointB
    }
    get endPoint() {
        return this.#endLine.pointB
    }

    set startPoint(value) {
        this.#startLine.setPointB(value.x, value.y)
        this.__updateDetails()
    }

    set endPoint(value) {
        this.#endLine.setPointB(value.x, value.y)
        this.__updateDetails()
    }

    get startLine() {
        return this.#startLine
    }
    get endLine() {
        return this.#endLine
    }
    get midLine() {
        return this.#midLine
    }

    set startLine(newLine) {
        if (!newLine) {
            this.#startLine = null
            return
        }

        if (!this.radius) {
            this._setRadius(newLine.length)
        }

        const isConsistent = this.__checkNewInnerLineConsistency(newLine)
        if (isConsistent) {
            this.#startLine = newLine
            return
        }

        throw new Error(INCONSISTENT_LINE_ERROR)
    }

    set endLine(newLine) {
        if (!newLine) {
            this.#endLine = null
            return
        }

        const isConsistent = this.__checkNewInnerLineConsistency(newLine)
        if (isConsistent) {
            this.#endLine = newLine
            return
        }

        throw new Error(INCONSISTENT_LINE_ERROR)
    }

    set midLine(newLine) {
        if (!newLine) {
            this.#midLine = null
            return
        }

        const isConsistent = this.__checkNewInnerLineConsistency(newLine)
        if (isConsistent) {
            this.#midLine = newLine
            return
        }

        throw new Error(INCONSISTENT_LINE_ERROR)
    }

    get radius() {
        return super.radius
    }
    set radius(value) {
        this._setRadius(value)
        this.#startLine.setLength(value, false)
        this.#endLine.setLength(value, false)
        this.#midLine.setLength(value, false)

        this.__updateBoundingBox()
    }

    get isFullyDefined() {
        return !!this.centerPoint && this.radius > 0 && !!this.#startLine && !!this.#endLine
    }

    get isAlmostDefined() {
        return (
            this.centerPoint &&
            this.radius > 0 &&
            !!this.#startLine &&
            this.#startLine.angle >= 0 &&
            this.#startLine.angle <= 360
        )
    }

    get isJoined() {
        return this.#isJoined
    }

    get angle() {
        if (!this.containsAngle(0)) {
            return Math.abs(this.#startLine.angle - this.#endLine.angle)
        }

        return 360 - this.#endLine.angle + this.#startLine.angle
    }

    get length() {
        const arcAngle = this.angle

        return (2 * Math.PI * this.radius * arcAngle) / 360
    }

    getSelectionPoints(pointType) {
        return [
            ...(!pointType || pointType === 'center' ? [{ ...this.centerPoint, pointType: 'center' }] : []),
            ...(!pointType || pointType === 'endPoint'
                ? [
                      { ...this.#startLine.pointB, pointType: 'endPoint' },
                      { ...this.#endLine.pointB, pointType: 'endPoint' }
                  ]
                : []),
            ...(!pointType || pointType === 'midPoint'
                ? [{ ...this.#midLine.pointB, pointType: 'midPoint' }]
                : [])
        ]
    }

    checkIfPointOnElement(point, maxDiff = MAX_NUM_ERROR) {
        const distanceFromCenter = getPointDistance(this.centerPoint, point)
        if (Math.abs(this.radius - distanceFromCenter) > maxDiff) {
            return false
        }

        const lineFromCenter = new Line(this.centerPoint, { pointB: point })
        const lineAngle = lineFromCenter.angle
        const startAngle = this.#startLine.angle
        const endAngle = this.#endLine.angle
        const isInArc =
            startAngle < endAngle
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
        this.#endLine = createLine(this.centerPoint.x, this.centerPoint.y, pointX, pointY, {
            groupId: this.groupId,
            pointsElementId: this.id
        })

        this.#endLine.setLength(this.radius, false)
        this.__updateDetails()
    }

    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        const centerPoint = this.centerPoint
        if (!centerPoint) {
            this._setCenterPoint(definingPoint)

            return
        }

        if (!this.radius) {
            this._setRadius(getPointDistance(centerPoint, definingPoint))

            this.#startLine = createLine(centerPoint.x, centerPoint.y, definingPoint.x, definingPoint.y, {
                groupId: this.groupId,
                pointsElementId: this.id
            })

            return
        }
    }

    getPointById(pointId) {
        if (this.centerPoint.pointId === pointId) {
            return this.centerPoint
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
        if (pointId === this.centerPoint.pointId) {
            const pointCopy = ElementManipulator.copyPoint(this.centerPoint, true)
            pointCopy.x = newPointX
            pointCopy.y = newPointY

            this._setCenterPoint(pointCopy)

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
        lineToChange.setLength(this.radius, false)

        if (this.isFullyDefined) {
            this.__updateDetails()
        }

        return true
    }

    getBoundingBox() {
        return { ...this.#boundingBox }
    }

    move(dX, dY) {
        const centerCopy = ElementManipulator.copyPoint(this.centerPoint, true)
        centerCopy.x += dX
        centerCopy.y += dY

        this._setCenterPoint(centerCopy)

        this.#startLine.move(dX, dY)
        this.#endLine.move(dX, dY)
        this.#midLine.move(dX, dY)

        this.#boundingBox.left += dX
        this.#boundingBox.right += dX
        this.#boundingBox.top += dY
        this.#boundingBox.bottom += dY
    }

    containsAngle(angle) {
        const startAngle = this.#startLine.angle
        const endAngle = this.#endLine.angle

        if (startAngle > endAngle) {
            return angle <= startAngle && angle >= endAngle
        }

        return angle <= startAngle || angle >= endAngle
    }

    _setPointsElementId() {
        const elementId = this.id

        const newCenterPoint = ElementManipulator.copyPoint(this.centerPoint)
        newCenterPoint.elementId = elementId
        this._setCenterPoint(newCenterPoint)

        this.#startLine = this.#startLine
            ? createLine(
                  this.#startLine.pointA.x,
                  this.#startLine.pointA.y,
                  this.#startLine.pointB.x,
                  this.#startLine.pointB.y,
                  { groupId: this.groupId, pointsElementId: elementId }
              )
            : null

        this.#endLine = this.#endLine
            ? createLine(
                  this.#endLine.pointA.x,
                  this.#endLine.pointA.y,
                  this.#endLine.pointB.x,
                  this.#endLine.pointB.y,
                  { groupId: this.groupId, pointsElementId: elementId }
              )
            : null

        this.#midLine = this.#midLine
            ? createLine(
                  this.#midLine.pointA.x,
                  this.#midLine.pointA.y,
                  this.#midLine.pointB.x,
                  this.#midLine.pointB.y,
                  { groupId: this.groupId, pointsElementId: elementId }
              )
            : null
    }

    __updateDetails() {
        this.__updateMidLine()
        this.__updateBoundingBox()

        this.#isJoined = Math.abs(this.#startLine.angle - this.#endLine.angle) < MAX_NUM_ERROR
    }

    __updateBoundingBox() {
        const centerPoint = this.centerPoint
        const radius = this.radius

        const left = this.containsAngle(180)
            ? centerPoint.x - radius
            : Math.min(this.#startLine.pointB.x, this.#endLine.pointB.x)
        const right = this.containsAngle(0)
            ? centerPoint.x + radius
            : Math.max(this.#startLine.pointB.x, this.#endLine.pointB.x)
        const top = this.containsAngle(270)
            ? centerPoint.y - radius
            : Math.min(this.#startLine.pointB.y, this.#endLine.pointB.y)
        const bottom = this.containsAngle(90)
            ? centerPoint.y + radius
            : Math.max(this.#startLine.pointB.y, this.#endLine.pointB.y)

        this.#boundingBox = { left, right, top, bottom }
    }

    __updateMidLine() {
        const centerPoint = this.centerPoint

        if (!this.#midLine) {
            this.#midLine = createLine(centerPoint.x, centerPoint.y, null, null, {
                groupId: this.groupId,
                pointsElementId: this.id
            })
        }

        const angleStartToEnd = Math.abs(this.#startLine.angle - this.#endLine.angle)

        if (Math.abs(angleStartToEnd - 180) <= MAX_NUM_ERROR) {
            const midLineEndPoint = getRotatedPointAroundPivot(this.#startLine.pointB, centerPoint, 90)
            this.#midLine.setPointB(midLineEndPoint.x, midLineEndPoint.y)
            return
        }

        const midPointX = (this.#startLine.pointB.x + this.#endLine.pointB.x) / 2
        const midPointY = (this.#startLine.pointB.y + this.#endLine.pointB.y) / 2
        this.#midLine.setPointB(midPointX, midPointY)

        const isStartLessThanEnd = this.#startLine.angle < this.#endLine.angle
        const isLessThan180 = angleStartToEnd < 180

        const newLength = isStartLessThanEnd !== isLessThan180 ? this.radius : -this.radius

        this.#midLine.setLength(newLength, false)
    }

    __checkNewInnerLineConsistency(newLine) {
        if (!this.isFullyDefined) {
            return true
        }

        if (Math.abs(newLine.length - this.radius) > MAX_NUM_ERROR) {
            return false
        }

        if (!pointsMatch(newLine.startPoint, this.centerPoint)) {
            return false
        }

        return true
    }
}

export default Arc
