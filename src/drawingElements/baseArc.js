import Element from './element'

class BaseArc extends Element {
    #centerPoint
    #radius

    constructor(centerPoint, { radius, groupId, id }) {
        super(id, groupId)

        centerPoint.elementId = id
        this.#centerPoint = centerPoint
        this.#radius = radius
    }

    get baseType() { return 'arc' }
    get radius() { return this.#radius }
    get centerPoint() { return { ...this.#centerPoint } }

    get angle() {
        throw new Error('Angle getter not implemented')
    }

    get length() {
        throw new Error('Length getter not implemented')
    }

    containsAngle(angle) {
        throw new Error('Method "containsAngle" not implemented')
    }

    __setRadius(value) { this.#radius = value }
    __setCenterPoint(value) { this.#centerPoint = { ...value, elementId: value.elementId || this.id } }
}

export default BaseArc