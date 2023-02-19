import Arc from '../../drawingElements/arc'
import Point from '../../drawingElements/point'
import { generateId } from '../../utils/general'
import { copyPoint, createPoint, getPointByDeltasAndDistance, getPointDistance } from '../../utils/point'
import { IElementCreator } from '../index'

export default class ArcByCenterFirstCreator implements IElementCreator {
  private _arc: Arc | null = null
  private _isFullyDefined: boolean = false

  defineNextAttribute(definingPoint: Point) {
    if (!this._arc) {
      this._arc = new Arc(definingPoint)
      return
    }

    const arc = this._arc
    const centerPoint = arc.centerPoint

    if (!arc.startPoint) {
      arc.radius = getPointDistance(centerPoint, definingPoint)

      const newStartPoint = copyPoint(definingPoint, false, true)
      newStartPoint.elementId = arc.id || undefined

      arc.startPoint = newStartPoint
      return
    }

    const radius = arc.radius
    const deltaX = definingPoint.x - centerPoint.x
    const deltaY = definingPoint.y - centerPoint.y

    let endPoint: Point
    if (deltaY === 0) {
      const xDiff = deltaX > 0 ? radius : -radius
      endPoint = createPoint(
        centerPoint.x + xDiff,
        centerPoint.y
      )
    } else {
      endPoint = getPointByDeltasAndDistance(
        centerPoint,
        deltaX,
        deltaY,
        radius
      )
    }

    endPoint.elementId = arc.id || undefined
    endPoint.pointId = arc.endPoint?.pointId || generateId()
    arc.endPoint = endPoint

    this._isFullyDefined = true
  }

  setLastAttribute(pointX: number, pointY: number) {

  }

  get definedElement() {
    return this._isFullyDefined ? this._arc : null
  }

}