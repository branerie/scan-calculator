import Arc from '../../drawingElements/arc';
import Point from '../../drawingElements/point';
import { getArcCenterByThreePoints } from '../../utils/arc';
import { IElementCreator } from '../index'

export default class ArcByThreePointsCretor implements IElementCreator {
  private _arc: Arc | null = null
  private _points: Point[] = []

  defineNextAttribute(definingPoint: Point) {
    if (this._points.length < 2) {
      this._points.push(definingPoint)
      return
    }

    this._points[2] = definingPoint
    if (!this._arc) {
      const centerPoint = getArcCenterByThreePoints(...this._points as [Point, Point, Point])
      this._arc = new Arc(centerPoint, {
        startPoint: this._points[0],
        endPoint: this._points[2]
      })

      return
    }

    this._arc.endPoint = definingPoint
  }

  setLastAttribute(pointX: number, pointY: number) {

  }

  get definedElement() {
    return this._arc
  }
}