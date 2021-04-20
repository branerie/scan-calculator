import Element from './element'
import { createLine, createPoint } from '../utils/elementFactory'

class Polyline extends Element {
    #isFullyDefined

    constructor(initialPoint, { id = null, groupId = null, elements = null }) {
        super(id, groupId)

        this.elements = elements ? elements : [createLine(initialPoint.x, initialPoint.y, groupId)]
        this.#isFullyDefined = false
    }

    get basePoint() {
        return this.elements.length > 0 ? this.elements[0].basePoint : null
    }

    get startPoint() {
        return this.elements[0].startPoint
    }

    get endPoint() {
        return this.elements[this.elements.length - 1].endPoint
    }

    get isFullyDefined() {
        return this.#isFullyDefined
    }

    /* Should return true if all but the last dimension of the element are defined */
    get isAlmostDefined() {
        return !!(this.elements[0].pointA)
    }

    get isClosed() {
        if (this.elements.length < 2) return false
        if (this.elements[0].startPoint.x !== this.elements[this.elements.length - 1].endPoint.x
            || this.elements[0].startPoint.y !== this.elements[this.elements.length - 1].endPoint.y) {
            return false
        }

        return true
    }

    checkIfPointOnElement(point, maxDiff) {
        return this.elements.some(e => e.checkIfPointOnElement(point, maxDiff))
    }

    defineNextAttribute(definingPoint) {
        const elementToDefine = this.elements[this.elements.length - 1]
        elementToDefine.defineNextAttribute(definingPoint)

        const line = createLine(definingPoint.x, definingPoint.y, this.groupId)
        this.elements.push(line)
    }

    getSelectionPoints() {
        return this.elements.reduce((acc, element) => {
            const snappingPoints = element.getSelectionPoints()
            return [...acc, ...snappingPoints]
        }, [])
    }

    getNearestPoint(point) {
        // TODO: implement method
    }

    setLastAttribute(pointX, pointY) {
        this.#isFullyDefined = true

        const elementToDefine = this.elements[this.elements.length - 1]

        elementToDefine.setPointB(pointX, pointY)
    }

    setPointById(pointId, newPointX, newPointY) {
        return this.elements.reduce((acc, element) => {
            return acc || element.setPointById(pointId, newPointX, newPointY)
        }, false)
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

    move(dX, dY) { this.elements.forEach(e => e.move(dX, dY)) }

    stretchByMidPoint(dX, dY, midPointId) {
        const movedLineIndex = this.elements.findIndex(e => e.getPointById(midPointId))
        if (movedLineIndex < 0) return false
        
        if (this.isClosed) {
            if (movedLineIndex === 0) {
                const lastElement = this.elements[this.elements.length - 1]
                lastElement.setPointB(lastElement.pointB.x + dX, lastElement.pointB.y + dY)
            }

            if (movedLineIndex === this.elements.length - 1) {
                const firstElement = this.elements[0]
                firstElement.setPointA(firstElement.pointA.x + dX, firstElement.pointA.y + dY)
            }
        }

        this.elements[movedLineIndex].move(dX, dY)

        if (movedLineIndex > 0) {
            const previousElement = this.elements[movedLineIndex - 1]
            previousElement.setPointB(previousElement.pointB.x + dX, previousElement.pointB.y + dY)
        }

        if (movedLineIndex < this.elements.length - 1) {
            const nextElement = this.elements[movedLineIndex + 1]
            nextElement.setPointA(nextElement.pointA.x + dX, nextElement.pointA.y + dY)
        }
    }
}

export default Polyline