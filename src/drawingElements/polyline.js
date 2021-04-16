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

    checkIfPointOnElement(point) {
        return this.elements.some(e => e.checkIfPointOnElement(point))
    }

    defineNextAttribute(definingPoint) {
        const elementToDefine = this.elements[this.elements.length - 1]
        elementToDefine.defineNextAttribute(definingPoint)

        const line = createLine(definingPoint.x, definingPoint.y, this.groupId)
        this.elements.push(line)
    }

    getSnappingPoints() {
        return this.elements.reduce((acc, element) => {
            const snappingPoints = element.getSnappingPoints()
            return [...acc, ...snappingPoints]
        }, [])
    }

    getNearestPoint(point) {
        // TODO: implement method
    }

    setLastAttribute(pointX, pointY) {
        this.#isFullyDefined = true

        const elementToDefine = this.elements[this.elements.length - 1]

        if (!elementToDefine.pointB) {
            return elementToDefine.pointB = createPoint(pointX, pointY)
        }

        elementToDefine.pointB.x = pointX
        elementToDefine.pointB.y = pointY
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

    move(dX, dY) {
        this.elements.forEach(e => e.move(dX, dY))
    }

    stretchByMidPoint(dX, dY, midPointId) {
        const movedLineIndex = this.elements.findIndex(e => e.getPointById(midPointId))
        if (movedLineIndex < 0) return false
        
        if (this.isClosed) {
            if (movedLineIndex === 0) {
                this.elements[this.elements.length - 1].pointB.x += dX
                this.elements[this.elements.length - 1].pointB.y += dY
            }

            if (movedLineIndex === this.elements.length - 1) {
                this.elements[0].pointA.x += dX
                this.elements[0].pointA.y += dY
            }
        }

        this.elements[movedLineIndex].move(dX, dY)

        if (movedLineIndex > 0) {
            this.elements[movedLineIndex - 1].pointB.x += dX
            this.elements[movedLineIndex - 1].pointB.y += dY
        }

        if (movedLineIndex < this.elements.length - 1) {
            this.elements[movedLineIndex + 1].pointA.x += dX
            this.elements[movedLineIndex + 1].pointA.y += dY
        }
    }
}

export default Polyline