import { MAX_NUM_ERROR } from '../utils/constants'
import { createPoint } from '../utils/elementFactory'
import { getPointDistance } from '../utils/point'
import Element from './element'
import Point from './point'

const RADIUS_MIN_DIFF = 1e-3

class Circle extends Element {
    #radius
    #centerPoint
    #endPoints
    #boundingBox

    constructor(centerPoint, { radius = null, endPoints = null, id = null } = {}) {
        super(id)
        
        this.#centerPoint = centerPoint
        this.#radius = radius
        this.#endPoints = endPoints

        this.__verifyConsistency()

        if (this.#radius) {
            this.__setDetails()
        }
    }

    get basePoint() { return this.#centerPoint }
    get centerPoint() { return this.#centerPoint }
    get radius() { return this.#radius }
    get endPoints() { return this.#endPoints }

    set radius(newRadius) {
        this.#radius = newRadius
        this.__setDetails()
    }

    get isFullyDefined() {
        return (
            !!(this.#centerPoint) &&
            this.#radius > 0
        )
    }

    get isAlmostDefined() { return !!(this.#centerPoint) }

    getSelectionPoints() {
        return [ 
            { ...this.#centerPoint, pointType: 'center' },
            ...this.#endPoints.map(ep => ({ ...ep, pointType: 'endPoint' }))
        ]
    }

    checkIfPointOnElement(point, maxDiff) {
        const distanceFromCenter = getPointDistance(this.#centerPoint, point)
        if (Math.abs(this.#radius - distanceFromCenter) > maxDiff) {
            return false
        }

        return true
    }

    getNearestPoint() {
        // TODO: implement nearest point snap of arc
    }

    setLastAttribute(pointX, pointY) {
        this.#radius = getPointDistance(this.#centerPoint, new Point(pointX, pointY))
        this.__setDetails()
    }

    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        this.setLastAttribute(definingPoint.x, definingPoint.y)
    }

    getPointById(pointId) {
        if (this.#centerPoint.pointId === pointId) {
            return this.#centerPoint
        }
        
        const endPoint = this.#endPoints.find(ep => ep.pointId === pointId)
        return endPoint ? endPoint : null
    }

    setPointById(pointId, newPointX, newPointY) {
        const point = this.getPointById(pointId)
        if (!point) {
            return false
        }

        if (point === this.#centerPoint) {
            this.move(newPointX - point.x, newPointY - point.y)
            return true
        }

        // point must be an end point
        this.setLastAttribute(newPointX, newPointY)
        return true
    }

    move(dX, dY) {
        this.#centerPoint.x += dX
        this.#centerPoint.y += dY

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
        if (!this.#endPoints) {
            this.#endPoints = [
                createPoint(this.#centerPoint.x - this.#radius, this.#centerPoint.y),
                createPoint(this.#centerPoint.x + this.#radius, this.#centerPoint.y),
                createPoint(this.#centerPoint.x, this.#centerPoint.y - this.#radius),
                createPoint(this.#centerPoint.x, this.#centerPoint.y + this.#radius)
            ]

            return
        }

        this.#endPoints[0].x = this.#centerPoint.x + this.#radius
        this.#endPoints[1].x = this.#centerPoint.x - this.#radius
        this.#endPoints[2].y = this.#centerPoint.y + this.#radius
        this.#endPoints[3].y = this.#centerPoint.y - this.#radius
    }

    __verifyConsistency() {
        if (!this.#centerPoint) {
            throw new Error('Cannot have a circle element without a center point')
        }

        // radius is not set yet, we will not check further for points consistency
        if (!this.#radius) {
            if (!this.#endPoints) return

            if (this.#endPoints.length !== 4) {
                throw new Error('Circle must contain exactly four(4) end points')
            }

            const firstPointDistance = getPointDistance(this.#endPoints[0], this.#centerPoint)
            const secondPointDistance = getPointDistance(this.#endPoints[1], this.#centerPoint)
            const thirdPointDistance = getPointDistance(this.#endPoints[2], this.#centerPoint)
            const fourthPointDistance = getPointDistance(this.#endPoints[3], this.#centerPoint)

            if (Math.abs(firstPointDistance - secondPointDistance) > MAX_NUM_ERROR ||
                Math.abs(firstPointDistance - thirdPointDistance) > MAX_NUM_ERROR ||
                Math.abs(firstPointDistance - fourthPointDistance) > MAX_NUM_ERROR) {
                throw new Error('Circle end points must be an equal distance from the circle center (its radius)')
            }

            this.#radius = firstPointDistance
        }

        if (isNaN(Number(this.#radius) || this.#radius <= 0)) {
            throw new Error('Circle radius must be a positive number')
        }

        if (!this.#endPoints || !Array.isArray(this.#endPoints)) {
            return this.__setDetails()
        }

        const isEndPointsInconsistent = this.#endPoints.some(ep => 
            Math.abs(getPointDistance(ep, this.#centerPoint) - this.#radius) > RADIUS_MIN_DIFF)
            
        if (isEndPointsInconsistent) {
            throw new Error('Inconsisent circle element. End points not lying on the circle')
        }
    }
}

export default Circle