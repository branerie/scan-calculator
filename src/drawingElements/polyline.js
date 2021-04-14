import Element from './element'
import { createLine, createPoint } from '../utils/elementFactory'

class Polyline extends Element {
    #isFullyDefined

    constructor(initialPoint, groupId) {
        super(groupId)

        this.elements = [createLine(initialPoint.x, initialPoint.y, groupId)]
        this.#isFullyDefined = false
    }

    get basePoint() {
        return this.elements.length > 0 ? this.elements[0].basePoint : null
    }

    get isFullyDefined() {
        return this.#isFullyDefined
    }

    /* Should return true if all but the last dimension of the element are defined */
    get isAlmostDefined() {
        return !!(this.elements[0].pointA)
    }

    checkIfPointOnElement(point) {
        return this.elements.some(e => e.checkIfPointOnElement(point))
    }

    defineNextAttribute(definingPoint) {
        const lineToDefine = this.elements[this.elements.length - 1]
        lineToDefine.defineNextAttribute(definingPoint)

        const line = createLine(definingPoint.x, definingPoint.y, this.groupId)
        this.elements.push(line)
    }

    getSnappingPoints() {
        return this.elements.reduce((acc, element) => {
            const snappingPoints = element.getSnappingPoints()
            for (const [snappingPointType, snappingPointValues] of Object.entries(snappingPoints)) {
                if (!acc[snappingPointType]) {
                    acc[snappingPointType] = []
                }

                for (const point of snappingPointValues) {
                    acc[snappingPointType].push({ ...point, elementId: this.groupId })
                }
            }

            return acc
        }, {})
    }

    getNearestPoint(point) {
        // TODO: implement method
    }

    setLastAttribute(pointX, pointY) {
        this.#isFullyDefined = true


        const lineToDefine = this.elements[this.elements.length - 1]

        if (!lineToDefine.pointB) {
            return lineToDefine.pointB = createPoint(pointX, pointY)
        }

        lineToDefine.pointB.x = pointX
        lineToDefine.pointB.y = pointY
    }

    getPointById(pointId) {
        let point = null
        for (const element of this.elements) {
            point = element.getPointById(pointId)

            if (point) {
                break
            }
        }

        return point
    }
}

export default Polyline