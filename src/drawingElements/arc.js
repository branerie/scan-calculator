import { getPointDistance } from '../utils/point'
import Element from './element'
import Line from './line'

class Arc extends Element {
    constructor({ centerPoint, radius, startAngle, endAngle, groupId, generatorFunc }) {
        super(generatorFunc, groupId)

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
        const line = new Line({ pointA: this.centerPoint, pointB: lastPoint })
        this.endAngle = line.angle

        this.__setDrawingElement()
    }

    defineNextAttribute(definingPoint) {
        if (this.isFullyDefined) return

        if (!this.centerPoint) {
            this.centerPoint = definingPoint
            return
        }

        if (!this.radius) {
            this.radius = getPointDistance(this.centerPoint, definingPoint)

            const line = new Line({ pointA: this.centerPoint, pointB: definingPoint })
            this.startAngle = line.angle

            return
        }
    }

    move(dX, dY) {
        this.centerPoint.x += dX
        this.centerPoint.y += dY
    }
}

export default Arc