import { SELECT_DELTA } from '../utils/constants'
import { createPoint } from '../utils/elementFactory'
import { getPointDistance } from '../utils/point'
import Element from './element'
import Point from './point'

class Circle extends Element {
    #radius

    constructor(centerPoint, radius) {
        super()
        
        this.centerPoint = centerPoint
        this.#radius = radius
        this.endPoints = null

        if (radius) {
            this.__setEndPoints()
        }
    }

    get basePoint() {
        return this.centerPoint
    }

    get radius() {
        return this.#radius
    }

    set radius(newRadius) {
        this.#radius = newRadius

        this.__setEndPoints()
    }

    get isFullyDefined() {
        return (
            this.centerPoint &&
            this.radius > 0
        )
    }

    get isAlmostDefined() {
        return !!(this.centerPoint)
    }

    getSnappingPoints() {
        return [ 
            { ...this.centerPoint, pointType: 'center' },
            ...this.endPoints.map(ep => ({ ...ep, pointType: 'endPoint' }))
        ]
    }

    checkIfPointOnElement(point) {
        const distanceFromCenter = getPointDistance(this.centerPoint, point)
        if (Math.abs(this.radius - distanceFromCenter) > SELECT_DELTA) {
            return false
        }

        return true
    }

    getNearestPoint() {
        // TODO: implement nearest point snap of arc
    }

    setLastAttribute(pointX, pointY) {
        this.#radius = getPointDistance(this.centerPoint, new Point(pointX, pointY))

        this.__setEndPoints()
    }

    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        this.setLastAttribute(definingPoint.x, definingPoint.y)
    }

    getPointById(pointId) {
        if (this.centerPoint.pointId === pointId) {
            return this.centerPoint
        }
        
        return this.endPoints.find(ep => ep.pointId === pointId)
    }

    setPointById(pointId, newPointX, newPointY) {
        const point = this.getPointById(pointId)

        if (point === this.centerPoint) {
            return this.move(newPointX - point.x, newPointY - point.y)
        }

        this.setLastAttribute(newPointX, newPointY)
    }

    move(dX, dY) {
        this.centerPoint.x += dX
        this.centerPoint.y += dY

        this.endPoints.forEach(ep => {
            ep.x += dX
            ep.y += dY
        })
    }

    __setEndPoints() {
        if (!this.endPoints) {
            this.endPoints = [
                createPoint(this.centerPoint.x + this.radius, this.centerPoint.y),
                createPoint(this.centerPoint.x - this.radius, this.centerPoint.y),
                createPoint(this.centerPoint.x, this.centerPoint.y + this.radius),
                createPoint(this.centerPoint.x, this.centerPoint.y - this.radius)
            ]

            return
        }

        this.endPoints[0].x = this.centerPoint.x + this.radius
        this.endPoints[1].x = this.centerPoint.x - this.radius
        this.endPoints[2].y = this.centerPoint.y + this.radius
        this.endPoints[3].y = this.centerPoint.y - this.radius
    }
}

export default Circle