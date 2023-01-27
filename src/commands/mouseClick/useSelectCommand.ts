import { useCallback, MouseEvent } from 'react'
import { ElementWithId } from '../../drawingElements/element'
import Point from '../../drawingElements/point'
import useElementsStore from '../../stores/elements/index'
import { useToolsStore } from '../../stores/tools/index'

const useSelectCommand = () => {
  const elementsStore = useElementsStore()
  const startEditingElements = elementsStore(state => state.startEditingElements)
  const getElementsContainingPoint = elementsStore(state => state.getElementsContainingPoint)
  const getElementsInContainer = elementsStore(state => state.getElementsInContainer)
  const selectedElements = elementsStore(state => state.selectedElements)
  const addSelectedElements = elementsStore(state => state.addSelectedElements)
  // const setSelectedElements = elementsStore(state => state.setSelectedElements)
  const setSelectedPoints = elementsStore(state => state.setSelectedPoints)
  const removeSelectedElements = elementsStore(state => state.removeSelectedElements)
  const findNearbyPoints = elementsStore(state => state.findNearbyPoints)

  const toolsStore = useToolsStore()
  const toolClicks = toolsStore(state => state.toolClicks)
  const setTool = toolsStore(state => state.setTool)
  const getSelectDelta = toolsStore(state => state.getSelectDelta)
  const addToolClick = toolsStore(state => state.addToolClick)
  const clearCurrentTool = toolsStore(state => state.clearCurrentTool)

  const handleSelectCmd = useCallback((event: MouseEvent, clickedPoint: Point) => {
    const selectDelta = getSelectDelta()
    if (selectedElements && selectedElements.size > 0) {
      const nearbyPoints = findNearbyPoints(clickedPoint.x, clickedPoint.y, selectDelta)

      const selectedPoints = []
      const editedElements = []
      for (const point of nearbyPoints) {
        const editedElement = Array.from(
          selectedElements.values()
        ).find(se => se.getPointById(point.pointId))

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

    const clickedElements = getElementsContainingPoint(
      clickedPoint.x, 
      clickedPoint.y, 
      { maxPointsDiff: selectDelta }
    )

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
      shouldSkipPartial: initialClick.x < clickedPoint.x
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
  }, [
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
    setTool
  ])

  return handleSelectCmd
}

export default useSelectCommand
