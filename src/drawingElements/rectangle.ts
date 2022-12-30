import { createLine } from '../utils/elementFactory'
import Line from './line'
import Point from './point'
import Polyline from './polyline'

export default class Rectangle extends Polyline {
  constructor(
    pointA: Point, 
    options: { 
      pointB?: Point, 
      id?: string, 
      groupId?: string 
    }
  ) {
    const { pointB, id, groupId } = options  
    super(pointA, { id, groupId })

    if (pointB) {
      this.elements = [
        createLine(pointA.x, pointA.y, pointB.x, pointA.y, { groupId, assignId: true }),
        createLine(pointB.x, pointA.y, pointB.x, pointB.y, { groupId, assignId: true }),
        createLine(pointB.x, pointB.y, pointA.x, pointB.y, { groupId, assignId: true }),
        createLine(pointA.x, pointB.y, pointA.x, pointA.y, { groupId, assignId: true })
      ]

      // this.joinEnds()
    }
  }

  get isFullyDefined() {
    return !!(this.elements[0]) && !!(this.elements[1])
  }

  get isAlmostDefined() {
    return this.elements[0].isAlmostDefined
  }

  get elements(): Line[] {
    return super.elements as Line[]
  }

  set elements(newElements: Line[]) {
    super.elements = newElements
  }

  setLastAttribute(pointX: number, pointY: number) {
    if (this.elements.length === 0) {
      throw new Error('Cannot setLastAttribute without initial base point')
    }

    const elements = this.elements as Line[]
    const firstLine = elements[0]
    firstLine.setLastAttribute(pointX, firstLine.pointA!.y)
    const firstLinePointA = firstLine.pointA!
    
    if (this.elements.length === 4) {
      elements[1].setPointA(pointX, firstLinePointA.y)
      elements[1].setPointB(pointX, pointY)

      elements[2].setPointA(pointX, pointY)
      elements[2].setPointB(firstLinePointA.x, pointY)

      elements[2].setPointA(pointX, pointY)
      elements[2].setPointB(firstLinePointA.x, pointY)

      elements[3].setPointA(firstLinePointA.x, pointY)
      elements[3].setPointB(firstLinePointA.x, firstLinePointA.y)
      
      this._updateBoundingBox()
      // this.joinEnds()

      return
    }

    this.elements = [
      firstLine,
      createLine(
        pointX, 
        firstLinePointA.y, 
        pointX, 
        pointY, 
        { groupId: this.groupId || undefined, assignId: true }
      ),
      createLine(
        pointX, 
        pointY, 
        firstLinePointA.x, 
        pointY, 
        { groupId: this.groupId || undefined, assignId: true }
      ),
      createLine(
        firstLinePointA.x, 
        pointY, 
        firstLinePointA.x, 
        firstLinePointA.y, 
        { groupId: this.groupId || undefined, assignId: true }
      )
    ]

    this._updateBoundingBox()
    // this.joinEnds()
  }
}