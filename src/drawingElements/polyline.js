import Element from './element'
import { createLine } from '../utils/elementFactory'
import { pointsMatch } from '../utils/point'

class Polyline extends Element {
    #isFullyDefined
    // #isJoined
    #boundingBox
    #elements
    #startPoint
    #endPoint

    constructor(initialPoint, { id = null, groupId = null, elements = null } = {}) {
        super(id, groupId)
        if (groupId && !id) {
            this.id = groupId
            delete this.groupId
        }
        
        // this.#isJoined = false

        if (elements) {
            // do not use this.#elements directly; must go through setter logic
            this.elements = elements
            return
        }

        this.#elements = [createLine(initialPoint.x, initialPoint.y, null, null, { groupId: this.id, assignId: true })]
        this.#isFullyDefined = false
    }

    get id() { return super.id }
    get basePoint() { return this.#elements.length > 0 ? this.#elements[0].basePoint : null }
    get startPoint() { return this.#startPoint ? this.#startPoint : this.#elements[0].startPoint }
    get endPoint() { return this.#endPoint ? this.#endPoint : this.#elements[this.#elements.length - 1].endPoint }
    get isFullyDefined() { return this.#isFullyDefined }
    get elements() { return this.#elements }

    /* Should return true if all but the last dimension of the element are defined */
    get isAlmostDefined() { return !!(this.#elements[0].pointA) }

    get isClosed() {
        if (this.#elements.length < 2) return false
        if (this.#elements[0].startPoint.x !== this.#elements[this.#elements.length - 1].endPoint.x
            || this.#elements[0].startPoint.y !== this.#elements[this.#elements.length - 1].endPoint.y) {
            return false
        }

        return true
    }

    // get isJoined() { return this.#isJoined }
    get isJoined() { return this.isClosed }

    set elements(newElements) {
        this.#elements = newElements

        let isFullyDefined = true
        for (const element of newElements) {
            element.groupId = this.id
            isFullyDefined = isFullyDefined && element.isFullyDefined
        }

        this.#isFullyDefined = isFullyDefined
        if (isFullyDefined) {
            this._updateBoundingBox()
            // this.joinEnds()
        }
    }

    set id(value) {
        super.id = value
    
        if (this.#elements) {
            for (const element of this.#elements) {
                element.groupId = value
            }
        }
    }

    set startPoint(value) {
        if (!pointsMatch(value, this.elements[0].startPoint) && pointsMatch(value, this.elements[0].endPoint)) {
            throw new Error('Cannot set a polyline start point which is not an end point for the first element.')
        }

        this.#startPoint = value
    }

    set endPoint(value) {
        const lastElement = this.elements[this.elements.length - 1]
        if (!pointsMatch(value, lastElement.startPoint) && pointsMatch(value, lastElement.endPoint)) {
            throw new Error('Cannot set a polyline end point which is not an end point for the last element.')
        }

        this.#endPoint = value
    }

    checkIfPointOnElement(point, maxDiff) {
        return this.#elements.some(e => e.checkIfPointOnElement(point, maxDiff))
    }

    defineNextAttribute(definingPoint) {
        const elementToDefine = this.#elements[this.#elements.length - 1]
        elementToDefine.defineNextAttribute(definingPoint)

        const line = createLine(definingPoint.x, definingPoint.y, null, null, { groupId: this.id, assignId: true })
        this.#elements.push(line)
        this.#endPoint = null
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
        this.#isFullyDefined = this.#elements.every(e => e.isFullyDefined)
        
        if (this.#isFullyDefined) {
            this._updateBoundingBox()
            // this.joinEnds()
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

    // joinEnds() {
    //     if (!this.isClosed) return

    //     this.#isJoined = true
    // }

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
        this.#elements.forEach(e => e.groupId = this.id)

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