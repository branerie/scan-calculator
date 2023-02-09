import { generateId } from '../utils/general'
import { copyPoint } from '../utils/point'
import Element from './element'
import Point from './point'

export default abstract class BaseArc extends Element {
  protected _centerPoint
  protected _radius: number = 0

  constructor(
    centerPoint: Point, 
    options: { 
      radius?: number, 
      groupId?: string, 
      id?: string 
    } = {}
  ) {
    const { id, groupId, radius } = options    
    super(id, groupId)

    const newCenterPoint = copyPoint(centerPoint, true)
    newCenterPoint.elementId = id
    if (!newCenterPoint.pointId) {
      newCenterPoint.pointId = generateId()
    }

    this._centerPoint = newCenterPoint

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
}