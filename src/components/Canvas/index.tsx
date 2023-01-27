import React, { useCallback, useEffect, useLayoutEffect, WheelEvent, MouseEvent } from 'react'

import useForm from '../../hooks/useForm'
import Navbar from '../Navbar/index'
import ToolInputMapper from '../ToolInputMapper/index'

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants'
import useKeyPressCommands from '../../commands/keyPress/index'
import useMouseClickCommands from '../../commands/mouseClick/index'
import useDrawing from '../../hooks/useDrawing'
import useMouseMoveCommands from '../../commands/mouseMove/index'
import useElementsStore from '../../stores/elements/index'
import Polyline from '../../drawingElements/polyline'
import { useToolsStore } from '../../stores/tools/index'
import { FullyDefinedElement } from '../../drawingElements/element'

const Canvas = () => {
  const elementsStore = useElementsStore()
  const elements = elementsStore(state => state.elements)
  const currentlyCreatedElement = elementsStore(state => state.currentlyCreatedElement)
  const currentlyEditedElements = elementsStore(state => state.currentlyEditedElements)
  const currentlyCopiedElements = elementsStore(state => state.currentlyCopiedElements)
  const snappedPoint = elementsStore(state => state.snappedPoint)
  const isReplacingElement = elementsStore(state => state.isReplacingElement)
  const selectedElements = elementsStore(state => state.selectedElements)
  const selectedPoints = elementsStore(state => state.selectedPoints)
  const hasSelectedElement = elementsStore(state => state.hasSelectedElement)

  const toolsStore = useToolsStore()
  const tool = toolsStore(state => state.tool)
  const setMouseDrag = toolsStore(state => state.setMouseDrag)
  const zoomView = toolsStore(state => state.zoomView)

  const {
    drawElement,
    drawSelectedElement,
    drawReplacedElements,
    drawSelectionPoints,
    drawSnappedPoint,
    resetCanvas,
    drawToolComponents
  } = useDrawing()

  const executeKeyPressCommand = useKeyPressCommands()
  const executeMouseClickCommand = useMouseClickCommands()
  const executeMouseMoveCommand = useMouseMoveCommands()

  const [inputValues, setInputValue] = useForm({})

  useLayoutEffect(() => {
    resetCanvas()

    elements.forEach(e => {
      if (e.isShown && !hasSelectedElement(e) && !isReplacingElement(e)) {
        drawElement(e)
      }

      // const bb = e.getBoundingBox()
      // drawElement(new Line({ x: bb.left, y: bb.top }, { pointB: { x: bb.left, y: bb.bottom } }), false, { color: 'red' })
      // drawElement(new Line({ x: bb.left, y: bb.bottom }, { pointB: { x: bb.right, y: bb.bottom } }), false, { color: 'red' })
      // drawElement(new Line({ x: bb.right, y: bb.bottom }, { pointB: { x: bb.right, y: bb.top } }), false, { color: 'red' })
      // drawElement(new Line({ x: bb.right, y: bb.top }, { pointB: { x: bb.left, y: bb.top } }), false, { color: 'red' })
    })

    drawReplacedElements()

    if (currentlyCreatedElement && currentlyCreatedElement.isFullyDefined) {
      if (
        currentlyCreatedElement instanceof Polyline &&
        !currentlyCreatedElement.elements[currentlyCreatedElement.elements.length - 1].isFullyDefined
      ) {
        for (let i = 0; i < currentlyCreatedElement.elements.length - 1; i++) {
          drawElement(currentlyCreatedElement.elements[i])
        }
      } else {
        drawElement(currentlyCreatedElement as FullyDefinedElement)
      }
    }

    // canvasElements.forEach(element => draw(context.current, element, currentScale))

    if (snappedPoint) {
      drawSnappedPoint()
    }

    if (currentlyCopiedElements) {
      currentlyCopiedElements.current.forEach(cce => drawElement(cce as FullyDefinedElement))
      currentlyCopiedElements.positioned.forEach(cce => drawElement(cce as FullyDefinedElement))
    }

    drawToolComponents()

    if (!selectedElements) {
      return
    }

    selectedElements.forEach(selectedElement => {
      if (!selectedElement.isShown) {
        return
      }

      drawSelectedElement(selectedElement)

      const selectionPoints = selectedElement.getSelectionPoints()
      drawSelectionPoints(selectionPoints)
    })

    if (!currentlyEditedElements) {
      return
    }

    currentlyEditedElements.forEach(cee => {
      drawElement(cee, { forceHidden: false })
    })
  }, [
    elements,
    currentlyCreatedElement,
    currentlyCopiedElements,
    selectedElements,
    selectedPoints,
    currentlyEditedElements,
    hasSelectedElement,
    isReplacingElement,
    snappedPoint,
    drawElement,
    drawReplacedElements,
    drawSelectedElement,
    drawSelectionPoints,
    drawSnappedPoint,
    drawToolComponents,
    resetCanvas,
    tool.type
  ])

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    executeKeyPressCommand(event)
  },
  [executeKeyPressCommand])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  const handleMouseWheel = (event: WheelEvent) => {
    const { deltaY } = event
    const { clientX, clientY } = event

    if (deltaY !== 0) {
      zoomView(clientX, clientY, deltaY > 0)
    }
  }

  const handleMouseDown = (event: MouseEvent) => {
    switch (event.button) {
      case 0:
        executeMouseClickCommand(event)
        break
      case 1:
        setMouseDrag([event.clientX, event.clientY])
        break
      default:
        return
    }
  }

  // const changeTool = tool => {
  //   if (currentlyCreatedElement) {
  //       removeCurrentlyCreatedElement()
  //   }

  //   if (currentlyEditedElements) {
  //       const newSelectedElements = [...selectedElements]
  //       newSelectedElements.forEach(se => (se.isShown = true))
  //       setSelectedElements(newSelectedElements)
  //       stopEditingElements()
  //   }

  //   setTool(tool)

  //   if (tool.type !== 'transform' && tool.type !== 'copy' && tool.type !== 'trim') {
  //       clearSelection()
  //   }
  // }
    
  return (<>
    <canvas
      // className={styles.canvas}
      id='canvas'
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      // onClick={executeMouseClickCommand}
      onAuxClick={() => setMouseDrag(null)}
      onMouseDown={handleMouseDown}
      onWheel={handleMouseWheel}
      onMouseMove={executeMouseMoveCommand}
      // onMouseDown={handleMouseDown}
      // onMouseUp={handleMouseUp}
    >
      Canvas
    </canvas>
    <Navbar />

    {tool ? (
      <ToolInputMapper
        inputValues={inputValues}
        setInputValue={setInputValue}
        toolName={tool.name}
      />
    ) : null}
  </>)
}

export default Canvas
