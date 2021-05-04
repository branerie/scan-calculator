import React, { useCallback, useEffect, useLayoutEffect } from 'react'

import useForm from '../../hooks/useForm'
import Navbar from '../Navbar'
import ToolInputMapper from '../ToolInputMapper'

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../utils/constants'
import { useToolsContext } from '../../contexts/ToolsContext'
import { useElementsContext } from '../../contexts/ElementsContext'
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
            removeCurrentlyCreatedElement,
            stopEditingElements,
        },
        selection: {
            selectedElements,
            selectedPoints, 
            setSelectedElements,
            hasSelectedElement,
            clearSelection,
        }
    } = useElementsContext()

    const { 
        currentTranslate, 
        currentScale, 
        tool,
        setTool,
        zoomView,
        setMouseDrag
    } = useToolsContext()

    const { drawElement, drawSelectionPoints, drawSnappedPoint, resetCanvas } = useDrawing()

    const executeKeyPressCommand = useKeyPressCommands()
    const executeMouseClickCommand = useMouseClickCommands()
    const executeMouseMoveCommand = useMouseMoveCommands()
    
    const [inputValues, setInputValue] = useForm({})

    useLayoutEffect(() => {
        resetCanvas()

        elements.forEach(e => {
            if (e.isShown && !hasSelectedElement(e)) {
                drawElement(e, false)
            }
        })

        if (currentlyCreatedElement && currentlyCreatedElement.isFullyDefined) {
            drawElement(currentlyCreatedElement)
        }

        // canvasElements.forEach(element => draw(context.current, element, currentScale))

        if (snappedPoint) {
            drawSnappedPoint()
        }

        if (currentlyCopiedElements) {
            currentlyCopiedElements.forEach(cce => drawElement(cce, false))
        }

        if (!selectedElements) return

        const elementsWithHighlightedPoints = selectedElements.concat(currentlyEditedElements || [])
        elementsWithHighlightedPoints.forEach(selectedElement => {
            if (!selectedElement.isShown) return

            drawElement(selectedElement, true)

            const selectionPoints = selectedElement.getSelectionPoints()
            drawSelectionPoints(selectionPoints)
        })
    }, 
    [
        elements, 
        currentlyCreatedElement,
        currentlyCopiedElements,
        selectedElements, 
        selectedPoints, 
        currentlyEditedElements, 
        currentTranslate,
        currentScale,
        hasSelectedElement,
        snappedPoint,
        drawElement,
        drawSelectionPoints,
        drawSnappedPoint,
        resetCanvas
    ])

    const handleKeyPress = useCallback((event) => {
        executeKeyPressCommand(event)
    }, [executeKeyPressCommand])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress)
        return () => document.removeEventListener('keydown', handleKeyPress)
    }, [handleKeyPress])

    const handleMouseWheel = (event) => {
        const { deltaY } = event
        const { clientX, clientY } = event

        if (deltaY !== 0) {
            zoomView(clientX, clientY, deltaY > 0)
        }
    }

    const handleMouseDown = (event) => {
        if (event.button === 1) {
            setMouseDrag([event.clientX, event.clientY])
        }
    }

    const changeTool = (tool) => {
        if (currentlyCreatedElement) {
            removeCurrentlyCreatedElement()
        }

        if (currentlyEditedElements) {
            const newSelectedElements = [...selectedElements]
            newSelectedElements.forEach(se => se.isShown = true)
            setSelectedElements(newSelectedElements)
            stopEditingElements()
        }

        setTool(tool)

        if (tool.type !== 'transform' && tool.type !== 'copy') {
            clearSelection()
        }
    }

    return (
        <>
            <canvas
                // className={styles.canvas}
                id='canvas'
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={executeMouseClickCommand}
                onAuxClick={() => setMouseDrag(null)}
                onMouseDown={handleMouseDown}
                onWheel={handleMouseWheel}
                onMouseMove={executeMouseMoveCommand}

            // onMouseDown={handleMouseDown}
            // onMouseUp={handleMouseUp}
            >
                Canvas
            </canvas>
            <Navbar
                tool={tool}
                changeTool={changeTool}
            />

            { tool &&
                <ToolInputMapper inputValues={inputValues} setInputValue={setInputValue} toolName={tool.name} />
            }
            <ul id="clicks"></ul>
        </>
    )
}

export default Canvas