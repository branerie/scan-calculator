import { useCallback } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import Circle from '../../drawingElements/circle'
import Element, { ElementWithId } from '../../drawingElements/element'
import Point from '../../drawingElements/point'
import Polyline, { SubElement } from '../../drawingElements/polyline'
import { useToolsStore } from '../../stores/tools/index'
import { MAX_NUM_ERROR } from '../../utils/constants'
import ElementManipulator from '../../utils/elementManipulator'
import { SelectionPointType } from '../../utils/enums/index'
import { generateId } from '../../utils/general'
import { pointsMatch } from '../../utils/point'
import { SelectionPoint } from '../../utils/types/index'

const getPointKey = (point: Point) => `${point.x.toFixed(3)},${point.y.toFixed(3)}`

const useJoinCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const selectedElements = useElementsStore((state) => state.selectedElements)
  const startReplacingElements = useElementsStore((state) => state.startReplacingElements)
  const continueReplacingElements = useElementsStore((state) => state.continueReplacingElements)
  const hasSelectedElement = useElementsStore((state) => state.hasSelectedElement)
  const getElementById = useElementsStore((state) => state.getElementById)
  const findNearbyPoints = useElementsStore((state) => state.findNearbyPoints)
  const replaceElements = useElementsStore((state) => state.replaceElements)
  const clearSelection = useElementsStore((state) => state.clearSelection)
  const resetTool = useToolsStore((state) => state.resetTool)

  const handleJoinCmd = useCallback(() => {
    if (!selectedElements) {
      resetTool()
      return
    }

    const elementsByEndPoints: Map<string, ElementEndPointData[]> = new Map()
    //#region Fill elementsByEndPoints
    for (const selectedElement of selectedElements.values()) {
      if (selectedElement instanceof Circle) {
        continue
      }

      let endPoints: SelectionPoint[]
      if (selectedElement instanceof Polyline) {
        endPoints = [
          { 
            ...selectedElement.startPoint as Required<Point>, 
            pointType: SelectionPointType.EndPoint,
          },
          { 
            ...selectedElement.endPoint as Required<Point>, 
            pointType: SelectionPointType.EndPoint 
          },
        ]
      } else {
        endPoints = selectedElement.getSelectionPoints(SelectionPointType.EndPoint)
      }
      
      for (const endPoint of endPoints) {
        const pointKey = getPointKey(endPoint)
        if (elementsByEndPoints.has(pointKey)) {
          continue
        }

        // taking max two element points as we cannot join three elements at the same point
        const nearbyPoints = findNearbyPoints(endPoint.x, endPoint.y, MAX_NUM_ERROR)
          .filter(p => 
            (p.pointType === SelectionPointType.EndPoint && hasSelectedElement(p.elementId)) || p.pointId === endPoint.pointId
          )
          .slice(0, 2)
        if (nearbyPoints.length < 2) {
          continue
        }

        elementsByEndPoints.set(
          pointKey, 
          nearbyPoints.map(nearbyPoint => {
            let pointElement = getElementById(nearbyPoint.elementId)!
            if (pointElement.groupId) {
              pointElement = getElementById(pointElement.groupId)!
            }

            return {
              element: pointElement,
              isStartPoint: pointsMatch(pointElement.startPoint, endPoint)
            }
          })
        )        
      }
    }
    //#endregion

    const polylines: PolylineBlueprint[] = []
    const polylineIdxByElementId: Map<string, number> = new Map()
    //#region Fill polylines (data about future polyline subElements)
    for (const endPointData of elementsByEndPoints.values()) {
      let polylineElement: ElementEndPointData | null = null
      let otherElement: ElementEndPointData | null = null
      if (polylineIdxByElementId.has(endPointData[0].element.id)) {
        polylineElement = endPointData[0]
        otherElement = endPointData[1]
      } else if (polylineIdxByElementId.has(endPointData[1].element.id)) {
        polylineElement = endPointData[1]
        otherElement = endPointData[0]
      }

      if (polylineElement) {
        // the other endPoint of polylineElement has already been traversed and, naturally
        // this current endPoint must also be a part of the same polyline
        const polylineIndex = polylineIdxByElementId.get(polylineElement.element.id)!
        const polyline = polylines[polylineIndex]
        polyline.elements.get(polylineElement.element.id)!.numVertices++
        polyline.elements.set(otherElement!.element.id, {
          elementEndPoint: otherElement!,
          numVertices: 1
        })

        polylineIdxByElementId.set(otherElement!.element.id, polylineIndex)
      } else {
        // starting a new polyline
        const firstElementEndPoint = endPointData[0]
        const secondElementEndPoint = endPointData[1]
        const polyline: PolylineBlueprint = {
          elements: new Map([
            [
              firstElementEndPoint.element.id, {
                elementEndPoint: firstElementEndPoint,
                numVertices: 1
              }
            ],
            [
              secondElementEndPoint.element.id, {
                elementEndPoint: secondElementEndPoint,
                numVertices: 1
              }
            ]
          ])
        }
        
        polylineIdxByElementId.set(firstElementEndPoint.element.id, polylines.length)
        polylineIdxByElementId.set(secondElementEndPoint.element.id, polylines.length)
        polylines.push(polyline)
      }
    }
    //#endregion

    const replacements: Map<string, {
      replacingElements: ElementWithId[];
      removedSections: Element[];
    }> = new Map()
    for (const polyline of polylines) {
      const polylineElementsArray = Array.from(polyline.elements.values())
      // polyline first element will be an element with only 1 vertex (i.e. it has another end point that is not connected)
      // to another subElement. In case of a closed polyline, we just take the first element in polylineElementsArray as
      // the first subElement of the polyline
      const firstElementEndPoint  = 
        polylineElementsArray.find(e => e.numVertices === 1)?.elementEndPoint || polylineElementsArray[0].elementEndPoint   
      let currentElementEndPoint = firstElementEndPoint
      let currentVertexKey = currentElementEndPoint.isStartPoint 
        ? getPointKey(currentElementEndPoint.element.startPoint) 
        : getPointKey(currentElementEndPoint.element.endPoint)
      const firstElementLooseVertexKey = currentElementEndPoint.isStartPoint
        ? getPointKey(currentElementEndPoint.element.endPoint) 
        : getPointKey(currentElementEndPoint.element.startPoint)
      const polylineElements = [
        ElementManipulator.copyElement(currentElementEndPoint.element, { keepIds: false, assignId: true }) as ElementWithId
      ]
      do {
        const vertexData = elementsByEndPoints.get(currentVertexKey)!
        currentElementEndPoint = Array.from(
          vertexData.values()
        ).find(endPointData => endPointData.element.id !== currentElementEndPoint!.element.id)!

        const newPolylineElement = currentElementEndPoint.element
        const newPolylineElementCopy = ElementManipulator.copyElement(
          newPolylineElement, { keepIds: false, assignId: true }
        ) as ElementWithId

        if (newPolylineElementCopy instanceof Polyline) {
          polylineElements.push(...(newPolylineElementCopy.elements as ElementWithId[]))
        } else {
          polylineElements.push(
            newPolylineElementCopy
          )
        }

        // with join, we are removing a bunch of elements and adding a single one in their place
        // we save that as a direct replacement of the first element of the new polyline with the 
        // polyline itself, and replacing the rest of the old elements (now subElements) with nothing
        replacements.set(newPolylineElement.id, {
          replacingElements: [],
          removedSections: [newPolylineElement]
        })

        currentVertexKey = currentElementEndPoint.isStartPoint
          ? getPointKey(currentElementEndPoint.element.endPoint)
          : getPointKey(currentElementEndPoint.element.startPoint)
      } while (elementsByEndPoints.has(currentVertexKey) && currentVertexKey !== firstElementLooseVertexKey)

      const firstSubElement = firstElementEndPoint.element
      const polylineStartPoint = firstElementEndPoint.isStartPoint
        ? firstSubElement.endPoint
        : firstSubElement.startPoint 
      const newPolyline = new Polyline(polylineStartPoint, { elements: polylineElements as SubElement[] })
      newPolyline.id = generateId()
      replacements.set(firstSubElement.id, {
        replacingElements: [newPolyline as ElementWithId],
        removedSections: [firstSubElement]
      })
    }
    /*
    TODO: Има варианти да не сработи джойн. Издъни се веднъж при вече построена полилиния с джойн, с включващи арки и линии
    Не искаше да добави нови елементи с джойн
    */

    if (replacements.size > 0) {
      startReplacingElements(replacements)
      continueReplacingElements()
      replaceElements()
      clearSelection()
    }

    resetTool()
  }, [
    selectedElements,
    getElementById,
    hasSelectedElement,
    findNearbyPoints,
    resetTool, 
    startReplacingElements, 
    continueReplacingElements, 
    replaceElements, 
    clearSelection
  ])

  return handleJoinCmd
}

type ElementEndPointData = {
  element: ElementWithId
  isStartPoint: boolean 
}

type PolylineBlueprint = {
  elements: Map<string, { 
    elementEndPoint: ElementEndPointData, 
    numVertices: number 
  }>
}

export default useJoinCommand