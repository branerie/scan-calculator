import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import Polyline from '../drawingElements/polyline'
import { createLine } from '../utils/line'
import { IElementCreator } from './index'

export default class PolylineCreator implements IElementCreator {
  private _polyline: Polyline | null = null
  private _elements: Line[] = []
  private _currentLine: Line | null = null
  private _startPoint?: Point

  defineNextAttribute(definingPoint: Point) {
    if (!this._startPoint) {
      this._startPoint = definingPoint
      return
    }

    if (!this._currentLine) {
      this._currentLine = createLine(this._startPoint, definingPoint)
      this._elements.push(this._currentLine)
    } else {
      this._currentLine.endPoint = definingPoint
    }

    // TODO: Add elements setter to Polyline, or figure out some other 
    // way to set the updated element
    // this._polyline.elements = this._elements
  }

  defineCurrentLine() {
    if (!this._currentLine) {
      return
    }

    this._startPoint = this._currentLine.endPoint!
    this._currentLine = null
  }

  setLastAttribute(pointX: number, pointY: number) {
      
  }

  get definedElement() {
    return this._polyline
  }
}