import { degreesToRadians } from '../utils/angle'
import { getPointDistance } from '../utils/point'
import Element from './element'
import Line from './line'

class Arc extends Element {
    constructor(centerPoint, radius, startAngle, endAngle, groupId = null) {
        super(groupId)

        this.centerPoint = centerPoint
        this.radius = radius
        this.startAngle = startAngle
        this.endAngle = endAngle
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

    setLastAttribute(lastPoint) {
        const line = new Line(this.centerPoint, lastPoint)
        this.endAngle = line.angle
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
            this.startAngle = line.angle

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
            degreesToRadians(this.startAngle),
            degreesToRadians(this.endAngle),
            false
        ]
    }
}

export default Arc