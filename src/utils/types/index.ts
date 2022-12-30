import Element from '../../drawingElements/element'
import Point from '../../drawingElements/point'
import { SelectionPointType } from '../enums/index'
import { Ensure } from './generics'

export type BoundingBox = {
    left: number
    right: number
    top: number
    bottom: number
}

export type SelectionPoint = Point & {
    pointType: SelectionPointType
}

export type ElementWithId = Ensure<Element, 'id'>
