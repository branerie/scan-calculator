import Point from '../drawingElements/point'
import Rectangle from '../drawingElements/rectangle'
import ElementIntersector from './elementIntersector'

class UserSelection {
    #selectionPoints
    #selectionRect
    constructor(selectionPoints) {
        if (!selectionPoints) {
            return
        }

        if (selectionPoints instanceof Point) {
            this.#selectionPoints = [selectionPoints]
        }

        selectionPoints = selectionPoints.map(point => {
            if (Array.isArray(point)) {
                return new Point(point[0], point[1])
            }

            return point
        })

        if (selectionPoints.length === 2) {
            this.#selectionRect = new Rectangle(
                selectionPoints[0],
                { pointB: selectionPoints[1] }
            )
        }

        this.#selectionPoints = selectionPoints
    }

    isElementSelected(element, includeMode = 'all') {
        /**
         * includeMode: 'all' | 'inside' | 'crossing'
         */
        if (!this.#selectionPoints || this.#selectionPoints?.length === 0) {
            return false
        }

        if (this.#selectionPoints.length === 1) {
            return element.checkIfPointOnElement(this.#selectionPoints[0])
        }

        if (includeMode === 'all' || includeMode === 'inside') {
            const selectionBox = this.#selectionRect.getBoundingBox()
            const elementBox = element.getBoundingBox()

            const isFullyInside = selectionBox.top <= elementBox.top &&
                                  selectionBox.left <= elementBox.left &&
                                  selectionBox.right >= elementBox.right &&
                                  selectionBox.bottom >= elementBox.bottom

            if (includeMode === 'inside' || isFullyInside) {
                // in case of includeMode = 'inside', this is the result, nothing more to check
                // in case of 'all', element could still be partially within selection
                return isFullyInside
            }
        }

        const intersections = ElementIntersector.getIntersections(element, this.#selectionRect)
        return !!intersections
    }
}

export default UserSelection