import { createPoint } from '../utils/elementFactory'
import { getPointDistance } from '../utils/point'
import Element from './element'
import Point from './point'

const RADIUS_MIN_DIFF = 1e-3

class Circle extends Element {
    #radius
    #centerPoint
    #endPoints

    constructor(centerPoint, { radius = null, endPoints = null, id = null } = {}) {
        super(id)
        
        this.#centerPoint = centerPoint
        this.#radius = radius
        this.#endPoints = endPoints

        this.__verifyConsistency()
    }

    get basePoint() { return this.#centerPoint }
    get centerPoint() { return this.#centerPoint }
    get radius() { return this.#radius }
    get endPoints() { return this.#endPoints }

    set radius(newRadius) {
        this.#radius = newRadius
        this.__setEndPoints()
    }

    get isFullyDefined() {
        return (
            this.#centerPoint &&
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
        this.__setEndPoints()
    }

    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        this.setLastAttribute(definingPoint.x, definingPoint.y)
    }

    getPointById(pointId) {
        if (this.#centerPoint.pointId === pointId) {
            return this.#centerPoint
        }
        
        return this.#endPoints.find(ep => ep.pointId === pointId)
    }

    setPointById(pointId, newPointX, newPointY) {
        const point = this.getPointById(pointId)

        if (point === this.#centerPoint) {
            return this.move(newPointX - point.x, newPointY - point.y)
        }

        this.setLastAttribute(newPointX, newPointY)
    }

    move(dX, dY) {
        this.#centerPoint.x += dX
        this.#centerPoint.y += dY

        this.#endPoints.forEach(ep => {
            ep.x += dX
            ep.y += dY
        })
    }

    __setEndPoints() {
        if (!this.#endPoints) {
            this.#endPoints = [
                createPoint(this.#centerPoint.x + this.#radius, this.#centerPoint.y),
                createPoint(this.#centerPoint.x - this.#radius, this.#centerPoint.y),
                createPoint(this.#centerPoint.x, this.#centerPoint.y + this.#radius),
                createPoint(this.#centerPoint.x, this.#centerPoint.y - this.#radius)
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
            return
        }

        if (isNaN(Number(this.#radius) || this.#radius <= 0)) {
            throw new Error('Circle radius must be a positive number')
        }

        if (!this.#endPoints || !Array.isArray(this.#endPoints)) {
            return this.__setEndPoints()
        }

        const isEndPointsInconsistent = this.#endPoints.some(ep => 
            Math.abs(getPointDistance(ep, this.#centerPoint) - this.#radius) > RADIUS_MIN_DIFF)
            
        if (isEndPointsInconsistent) {
            throw new Error('Inconsisent circle element. End points not lying on the circle')
        }
    }
}

export default Circle