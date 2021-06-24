import { getPointDistance } from '../utils/point'
import { degreesToRadians, getQuadrant, getAngleBetweenPoints } from '../utils/angle'
import Element from './element'
import { createPoint } from '../utils/elementFactory'
import Point from './point'

class Line extends Element {
    #pointA
    #pointB
    #midPoint
    #boundingBox

    constructor(pointA, { pointB = null, id = null, groupId = null, midPointId = null } = {}) {
        super(id, groupId)
        // TODO: check if both points are the same point

        this.#pointA = pointA
        if (pointB) {
            this.#pointB = pointB
            this.__updateDetails()

            if (midPointId) {
                this.#midPoint.pointId = midPointId
            }
        }
    }

    get basePoint() { return this.#pointA }
    get startPoint() { return this.pointA }
    get endPoint() { return this.pointB }

    set startPoint(value) { return this.setPointA(value.x, value.y) }
    set endPoint(value) { return this.setPointB(value.x, value.y) }

    get pointA() { return this.#pointA ? { ...this.#pointA } : null }
    get pointB() { return this.#pointB ? { ...this.#pointB } : null }
    get midPoint() { return this.#midPoint ? { ...this.#midPoint } : null }

    get isFullyDefined() {
        return (
            !!(this.#pointA) &&
            !!(this.#pointB)
            // (!!(this.#pointA.x) || this.#pointA.x === 0) &&
            // (!!(this.#pointA.y) || this.#pointA.y === 0) &&
            // (!!(this.#pointB.x) || this.#pointB.x === 0) &&
            // (!!(this.#pointB.y) || this.#pointB.y === 0)
        )
    }

    get isAlmostDefined() { return (!!this.#pointA) }

    get length() {
        if (!this.#pointA || !this.#pointB) {
            throw new Error('Cannot get length of line until it is fully defined')
        }

        return getPointDistance(this.#pointA, this.#pointB)
    }

    get isVertical() { return this.#pointA.x === this.#pointB.x }
    get isHorizontal() { return this.#pointA.y === this.#pointB.y }

    get angle() {
        if (!this.#pointA || !this.#pointB) {
            throw new Error('Cannot get angle of line until it is fully defined')
        }

        return getAngleBetweenPoints(this.#pointA, this.#pointB)
    }

    get equation() {
        if (!this.isFullyDefined) return null

        // m = (y2 - y1) / (x2 - x1)
        const xDiff = this.#pointB.x - this.#pointA.x

        const slope = xDiff !== 0 ? (this.#pointB.y - this.#pointA.y) / xDiff : Number.NaN
        // b = y - m * x
        const intercept = isNaN(slope) ? Number.NaN : this.#pointA.y - this.#pointA.x * slope

        return { slope, intercept }
    }

    setPointA(x, y) {
        this.#pointA.x = x
        this.#pointA.y = y
        this.__updateDetails()
    }

    setPointB(x, y) {
        if (!this.#pointB) {
            this.#pointB = createPoint(x, y)
        } else {
            this.#pointB.x = x
            this.#pointB.y = y
        }

        this.__updateDetails()
    }

    checkIfPointOnElement(point, maxDiff) {
        if (!this.#pointA || !this.#pointB) {
            throw new Error('Cannot use method \'checkIfPointOnElement\' before line is fully defined.')
        }

        const nearestPoint = this.getNearestPoint(point, false)
        const perpendicular = new Line(point, { pointB: nearestPoint })

        return perpendicular.length < maxDiff
    }

    setLastAttribute(pointX, pointY) {
        if (!this.#pointB) {
            this.#pointB = createPoint(pointX, pointY)
            this.__updateDetails()
            return
        }

        this.setPointB(pointX, pointY)
    }

    setPointById(pointId, newPointX, newPointY) {
        const settingResult = super.setPointById(pointId, newPointX, newPointY)
        this.__updateDetails()
        
        return settingResult
    }

    getPointById(pointId) {
        if (this.#pointA.pointId === pointId) {
            return this.#pointA
        }

        if (this.#pointB && this.#pointB.pointId === pointId) {
            return this.#pointB
        }

        if (this.#pointB && this.#midPoint.pointId === pointId) {
            return this.#midPoint
        }

        return null
    }

    getSelectionPoints(pointType) {
        if (!this.isFullyDefined) {
            return []
        }

        // this.__updateDetails()

        return [
            ...(!pointType || pointType === 'endPoint') ? [
                { ...this.#pointA, pointType: 'endPoint' },
                { ...this.#pointB, pointType: 'endPoint' }
            ] : [],
            ...(!pointType || pointType === 'midPoint') ? [{ ...this.#midPoint, pointType: 'midPoint' }] : []
        ]
    }

    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) {
            // needs to set mid point when line is part of a polyline which is currently created
            // otherwise, the mid point is not set anywhere
            if (!this.#midPoint) {
                this.__updateDetails()
            }

            return
        }

        if (!this.#pointA) {
            this.#pointA = definingPoint
            return
        }

        this.#pointB = definingPoint
        this.__updateDetails()
    }

    getNearestPoint(point, shouldUseLineExtension = false) {
        let nearestPoint = null
        if (this.isVertical || this.isHorizontal) {
            nearestPoint = this.isVertical
                ? new Point(this.#pointA.x, point.y)
                : new Point(point.x, this.#pointA.y)
        } else {
            const { slope, intercept: lineIntercept } = this.equation

            // mp = - 1 / m (slope of perpendicular)
            // bp = yp - mp * xp = yp + (xp / m)
            const perpendicularIntercept = point.y + point.x / slope

            const intersectX = slope * (perpendicularIntercept - lineIntercept) / (slope ** 2 + 1)
            const intersectY = intersectX * slope + lineIntercept
 
            // // find perpendicular intercept from input point (bp)
            // const perpendicularIntercept = point.y + slope * point.x

            // // xi = (bp - b) / (2 * m)
            // const intersectX = (perpendicularIntercept - lineIntercept) / (2 * slope)
            // // yi = m * x + b 
            // const intersectY = slope * intersectX + lineIntercept

            nearestPoint = new Point(intersectX, intersectY)
        }

        if (!shouldUseLineExtension) {
            // return pointA or pointB (whichever is nearest) if point from perpendicular to line
            // is outside the line

            const distanceFromStart = getPointDistance(this.#pointA, nearestPoint)
            const distanceFromEnd = getPointDistance(this.#pointB, nearestPoint)

            // TODO: does not check if point lies on extension of line or is just really far away
            if (distanceFromStart > this.length) {
                return { x: this.#pointB.x, y: this.#pointB.y }
            }

            if (distanceFromEnd > this.length) {
                return { x: this.#pointA.x, y: this.#pointA.y }
            }
        }

        return nearestPoint
    }

    setLength(newLength, shouldMovePointA) {
        if (!this.#pointA || !this.#pointB) {
            throw new Error('Cannot set length of a line that is not fully defined')
        }

        if (this.#pointA.y === this.#pointB.y) {
            if (shouldMovePointA) {
                this.#pointA.x = this.#pointA.x > this.#pointB.x
                    ? this.#pointB.x + newLength
                    : this.#pointB.x - newLength
            } else {
                this.#pointB.x = this.#pointB.x > this.#pointA.x
                    ? this.#pointA.x + newLength
                    : this.#pointA.x - newLength
            }

            return this.__updateDetails()
        }

        if (this.#pointA.x === this.#pointB.x) {
            if (shouldMovePointA) {
                this.#pointA.y = this.#pointA.y > this.#pointB.y
                    ? this.#pointB.y + newLength
                    : this.#pointB.y - newLength
            } else {
                this.#pointB.y = this.#pointB.y > this.#pointA.y
                    ? this.#pointA.y + newLength
                    : this.#pointA.y - newLength
            }

            return this.__updateDetails()
        }

        const quadrant = getQuadrant(this.angle)

        let angle,
            dXMultiplier,
            dYMultiplier
        switch (quadrant) {
            case 1:
                angle = this.angle
                dXMultiplier = 1
                dXMultiplier = 1
                break
            case 2:
                angle = 180 - this.angle
                dXMultiplier = -1
                dXMultiplier = 1
                break
            case 3:
                angle = this.angle - 180
                dXMultiplier = -1
                dYMultiplier = -1
                break
            case 4:
                angle = 360 - this.angle
                dXMultiplier = 1
                dYMultiplier = -1
                break
            default:
                throw new Error(`Invalid angle quadrant: ${quadrant}`)
        }

        const angleRadians = degreesToRadians(angle)
        const dX = Math.cos(angleRadians) * newLength * dXMultiplier
        const dY = Math.sin(angleRadians) * newLength * dYMultiplier

        if (shouldMovePointA) {
            return this.setPointA(this.#pointB.x - dX, this.#pointB.y - dY)
        }

        this.setPointB(this.#pointA.x + dX, this.#pointA.y + dY)
    }

    getBoundingBox() { return { ...this.#boundingBox } }

    move(dX, dY) {
        this.#pointA.x += dX
        this.#pointA.y += dY
        this.#pointB.x += dX
        this.#pointB.y += dY
        this.#midPoint.x += dX
        this.#midPoint.y += dY

        this.#boundingBox.left += dX
        this.#boundingBox.right += dX
        this.#boundingBox.top += dY
        this.#boundingBox.bottom += dY
    }

    __updateDetails() {
        this.__updateMidPoint()
        this.__updateBoundingBox()
    }

    __updateBoundingBox() {
        let left, right
        if (this.#pointA.x <= this.#pointB.x) {
            left = this.#pointA.x
            right = this.#pointB.x
        } else {
            left = this.#pointB.x
            right = this.#pointA.x
        }

        let top, bottom
        if (this.#pointA.y <= this.#pointB.y) {
            top = this.#pointA.y
            bottom = this.#pointB.y
        } else {
            top = this.#pointB.y
            bottom = this.#pointA.y
        }

        this.#boundingBox = { left, right, top, bottom }
    }

    __updateMidPoint() {
        if (!this.#pointA || !this.#pointB) return

        if (!this.#midPoint) {
            this.#midPoint = createPoint((this.#pointA.x + this.#pointB.x) / 2, (this.#pointA.y + this.#pointB.y) / 2)
            return
        }

        this.#midPoint.x = (this.#pointA.x + this.#pointB.x) / 2
        this.#midPoint.y = (this.#pointA.y + this.#pointB.y) / 2
    }
}

export default Line