import { degreesToRadians, getQuadrant } from '../utils/angle'
import { getPointDistance } from '../utils/point'
import Element from './element'
import Line from './line'
import Point from './point'

class Arc extends Element {
    // TODO: Arc is not working properly
    #startLine
    #endLine

    constructor(centerPoint, groupId = null) {
        super(groupId)

        this.centerPoint = centerPoint
    }

    get baseX() {
        return this.centerPoint.x
    }

    get baseY() {
        return this.centerPoint.y
    }

    get isFullyDefined() {
        return (
            this.centerPoint &&
            this.radius > 0 &&
            (this.startAngle >= 0 && this.startAngle <= 360 && this.startAngle !== null) &&
            (this.endAngle >= 0 && this.endAngle <= 360 && this.endAngle !== null)
        )
    }

    get isAlmostDefined() {
        return (
            this.centerPoint &&
            this.radius > 0 &&
            (this.startAngle >= 0 && this.startAngle <= 360 && this.startAngle !== null)
        )
    }

    getSnappingPoints() {
        // TODO: test method
        return {
            center: this.centerPoint,
            endPoints: [ this.#startLine.pointB, this.#endLine.pointB ],
            nearest: () => {
                // TODO: implement nearest point snap of arc
            }
        }
    }

    setLastAttribute(lastPoint) {
        // TODO: test method
        if (this.centerPoint.y === this.lastPoint.y) {
            const endPointX = this.centerPoint.x > this.lastPoint.x 
                                        ? this.centerPoint.x - this.radius
                                        : this.centerPoint.x + this.radius

            this.#endLine = new Line(this.centerPoint, new Point(endPointX, this.centerPoint.y))
            return
        }
        
        if (this.centerPoint.x === this.lastPoint.x) {
            const endPointY = this.centerPoint.y > this.lastPoint.y 
                                        ? this.centerPoint.y - this.radius
                                        : this.centerPoint.y + this.radius

            this.#endLine = new Line(this.centerPoint, new Point(this.centerPoint.x, endPointY))
            return
        }

        const line = new Line(this.centerPoint, lastPoint)

        const quadrant = getQuadrant(line.angle)

        let endAngle
        let dXMultiplier
        let dYMultiplier
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

        const dX = Math.cos(endAngle) * this.radius * dXMultiplier
        const dY = Math.sin(endAngle) * this.radius * dYMultiplier

        const endPoint = new Point(this.centerPoint.x + dX, this.centerPoint + dY)

        this.#endLine = new Line(this.centerPoint, endPoint)
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
            this.#startLine = line

            return
        }
    }

    move(dX, dY) {
        this.centerPoint.x += dX
        this.centerPoint.y += dY
    }

    getFoundationalElements() {
        // const start = polarToCartesian(this.centerPoint, this.radius, this.endAngle)
        // const end = polarToCartesian(this.centerPoint, this.radius, this.startAngle)

        // const largeArcFlag = this.endAngle - this.startAngle <= 180 ? '0' : '1'

        // return [
        //     'M', start.x, start.y,
        //     'A', this.radius, this.radius, 0, largeArcFlag, 0, end.x, end.y
        // ].join(' ')

        return [
            this.centerPoint.x,
            this.centerPoint.y,
            this.radius,
            this.radius,
            degreesToRadians(this.#startLine.angle),
            degreesToRadians(this.#endLine.angle),
            false
        ]
    }
}

export default Arc