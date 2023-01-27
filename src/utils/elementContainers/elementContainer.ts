import Arc from '../../drawingElements/arc'
import { ElementWithId } from '../../drawingElements/element'
import Line from '../../drawingElements/line'
import Point from '../../drawingElements/point'

export type DivContentsYieldResult = {
  divContents: Set<string>,
  checkIfPointInSameDiv(point: Point): boolean
}

export default abstract class ElementContainer {
  abstract addElements(newElements: ElementWithId[]): void
  abstract removeElements(removedElements: ElementWithId[]): void
  abstract removeElementById(elementId: string): void
  abstract changeElements(changedElements: ElementWithId[]): void
  abstract setElements(newElements: ElementWithId[]): void
  abstract getElementsNearPoint(pointX: number, pointY: number): Set<string> | null
  abstract getElementsInContainer(
    firstContainerPoint: Point, 
    secondContainerPoint: Point
  ): Set<string> | null
  
  abstract getElementIdsNearElement(element: ElementWithId): Set<string>

  /**
   * 
   * @param pointA First Point
   * @param pointB Second Point
   * @returns true if both points are in the same grid division, false otherwise
   */
  abstract checkPointsLocality(pointA: Point, pointB: Point): boolean
  abstract checkIfPointInDivision(point: Point, division: [number, number]): boolean
  abstract getNextElementsInLineDirection(line: Line, fromStart: boolean): Generator<DivContentsYieldResult, null>
  abstract getNextElementsInArcDirection(arc: Arc, fromStart: boolean): Generator<DivContentsYieldResult, null>
}