import { useCallback } from 'react'
import Polyline from '../../drawingElements/polyline'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'
import { SNAP_DELTA } from '../../utils/constants'
import { createPoint } from '../../utils/elementFactory'
import { getPointDistance } from '../../utils/point'
import { MousePosition, SelectionPoint } from '../../utils/types/index'

const useSnapCommand = () => {
  const elementsStore = useElementsStore()
  const currentlyCreatedElement = elementsStore(state => state.currentlyCreatedElement)
  const currentlyEditedElements = elementsStore(state => state.currentlyEditedElements)
  const snappedPoint = elementsStore(state => state.snappedPoint)
  const setSnappedPoint = elementsStore(state => state.setSnappedPoint)
  const selectedPoints = elementsStore(state => state.selectedPoints)
  const findNearbyPoints = elementsStore(state => state.findNearbyPoints)

  const currentScale = useToolsStore()(state => state.currentScale)

  const handleSnapCmd = useCallback((mousePosition: MousePosition) => {
    const { mouseX, mouseY } = mousePosition
    let nearbyPoints = findNearbyPoints(mouseX, mouseY, SNAP_DELTA / currentScale)

    if (
      currentlyCreatedElement &&
      currentlyCreatedElement.isFullyDefined &&
      (currentlyCreatedElement instanceof Polyline)
    ) {
      let snappingPoints: SelectionPoint[] = []
      for (let i = 0; i < currentlyCreatedElement.elements.length - 1; i++) {
        const element = currentlyCreatedElement.elements[i]
        snappingPoints = snappingPoints.concat(element.getSelectionPoints())
      }

      const newNearbyPoints = snappingPoints.filter(sp =>
        getPointDistance(sp, { x: Number(mouseX.toFixed(3)), y: Number(mouseY.toFixed(3)) }) <
        SNAP_DELTA / currentScale
      )
      nearbyPoints = nearbyPoints.concat(newNearbyPoints)
    }

    if (currentlyEditedElements) {
      nearbyPoints = nearbyPoints.filter(nbp => 
        !Array.from(currentlyEditedElements.values()).some(cee => {
          if (cee instanceof Polyline && selectedPoints) {
            const elementsWithEditedPoints = cee.elements.filter(e =>
              selectedPoints.some(sp => e.getPointById(sp.pointId))
            )
            return elementsWithEditedPoints.some(ewep => ewep.getPointById(nbp.pointId))
          }

          return cee.getPointById(nbp.pointId)
        })
      )
    }

    if (nearbyPoints.length === 0) {
      if (snappedPoint) {
        return setSnappedPoint(null)
      }

      return
    }

    const mousePoint = createPoint(mouseX, mouseY)

    let nearestSnappingPoint = nearbyPoints.length > 0 ? nearbyPoints[0] : null
    let nearestDistance = nearestSnappingPoint
      ? getPointDistance(mousePoint, nearestSnappingPoint)
      : null
    for (let pointIndex = 1; pointIndex < nearbyPoints.length; pointIndex++) {
      const nearbyPoint = nearbyPoints[pointIndex]
      const nearbyPointDistance = getPointDistance(mousePoint, nearbyPoint)

      if (nearbyPointDistance < nearestDistance!) {
        nearestSnappingPoint = nearbyPoint
        nearestDistance = nearbyPointDistance
      }
    }

    setSnappedPoint(nearestSnappingPoint)
  }, [
    currentScale,
    currentlyCreatedElement,
    currentlyEditedElements,
    findNearbyPoints,
    selectedPoints,
    snappedPoint,
    setSnappedPoint
  ])

  return handleSnapCmd
}

export default useSnapCommand
