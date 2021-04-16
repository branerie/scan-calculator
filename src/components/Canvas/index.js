import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import useElementsHistory from '../../hooks/useElementsHistory'
import useForm from '../../hooks/useForm'
import Navbar from '../Navbar'
import ToolInputMapper from '../ToolInputMapper'

import { createEditedElement, createElement, createPoint } from '../../utils/elementFactory'
import ElementManipulator from '../../utils/elementManipulator'
import { CANVAS_WIDTH, CANVAS_HEIGHT, SELECT_DELTA } from '../../utils/constants'
import { draw, drawSnappingPoints } from '../../utils/canvas'
import { getPointDistance } from '../../utils/point'

let groupId = 1
// const manipulator = new ElementManipulator()

const Canvas = () => {
    const {
        elements,
        setElements,
        selectedElements,
        setSelectedElements,
        selectedPoints,
        setSelectedPoints,
        currentlyCreatedElement,
        setCurrentlyCreatedElement,
        currentlyEditedElements,
        setCurrentlyEditedElements,
        clearSelection,
        addElement,
        editElements,
        deleteElement,
        findNearbyPoints,
        undo,
        redo
    } = useElementsHistory([])

    const [tool, setTool] = useState({ type: 'draw', name: 'line' })
    const [inputValues, setInputValue] = useForm({})

    // const [isUsingTool, setIsUsingTool] = useState(false)

    useLayoutEffect(() => {
        const canvas = document.getElementById('canvas')
        const context = canvas.getContext('2d')
        context.clearRect(0, 0, context.canvas.width, context.canvas.height)

        let canvasElements = elements.filter(e => e.isShown)

        if (currentlyCreatedElement && currentlyCreatedElement.isFullyDefined) {
            canvasElements.push(currentlyCreatedElement)
        }

        if (currentlyEditedElements) {
            canvasElements = canvasElements.concat(currentlyEditedElements)
        }

        canvasElements.forEach(element => draw(context, element))

        if (!selectedElements) return

        const elementsWithHighlightedPoints = selectedElements.concat(currentlyEditedElements || [])
        elementsWithHighlightedPoints.forEach(selectedElement => {
            if (!selectedElement.isShown) return

            const snappingPoints = selectedElement.getSnappingPoints()
            drawSnappingPoints(context, snappingPoints, selectedPoints)
        })
    }, [elements, currentlyCreatedElement, selectedElements, selectedPoints, currentlyEditedElements])

    const handleKeyPress = useCallback((event) => {
        if (event.metaKey || event.ctrlKey) {
            if (event.key === 'z') {
                undo()
            } else if (event.key === 'y') {
                redo()
            }

            return
        }

        if (event.keyCode === 27) { // escape
            if (currentlyCreatedElement) {
                if (currentlyCreatedElement.baseType === 'polyline' && currentlyCreatedElement.elements.length > 1) {
                    currentlyCreatedElement.elements.pop()

                    return
                }

                return setCurrentlyCreatedElement(null)
            }

            if (currentlyEditedElements) {
                selectedElements.forEach(e => e.isShown = true)
                setCurrentlyEditedElements(null)
                setElements([...elements])
                return setSelectedPoints(null)
            }

            if (selectedElements && selectedElements.length > 0) {
                clearSelection()
            }
        } else if (event.keyCode === 13) { // enter
            if (currentlyCreatedElement && currentlyCreatedElement.baseType === 'polyline') {
                if (currentlyCreatedElement.type === 'polyline') {
                    currentlyCreatedElement.elements.pop()
                }

                currentlyCreatedElement.elements.forEach(e => e.id = uuidv4())
                addElement(currentlyCreatedElement)

                setCurrentlyCreatedElement(null)
            }
        } else if (event.keyCode === 46) { // delete
            if (!selectedElements || selectedElements.length === 0 || selectedPoints) return

            for (const selectedElement of selectedElements) {
                deleteElement(selectedElement.id)
            }

            clearSelection()
        }
    },
        [
            currentlyCreatedElement,
            currentlyEditedElements,
            selectedElements,
            selectedPoints,
            setCurrentlyCreatedElement,
            setCurrentlyEditedElements,
            setElements,
            elements,
            setSelectedPoints,
            clearSelection,
            addElement,
            deleteElement,
            undo,
            redo
        ])

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress)
        return () => document.removeEventListener('keydown', handleKeyPress)
    }, [handleKeyPress])

    const handleMouseClick = (event) => {
        const { clientX, clientY } = event
        const clickedPoint = createPoint(clientX, clientY)
        if (tool.type === 'draw') {
            if (currentlyCreatedElement) {

                if (currentlyCreatedElement.isFullyDefined && currentlyCreatedElement.type !== 'polyline') {
                    addElement(currentlyCreatedElement)

                    setCurrentlyCreatedElement(null)
                    return
                }

                return currentlyCreatedElement.defineNextAttribute(clickedPoint)
            }

            const newGroupId = tool.name === 'polyline' || tool.name === 'rectangle' ? groupId++ : null
            const newElement = createElement(tool.name, clientX, clientY, newGroupId)
            setCurrentlyCreatedElement(newElement)
        } else if (tool.type === 'select') {
            if (currentlyEditedElements) {
                return editElements(currentlyEditedElements)
            }

            if (event.shiftKey) {
                const newlySelectedElements = selectedElements.filter(e => !e.checkIfPointOnElement(clickedPoint))
                setSelectedElements(newlySelectedElements)
                return
            }

            if (selectedElements && selectedElements.length > 0) {
                const nearbyPoints = findNearbyPoints(clientX, clientY, SELECT_DELTA)

                const selectedPoints = []
                const editedElements = []
                for (const point of nearbyPoints) {
                    const editedElement = selectedElements.find(se => se.getPointById(point.pointId))
                    if (editedElement) {
                        selectedPoints.push(point)
                        const copiedElement = ElementManipulator.copyElement(editedElement, true)
                        editedElements.push(copiedElement)
                        editedElement.isShown = false
                    }
                }

                if (editedElements.length > 0) {
                    setSelectedPoints(selectedPoints)
                    setCurrentlyEditedElements(editedElements)
                    setElements([...elements])
                    return
                }
            }

            const oldSelectedElements = selectedElements || []
            const newlySelectedElements = elements.filter(e =>
                e.checkIfPointOnElement(clickedPoint) &&
                !oldSelectedElements.some(se => se.id === e.id))
            setSelectedElements([...oldSelectedElements, ...newlySelectedElements])
        }
    }

    const handleMouseMove = (event) => {
        if (!currentlyEditedElements && !currentlyCreatedElement) return

        const { clientX, clientY } = event

        if (currentlyEditedElements && selectedPoints) {
            const newCurrentlyEditedElements = []
            for (const editedElement of currentlyEditedElements) {
                for (const selectedPoint of selectedPoints) {
                    const movedPoint = editedElement.getPointById(selectedPoint.pointId)
                    if (!movedPoint) continue

                    const dX = clientX - movedPoint.x
                    const dY = clientY - movedPoint.y

                    if (selectedPoint.pointType === 'midPoint') {
                        switch (editedElement.baseType) {
                            case 'line':
                                editedElement.move(dX, dY)
                                break
                            case 'polyline':
                                editedElement.stretchByMidPoint(dX, dY, selectedPoint.pointId)
                                break
                            case 'arc':
                                const newRadius = getPointDistance(editedElement.centerPoint, { x: clientX, y: clientY })
                                editedElement.setRadius(newRadius)
                                break
                            default:
                                // should not reach here
                                break
                        }

                        continue
                    }

                    if (selectedPoint.pointType === 'center') {
                        editedElement.move(dX, dY)
                    }

                    editedElement.setPointById(selectedPoint.pointId, clientX, clientY)
                }

                newCurrentlyEditedElements.push(editedElement)
            }

            setCurrentlyEditedElements(newCurrentlyEditedElements)
        }

        // should only enter if currentlyCreatedElement is defined and has all but its last attribute set
        if (!currentlyCreatedElement || !currentlyCreatedElement.isAlmostDefined) return

        const newCurrentlyCreatedElement = createEditedElement(currentlyCreatedElement)

        newCurrentlyCreatedElement.setLastAttribute(clientX, clientY)
        setCurrentlyCreatedElement(newCurrentlyCreatedElement)
    }

    return (
        <>
            <canvas
                // className={styles.canvas}
                id='canvas'
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleMouseClick}
                onMouseMove={handleMouseMove}

            // onMouseDown={handleMouseDown}
            // onMouseUp={handleMouseUp}
            >
                Canvas
            </canvas>
            <Navbar
                tool={tool}
                setTool={setTool}
            />

            { tool &&
                <ToolInputMapper inputValues={inputValues} setInputValue={setInputValue} toolName={tool.name} />
            }
        </>
    )
}

export default Canvas