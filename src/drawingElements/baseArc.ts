import Element from './element'
import Point from './point'

export default abstract class BaseArc extends Element {
  private _centerPoint
  private _radius: number = 0

  constructor(
    centerPoint: Point, 
    options: { 
      radius?: number, 
      groupId?: string, 
      id?: string 
    }
  ) {
    const { id, groupId, radius } = options    
    super(id, groupId)

    centerPoint.elementId = id
    this._centerPoint = centerPoint

    if (radius) {
      this._radius = radius
    }
  }

  get baseType() { return 'arc' }
  get radius() { return this._radius }
  get centerPoint() { return { ...this._centerPoint } }

  abstract get angle(): number
  abstract get length(): number

  abstract containsAngle(angle: number): boolean

  protected _setRadius(newRadius: number) { this._radius = newRadius }
  protected _setCenterPoint(newCenterPoint: Point) { 
    this._centerPoint = newCenterPoint
  }
}