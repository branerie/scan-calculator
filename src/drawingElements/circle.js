import { MAX_NUM_ERROR } from '../utils/constants'
import { createPoint } from '../utils/elementFactory'
import ElementManipulator from '../utils/elementManipulator'
import { getPointDistance } from '../utils/point'
import BaseArc from './baseArc'

const RADIUS_MIN_DIFF = 1e-3
const FULL_CIRCLE_ANGLE = 360

class Circle extends BaseArc {
    #endPoints
    #boundingBox

    constructor(centerPoint, { radius = null, endPoints = null, id = null } = {}) {
        super(centerPoint, { radius, id })

        this.#endPoints = endPoints

        this.__verifyConsistency()

        if (this.radius) {
            this.__setDetails()
        }
    }

    get basePoint() { return this.centerPoint }
    get startPoint() { return this.#endPoints[0] }
    get endPoint() { return this.#endPoints[0] }

    get endPoints() { return this.#endPoints }

    get radius() { return super.radius }
    set radius(newRadius) {
        this.__setRadius(newRadius)
        this.__setDetails()
    }

    get isFullyDefined() {
        return !!this.centerPoint && this.radius > 0
    }

    get isAlmostDefined() {
        return !!this.centerPoint
    }

    get angle() { return FULL_CIRCLE_ANGLE }
    get length() { return 2 * Math.PI * this.radius }

    getSelectionPoints(pointType) {
        return [
            ...(
                !pointType || pointType === 'center' 
                    ? [{ ...this.centerPoint, pointType: 'center' }] 
                    : []
            ),
            ...(
                !pointType || pointType === 'endPoint'
                    ? this.#endPoints.map(ep => ({ ...ep, pointType: 'endPoint' }))
                    : []
            )
        ]
    }

    checkIfPointOnElement(point, maxDiff) {
        const distanceFromCenter = getPointDistance(this.centerPoint, point)
        if (Math.abs(this.radius - distanceFromCenter) > maxDiff) {
            return false
        }

        return true
    }

    getNearestPoint() {
        // TODO: implement nearest point snap of arc
    }

    setLastAttribute(pointX, pointY) {
        this.__setRadius(
            getPointDistance(
                this.centerPoint, 
                createPoint(pointX, pointY, { assignId: false })
            )
        )

        this.__setDetails()
    }

    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        this.setLastAttribute(definingPoint.x, definingPoint.y)
    }

    getPointById(pointId) {
        if (this.centerPoint.pointId === pointId) {
            return this.centerPoint
        }

        const endPoint = this.#endPoints.find(ep => ep.pointId === pointId)
        return endPoint ? endPoint : null
    }

    setPointById(pointId, newPointX, newPointY) {
        const point = this.getPointById(pointId)
        if (!point) {
            return false
        }

        if (pointId === this.centerPoint.pointId) {
            this.move(newPointX - point.x, newPointY - point.y)
            return true
        }

        // point must be an end point
        this.setLastAttribute(newPointX, newPointY)
        return true
    }

    move(dX, dY) {
        const centerCopy = ElementManipulator.copyPoint(this.centerPoint, true)
        centerCopy.x += dX
        centerCopy.y += dY

        this.__setCenterPoint(centerCopy)

        this.#endPoints.forEach(ep => {
            ep.x += dX
            ep.y += dY
        })

        this.#boundingBox.left += dX
        this.#boundingBox.top += dY
        this.#boundingBox.right += dX
        this.#boundingBox.bottom += dY
    }

    getBoundingBox() { return this.#boundingBox }

    containsAngle(angle) { return true }

    _setPointsElementId() {
        const elementId = this.id

        const newCenterPoint = ElementManipulator.copyPoint(this.centerPoint, true)
        newCenterPoint.elementId = elementId
        this.__setCenterPoint(newCenterPoint)

        if (this.#endPoints) {
            for (const endPoint of this.#endPoints) {
                endPoint.elementId = elementId
            }
        }
    }

    __setDetails() {
        this.__setEndPoints()
        this.__setBoundingBox()
    }

    __setBoundingBox() {
        const xDims = this.#endPoints.map(ep => ep.x)
        const yDims = this.#endPoints.map(ep => ep.y)

        this.#boundingBox = {
            left: Math.min(...xDims),
            top: Math.min(...yDims),
            right: Math.max(...xDims),
            bottom: Math.max(...yDims)
        }
    }

    __setEndPoints() {
        const centerPoint = this.centerPoint
        const radius = this.radius

        if (!this.#endPoints) {
            this.#endPoints = [
                createPoint(
                    centerPoint.x + radius, 
                    centerPoint.y,
                    { elementId: centerPoint.elementId, assignId: true }   
                ),
                createPoint(
                    centerPoint.x - radius, 
                    centerPoint.y, 
                    { elementId: centerPoint.elementId, assignId: true }
                ),
                createPoint(
                    centerPoint.x, 
                    centerPoint.y + radius,
                    { elementId: centerPoint.elementId, assignId: true }
                ),
                createPoint(
                    centerPoint.x, 
                    centerPoint.y - radius,
                    { elementId: centerPoint.elementId, assignId: true } 
                ),
            ]

            return
        }

        this.#endPoints[0].x = centerPoint.x + radius
        this.#endPoints[1].x = centerPoint.x - radius
        this.#endPoints[2].y = centerPoint.y + radius
        this.#endPoints[3].y = centerPoint.y - radius
    }

    __verifyConsistency() {
        const centerPoint = this.centerPoint
        const radius = this.radius

        if (!centerPoint) {
            throw new Error('Cannot have a circle element without a center point')
        }

        // radius is not set yet, we will not check further for points consistency
        if (!radius) {
            if (!this.#endPoints) return

            if (this.#endPoints.length !== 4) {
                throw new Error('Circle must contain exactly four(4) end points')
            }

            const firstPointDistance = getPointDistance(this.#endPoints[0], centerPoint)
            const secondPointDistance = getPointDistance(this.#endPoints[1], centerPoint)
            const thirdPointDistance = getPointDistance(this.#endPoints[2], centerPoint)
            const fourthPointDistance = getPointDistance(this.#endPoints[3], centerPoint)

            if (
                Math.abs(firstPointDistance - secondPointDistance) > MAX_NUM_ERROR ||
                Math.abs(firstPointDistance - thirdPointDistance) > MAX_NUM_ERROR ||
                Math.abs(firstPointDistance - fourthPointDistance) > MAX_NUM_ERROR
            ) {
                throw new Error(
                    'Circle end points must be an equal distance from the circle center (its radius)'
                )
            }

            this.__setRadius(firstPointDistance)
        }

        if (isNaN(Number(radius) || radius <= 0)) {
            throw new Error('Circle radius must be a positive number')
        }

        if (!this.#endPoints || !Array.isArray(this.#endPoints)) {
            return this.__setDetails()
        }

        const isEndPointsInconsistent = this.#endPoints.some(
            ep => Math.abs(getPointDistance(ep, centerPoint) - radius) > RADIUS_MIN_DIFF
        )

        if (isEndPointsInconsistent) {
            throw new Error('Inconsisent circle element. End points not lying on the circle')
        }
    }
}

export default Circle
