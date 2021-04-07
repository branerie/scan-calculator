import { polarToCartesian } from '../utils/angle'
import Element from './element'

class Arc extends Element {
    constructor(centerPoint, radius, startAngle, endAngle, groupId = null) {
        super(groupId)

        this.centerPoint = centerPoint
        this.radius = radius
        this.startAngle = startAngle
        this.endAngle = endAngle
    }

    move(dX, dY) {
        this.centerPoint.x += dX
        this.centerPoint.y += dY
    }

    getFoundatinalElements() {
        const start = polarToCartesian(this.centerPoint, this.radius, this.endAngle)
        const end = polarToCartesian(this.centerPoint, this.radius, this.startAngle)
    
        const largeArcFlag = this.endAngle - this.startAngle <= 180 ? '0' : '1'
    
        return [
            'M', start.x, start.y,
            'A', this.radius, this.radius, 0, largeArcFlag, 0, end.x, end.y
        ].join(' ')
    }
}

export default Arc