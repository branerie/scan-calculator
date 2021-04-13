import Element from './element'
import { createLine, createPolyline } from '../utils/elementFactory'
import Point from './point'

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

    copy(keepIds = false) {
        let polyline
        if (keepIds) {
            const newInitialPoint = new Point(this.basePoint.x, this.basePoint.y)
            newInitialPoint.pointId = this.basePoint.pointId
            polyline = new Polyline(newInitialPoint, this.groupId)
            polyline.id = this.id

        } else {
            polyline = createPolyline(this.basePoint.x, this.basePoint.y)    
        }

        polyline.elements = this.elements.map(e => e.copy(keepIds))
        return polyline
    }

    getNearestPoint(point) {
        // TODO: implement method
    }

    setLastAttribute(definingPoint) {
        this.#isFullyDefined = true

        const lineToDefine = this.elements[this.elements.length - 1]
        lineToDefine.pointB = definingPoint
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

    setPointById(pointId, newPointX, newPointY) {
        let isPointSet = false
        this.elements.forEach(e => {
            if (isPointSet) return

            isPointSet = e.setPointById(pointId, newPointX, newPointY)
        })

        return isPointSet
    }
}

export default Polyline