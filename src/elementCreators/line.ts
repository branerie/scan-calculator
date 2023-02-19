import Line from '../drawingElements/line'
import Point from '../drawingElements/point'
import { createLine } from '../utils/line'
import { IElementCreator } from './index'

export default class LineCreator implements IElementCreator {
  private _line: Line | null = null
  private _startPoint?: Point

  defineNextAttribute(definingPoint: Point) {
    if (!this._startPoint) {
      this._startPoint = definingPoint
      return
    }

    if (!this._line) {
      this._line = createLine(this._startPoint, definingPoint)
      return
    }

    // TODO: Като имаме логиката за по-сложни команди, с избор на опции,
    // трябва да се започне да се изпозват всики Creator-и и да се изтрият
    // от самите елементи методите defineNextAttribute и setLastAttribute
    // Специално за линията, да се погледнат setPointA/setPointB - нужни ли са
    // изобщо? Не може ли да минем със startPoint и endPoint сетърите? Също да
    // се оправят тези два сетъра - трябва да копират точката и да ъпдейтват средната
    // точка и _boundingBox-а
    this._line.endPoint = definingPoint
  }

  setLastAttribute(pointX: number, pointY: number) {

  }

  get definedElement() {
    return this._line
  }
}