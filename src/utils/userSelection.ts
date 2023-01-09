import Point from '../drawingElements/point'
import Rectangle from '../drawingElements/rectangle'
import ElementIntersector from './elementIntersector'
import { FullyDefinedElement, FullyDefinedRectangle } from './types/index'

export default class UserSelection {
  private _selectionPoints: Point[]
  private _selectionRect?: FullyDefinedRectangle
  constructor(selectionPoints: Point[] | Point) {
    let selectionPointsArr: Point[]
    if (Array.isArray(selectionPoints)) {
      selectionPointsArr = selectionPoints
    } else {
      selectionPointsArr = [selectionPoints]
    }

    selectionPointsArr = selectionPointsArr.map(point => {
      if (Array.isArray(point)) {
        return new Point(point[0], point[1])
      }

      return point
    })

    if (selectionPointsArr.length === 2) {
      this._selectionRect = new Rectangle(
        selectionPointsArr[0],
        { pointB: selectionPointsArr[1] }
      ) as FullyDefinedRectangle
    }

    this._selectionPoints = selectionPointsArr
  }

  isElementSelected(element: FullyDefinedElement, includeMode = 'all') {
    /**
     * includeMode: 'all' | 'inside' | 'crossing'
     */
    if (!this._selectionPoints || this._selectionPoints?.length === 0) {
      return false
    }

    if (this._selectionPoints.length === 1) {
      return element.checkIfPointOnElement(this._selectionPoints[0])
    }

    if (includeMode === 'all' || includeMode === 'inside') {
      const selectionBox = this._selectionRect!.getBoundingBox()
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

    const intersections = ElementIntersector.getIntersections(element, this._selectionRect!)
    return !!intersections
  }
}