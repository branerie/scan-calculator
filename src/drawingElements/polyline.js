import Element from './element'
import { createLine } from '../utils/elementFactory'
import { pointsMatch } from '../utils/point'

const END_POINT_ERROR = 'Cannot set a polyline start point which is not an end point for the first element.'

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

    set startPoint(value) {
        const startElement = this.#elements[0]
        const isStartInPolyDirection = pointsMatch(startElement.startPoint, this.#startPoint)
        if (isStartInPolyDirection) {
            // if (!pointsMatch(value, this.#startPoint)) {
            //     throw new Error(END_POINT_ERROR)
            // }
            
            startElement.startPoint = value
        } else {
            startElement.endPoint = value
        }


        // if (!pointsMatch(value, this.#endPoint)) {
        //     throw new Error(END_POINT_ERROR)
        // }

        this.#startPoint = { ...value, elementId: this.centerPoint.elementId }
    }

    set endPoint(value) {
        const endElement = this.#elements[this.#elements.length - 1]
        const isEndInPolyDirection = pointsMatch(endElement.endPoint, this.#endPoint)
        if (isEndInPolyDirection) {
            // if (!pointsMatch(value, this.#startPoint)) {
            //     throw new Error(END_POINT_ERROR)
            // }
            
            endElement.endPoint = value
        } else {
            endElement.startPoint = value
        }


        // if (!pointsMatch(value, this.#endPoint)) {
        //     throw new Error(END_POINT_ERROR)
        // }

        this.#endPoint = { ...value, elementId: this.centerPoint.elementId }
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

            if (point) break
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

    _setPointsElementId() {
        if (!this.#elements) return
        
        const elementId = this.id
        for (const element of this.#elements) {
            element.groupId = elementId
            // element._setPointsElementId()
        }
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