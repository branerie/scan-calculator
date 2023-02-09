import { useCallback, MouseEvent } from 'react'
import { useElementsStoreContext } from '../../contexts/ElementsStoreContext'
import { ElementWithId } from '../../drawingElements/element'
import Point from '../../drawingElements/point'
import { useToolsStore } from '../../stores/tools/index'

const useSelectCommand = () => {
  const useElementsStore = useElementsStoreContext()
  const startEditingElements = useElementsStore((state) => state.startEditingElements)
  const getElementsContainingPoint = useElementsStore((state) => state.getElementsContainingPoint)
  const getElementsInContainer = useElementsStore((state) => state.getElementsInContainer)
  const selectedElements = useElementsStore((state) => state.selectedElements)
  const addSelectedElements = useElementsStore((state) => state.addSelectedElements)
  // const setSelectedElements = useElementsStore(state => state.setSelectedElements)
  const setSelectedPoints = useElementsStore((state) => state.setSelectedPoints)
  const removeSelectedElements = useElementsStore((state) => state.removeSelectedElements)
  const findNearbyPoints = useElementsStore((state) => state.findNearbyPoints)

  const toolClicks = useToolsStore((state) => state.toolClicks)
  const setTool = useToolsStore((state) => state.setTool)
  const getSelectDelta = useToolsStore((state) => state.getSelectDelta)
  const addToolClick = useToolsStore((state) => state.addToolClick)
  const clearCurrentTool = useToolsStore((state) => state.clearCurrentTool)

  const handleSelectCmd = useCallback(
    (event: MouseEvent, clickedPoint: Point) => {
      const selectDelta = getSelectDelta()
      if (selectedElements && selectedElements.size > 0) {
        const nearbyPoints = findNearbyPoints(clickedPoint.x, clickedPoint.y, selectDelta)

        const selectedPoints = []
        const editedElements = []
        for (const point of nearbyPoints) {
          const editedElement = Array.from(selectedElements.values()).find((se) =>
            se.getPointById(point.pointId)
          )

          if (editedElement) {
            selectedPoints.push(point)
            editedElements.push(editedElement)

            // editedElement.isShown = false
          }
        }

        if (editedElements.length > 0) {
          setTool({ type: 'edit', name: 'edit' })
          addToolClick(selectedPoints[0])

          startEditingElements(editedElements, false, false)
          setSelectedPoints(selectedPoints)
          // setSelectedElements([...selectedElements.values()])
          return
        }
      }

      const clickedElements = getElementsContainingPoint(clickedPoint.x, clickedPoint.y, {
        maxPointsDiff: selectDelta,
      })

      if (!toolClicks) {
        if (clickedElements) {
          if (event.shiftKey) {
            removeSelectedElements(clickedElements as ElementWithId[])
            return
          }

          addSelectedElements(clickedElements as ElementWithId[])
          return
        }

        addToolClick(clickedPoint, false)
        return
      }

      const initialClick = toolClicks[0]
      const newlySelectedElements = getElementsInContainer(initialClick, clickedPoint, {
        shouldSkipPartial: initialClick.x < clickedPoint.x,
      })

      if (newlySelectedElements) {
        if (event.shiftKey) {
          removeSelectedElements(newlySelectedElements as ElementWithId[])
        } else {
          addSelectedElements(newlySelectedElements as ElementWithId[])
        }
      }

      clearCurrentTool()
      return
    },
    [
      getElementsContainingPoint,
      getSelectDelta,
      toolClicks,
      getElementsInContainer,
      clearCurrentTool,
      selectedElements,
      addToolClick,
      addSelectedElements,
      removeSelectedElements,
      findNearbyPoints,
      startEditingElements,
      setSelectedPoints,
      // setSelectedElements,
      setTool,
    ]
  )

  return handleSelectCmd
}

export default useSelectCommand
