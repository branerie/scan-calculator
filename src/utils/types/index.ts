import Arc from '../../drawingElements/arc'
import Circle from '../../drawingElements/circle'
import Element from '../../drawingElements/element'
import Line from '../../drawingElements/line'
import Point from '../../drawingElements/point'
import Polyline from '../../drawingElements/polyline'
import Rectangle from '../../drawingElements/rectangle'
import { SelectionPointType } from '../enums/index'
import { Ensure } from './generics'

export type BoundingBox = {
  left: number
  right: number
  top: number
  bottom: number
}

export type SelectionPoint = Required<Point> & {
  pointType: SelectionPointType
}

export type FullyDefinedElement = Ensure<Element, 'startPoint' | 'endPoint'>
export type FullyDefinedLine = Ensure<Line, 'startPoint' | 'endPoint' | 'pointB'>
export type FullyDefinedPolyline = Ensure<Polyline, 'startPoint' | 'endPoint'>
export type FullyDefinedRectangle = Ensure<Rectangle, 'startPoint' | 'endPoint'>
export type FullyDefinedArc = Ensure<Arc, 'startPoint' | 'endPoint'>
export type FullyDefinedCircle = Ensure<Circle, 'startPoint' | 'endPoint'>

export type ElementWithId = Ensure<FullyDefinedElement, 'id'>
