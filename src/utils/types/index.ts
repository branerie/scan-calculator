import Point from '../../drawingElements/point'
import { SelectionPointType } from '../enums/index'

export type BoundingBox = {
  left: number
  right: number
  top: number
  bottom: number
}

export type MousePosition = {
  mouseX: number,
  mouseY: number
}

export type SelectionPoint = Required<Point> & {
  pointType: SelectionPointType
}