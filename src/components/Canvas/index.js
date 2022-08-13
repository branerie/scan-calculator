import React, { useCallback, useEffect, useLayoutEffect } from 'react'
import { useAppContext } from '../../contexts/AppContext'

import useForm from '../../hooks/useForm'
import Navbar from '../Navbar'
import ToolInputMapper from '../ToolInputMapper'

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants'
import useKeyPressCommands from '../../commands/keyPress'
import useMouseClickCommands from '../../commands/mouseClick'
import useDrawing from '../../hooks/useDrawing'
import useMouseMoveCommands from '../../commands/mouseMove'

const Canvas = () => {
    const {
        elements: {
            elements,
            currentlyCreatedElement,
            currentlyEditedElements,
            currentlyCopiedElements,
            snappedPoint,
            isReplacingElement,
            selection: {
                selectedElements,
                selectedPoints,
                hasSelectedElement,
            }
        },
        tools: { 
            currentTranslate, 
            currentScale, 
            tool, 
            setTool, 
            zoomView, 
            setMouseDrag 
        }
    } = useAppContext()

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
                currentlyCreatedElement.type === 'polyline' &&
                !currentlyCreatedElement.elements[currentlyCreatedElement.elements.length - 1].isFullyDefined
            ) {
                for (let i = 0; i < currentlyCreatedElement.elements.length - 1; i++) {
                    drawElement(currentlyCreatedElement.elements[i])
                }
            } else {
                drawElement(currentlyCreatedElement)
            }
        }

        // canvasElements.forEach(element => draw(context.current, element, currentScale))

        if (snappedPoint) {
            drawSnappedPoint()
        }

        if (currentlyCopiedElements) {
            currentlyCopiedElements.forEach(cce => drawElement(cce))
        }

        drawToolComponents()

        if (!selectedElements) return

        selectedElements.forEach(selectedElement => {
            if (!selectedElement.isShown) return

            drawSelectedElement(selectedElement)

            const selectionPoints = selectedElement.getSelectionPoints()
            drawSelectionPoints(selectionPoints)
        })

        if (!currentlyEditedElements) return

        currentlyEditedElements.forEach(cee => {
            drawElement(cee, false)
        })
    }, [
        elements,
        currentlyCreatedElement,
        currentlyCopiedElements,
        selectedElements,
        selectedPoints,
        currentlyEditedElements,
        currentTranslate,
        currentScale,
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

    const handleKeyPress = useCallback(
        event => {
            executeKeyPressCommand(event)
        },
        [executeKeyPressCommand]
    )

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress)
        return () => {
            document.removeEventListener('keydown', handleKeyPress)
        }
    }, [handleKeyPress])

    const handleMouseWheel = event => {
        const { deltaY } = event
        const { clientX, clientY } = event

        if (deltaY !== 0) {
            zoomView(clientX, clientY, deltaY > 0)
        }
    }

    const handleMouseDown = event => {
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
    //     if (currentlyCreatedElement) {
    //         removeCurrentlyCreatedElement()
    //     }

    //     if (currentlyEditedElements) {
    //         const newSelectedElements = [...selectedElements]
    //         newSelectedElements.forEach(se => (se.isShown = true))
    //         setSelectedElements(newSelectedElements)
    //         stopEditingElements()
    //     }

    //     setTool(tool)

    //     if (tool.type !== 'transform' && tool.type !== 'copy' && tool.type !== 'trim') {
    //         clearSelection()
    //     }
    // }
    
    return (
        <>
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
            <Navbar tool={tool} changeTool={setTool} />

            {tool && (
                <ToolInputMapper
                    inputValues={inputValues}
                    setInputValue={setInputValue}
                    toolName={tool.name}
                />
            )}
        </>
    )
}

export default Canvas
