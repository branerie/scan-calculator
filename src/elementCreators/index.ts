import Element from '../drawingElements/element'
import Point from '../drawingElements/point'

export interface IElementCreator {
  defineNextAttribute(definingPoint: Point): void
  setLastAttribute(pointX: number, pointY: number): void
  get definedElement(): Element | null
}