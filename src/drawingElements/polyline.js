import Element from './element'
import { createLine } from '../utils/elementFactory'

class Polyline extends Element {
    #isFullyDefined
    #boundingBox
    #elements

    constructor(initialPoint, { id = null, groupId = null, elements = null } = {}) {
        super(id, groupId)

        if (elements) {
            this.#elements = elements
            this.#isFullyDefined = elements.every(e => e.isFullyDefined)

            if (this.#isFullyDefined) {
                this._updateBoundingBox()
            }

            return
        }

        this.#elements = [createLine(initialPoint.x, initialPoint.y, null, null, groupId)]
        this.#isFullyDefined = false
    }

    get basePoint() {
        return this.#elements.length > 0 ? this.#elements[0].basePoint : null
    }

    get startPoint() {
        return this.#elements[0].startPoint
    }

    get endPoint() {
        return this.#elements[this.#elements.length - 1].endPoint
    }

    get isFullyDefined() {
        return this.#isFullyDefined
    }

    /* Should return true if all but the last dimension of the element are defined */
    get isAlmostDefined() {
        return !!(this.#elements[0].pointA)
    }

    get isClosed() {
        if (this.#elements.length < 2) return false
        if (this.#elements[0].startPoint.x !== this.#elements[this.#elements.length - 1].endPoint.x
            || this.#elements[0].startPoint.y !== this.#elements[this.#elements.length - 1].endPoint.y) {
            return false
        }

        return true
    }

    get elements() { return this.#elements }

    set elements(newElements) {
        this.#elements = newElements

        this.#isFullyDefined = newElements.every(e => e.isFullyDefined)
        if (this.#isFullyDefined) {
            this._updateBoundingBox()
        }
    }

    checkIfPointOnElement(point, maxDiff) {
        return this.#elements.some(e => e.checkIfPointOnElement(point, maxDiff))
    }

    defineNextAttribute(definingPoint) {
        const elementToDefine = this.#elements[this.#elements.length - 1]
        elementToDefine.defineNextAttribute(definingPoint)

        const line = createLine(definingPoint.x, definingPoint.y, null, null, this.groupId)
        this.#elements.push(line)
    }

    getSelectionPoints(pointType) {
        return this.#elements.reduce((acc, element) => {
            const selectionPoints = element.getSelectionPoints(pointType)
            return [...acc, ...selectionPoints]
        }, [])
    }

    getNearestPoint(point) {
        // TODO: implement method
    }

    setLastAttribute(pointX, pointY) {
        const elementToDefine = this.#elements[this.#elements.length - 1]

        elementToDefine.setPointB(pointX, pointY)
        
        if (this.#isFullyDefined) {
            this._updateBoundingBox()
        }
    }

    setPointById(pointId, newPointX, newPointY) {
        const isSuccessful = this.#elements.reduce((acc, element) => {
            return acc || element.setPointById(pointId, newPointX, newPointY)
        }, false)

        if (isSuccessful) {
            this._updateBoundingBox()
        }

        return isSuccessful
    }

    getPointById(pointId) {
        let point = null
        for (const element of this.#elements) {
            point = element.getPointById(pointId)

            if (point) {
                break
            }
        }

        return point
    }

    move(dX, dY) { 
        this.#elements.forEach(e => e.move(dX, dY))
        
        this.#boundingBox.left += dX
        this.#boundingBox.right += dX
        this.#boundingBox.top += dY
        this.#boundingBox.bottom += dY
    }

    getBoundingBox() { return { ...this.#boundingBox } }

    stretchByMidPoint(dX, dY, midPointId) {
        const movedLineIndex = this.#elements.findIndex(e => e.getPointById(midPointId))
        if (movedLineIndex < 0) return false
        
        if (this.isClosed) {
            if (movedLineIndex === 0) {
                const lastElement = this.#elements[this.#elements.length - 1]
                lastElement.setPointB(lastElement.pointB.x + dX, lastElement.pointB.y + dY)
            }

            if (movedLineIndex === this.#elements.length - 1) {
                const firstElement = this.#elements[0]
                firstElement.setPointA(firstElement.pointA.x + dX, firstElement.pointA.y + dY)
            }
        }

        this.#elements[movedLineIndex].move(dX, dY)

        if (movedLineIndex > 0) {
            const previousElement = this.#elements[movedLineIndex - 1]
            previousElement.setPointB(previousElement.pointB.x + dX, previousElement.pointB.y + dY)
        }

        if (movedLineIndex < this.#elements.length - 1) {
            const nextElement = this.#elements[movedLineIndex + 1]
            nextElement.setPointA(nextElement.pointA.x + dX, nextElement.pointA.y + dY)
        }

        this._updateBoundingBox()
        return true
    }

    completeDefinition() {
        this.#isFullyDefined = true
        this.#elements.pop()
        this._updateBoundingBox()
    }

    _updateBoundingBox() {
        let left = Number.POSITIVE_INFINITY
        let right = Number.NEGATIVE_INFINITY
        let top = Number.POSITIVE_INFINITY
        let bottom = Number.NEGATIVE_INFINITY
        for (const element of this.#elements) {
            const box = element.getBoundingBox()

            left = box.left < left ? box.left : left
            right = box.right > right ? box.right : right
            top = box.top < top ? box.top : top
            bottom = box.bottom > bottom ? box.bottom : bottom
        }

        this.#boundingBox = { left, right, top, bottom }
    }
}

export default Polyline