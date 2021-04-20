import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'

import useElementsHistory from '../../hooks/useElementsHistory'
import useForm from '../../hooks/useForm'
import Navbar from '../Navbar'
import ToolInputMapper from '../ToolInputMapper'

import { createElement, createPoint } from '../../utils/elementFactory'
import ElementManipulator from '../../utils/elementManipulator'
import { CANVAS_WIDTH, CANVAS_HEIGHT, SELECT_DELTA, SNAP_DELTA, MAX_NUM_ERROR } from '../../utils/constants'
import { draw, drawSelectionPoints, drawSnappedPoint } from '../../utils/canvas'
import { getPointDistance } from '../../utils/point'
import { useMainContext } from '../../MainContext'

let groupId = 1
const VIEW_ZOOM_STEP_UP = 1.2
const VIEW_ZOOM_STEP_DOWN = 1 / 1.2
const VIEW_ZOOM_MAX_SCALE = VIEW_ZOOM_STEP_UP ** 15
const VIEW_ZOOM_MIN_SCALE = VIEW_ZOOM_STEP_DOWN ** 15

const Canvas = () => {
    const {
        elements,
        setElements,
        currentlyCreatedElement,
        setCurrentlyCreatedElement,
        currentlyEditedElements,
        setCurrentlyEditedElements,
        addElement,
        editElements,
        deleteElement,
        findNearbyPoints,
        undo,
        redo
    } = useElementsHistory([])

    const [tool, setTool] = useState({ type: 'draw', name: 'line' })
    const [inputValues, setInputValue] = useForm({})
    const { 
        currentTranslate, 
        setCurrentTranslate, 
        currentScale, 
        setCurrentScale,
        selectedElements, 
        addSelectedElements, 
        setSelectedElements,
        hasSelectedElement,
        selectedPoints, 
        setSelectedPoints,
        clearSelectedPoints,
        clearSelection
    } = useMainContext()
    const [options, setOptions] = useState({ snap: true, ortho: false })
    const [snappedPoint, setSnappedPoint] = useState(null)
    const context = useRef(null)
    const mouseDrag = useRef(null)

    const getAbsoluteMouseCoordinates = (event) => {
        const { clientX, clientY } = event
        const [translateX, translateY] = currentTranslate

        return [(clientX - translateX) / currentScale, (clientY - translateY) / currentScale]
    }

    const panView = useCallback((startX, startY, endX, endY) => {
        const deltaX = endX - startX
        const deltaY = endY - startY
        // context.current.translate(deltaX, deltaY)

        const [currentTranslateX, currentTranslateY] = currentTranslate
        setCurrentTranslate([currentTranslateX + deltaX, currentTranslateY + deltaY])

        mouseDrag.current = [endX, endY]
    }, [currentTranslate, setCurrentTranslate])

    const zoomView = useCallback((centerX, centerY, isZoomOut) => {
        const scaleStep = isZoomOut ? VIEW_ZOOM_STEP_DOWN : VIEW_ZOOM_STEP_UP

        const newScale = Math.min(Math.max(currentScale * scaleStep, VIEW_ZOOM_MIN_SCALE), VIEW_ZOOM_MAX_SCALE)
        if (Math.abs(currentScale - newScale) < MAX_NUM_ERROR ) return

        const [currentTranslateX, currentTranslateY] = currentTranslate
        const newCenterX = centerX - currentTranslateX
        const newCenterY = centerY - currentTranslateY
        const dX = (1 - scaleStep) * newCenterX
        const dY = (1 - scaleStep) * newCenterY
        
        setCurrentScale(newScale)
        setCurrentTranslate([(currentTranslateX + dX), (currentTranslateY + dY)])
        return
    }, [currentScale, currentTranslate, setCurrentScale, setCurrentTranslate])

    // const [isUsingTool, setIsUsingTool] = useState(false)

    useLayoutEffect(() => {
        const canvas = document.getElementById('canvas')
        context.current = canvas.getContext('2d')
        context.current.save()
    }, [])

    useLayoutEffect(() => {
        context.current.resetTransform()

        context.current.clearRect(0, 0, context.current.canvas.width, context.current.canvas.height)

        context.current.translate(currentTranslate[0], currentTranslate[1])
        context.current.scale(currentScale, currentScale)

        let canvasElements = elements.filter(e => e.isShown && !hasSelectedElement(e))

        if (currentlyCreatedElement && currentlyCreatedElement.isFullyDefined) {
            canvasElements.push(currentlyCreatedElement)
        }

        canvasElements.forEach(element => draw(context.current, element, currentScale))

        if (!selectedElements) return

        const elementsWithHighlightedPoints = selectedElements.concat(currentlyEditedElements || [])
        elementsWithHighlightedPoints.forEach(selectedElement => {
            if (!selectedElement.isShown) return

            draw(context.current, selectedElement, currentScale, true)

            const selectionPoints = selectedElement.getSelectionPoints()
            drawSelectionPoints(context.current, selectionPoints, selectedPoints, currentScale)
        })

        if (snappedPoint) {
            drawSnappedPoint(context.current, snappedPoint, currentScale)
        }
    }, 
    [
        elements, 
        currentlyCreatedElement, 
        selectedElements, 
        selectedPoints, 
        currentlyEditedElements, 
        currentTranslate,
        currentScale,
        hasSelectedElement,
        snappedPoint
    ])

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

                setSnappedPoint(null)
                return setCurrentlyCreatedElement(null)
            }

            if (currentlyEditedElements) {
                selectedElements.forEach(e => e.isShown = true)
                setCurrentlyEditedElements(null)
                setElements([...elements])
                setSnappedPoint(null)
                return clearSelectedPoints()
            }

            if (selectedElements && selectedElements.length > 0) {
                clearSelection()
            }

            setSnappedPoint(null)
        } else if (event.keyCode === 13) { // enter
            if (currentlyCreatedElement && currentlyCreatedElement.baseType === 'polyline') {
                if (currentlyCreatedElement.type === 'polyline') {
                    currentlyCreatedElement.elements.pop()
                }

                setSnappedPoint(null)

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
            undo, 
            redo, 
            currentlyCreatedElement, 
            currentlyEditedElements, 
            selectedElements, 
            setCurrentlyCreatedElement, 
            setCurrentlyEditedElements, 
            setElements, 
            elements, 
            clearSelectedPoints, 
            clearSelection, 
            addElement, 
            selectedPoints, 
            deleteElement
        ]
    )

    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress)
        return () => document.removeEventListener('keydown', handleKeyPress)
    }, [handleKeyPress])

    const handleMouseMiddleClick = () => {
        mouseDrag.current = null
    }

    const handleMouseClick = (event) => {
        const [clientX, clientY] = getAbsoluteMouseCoordinates(event)

        const clickedPoint = createPoint(clientX, clientY)
        if (tool.type === 'draw') {
            if (currentlyCreatedElement) {

                if (currentlyCreatedElement.isFullyDefined && currentlyCreatedElement.type !== 'polyline') {
                    setSnappedPoint(null)
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
                const newlySelectedElements = selectedElements.filter(e => 
                    !e.checkIfPointOnElement(clickedPoint, SELECT_DELTA / currentScale))
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

                    // setElements([...elements])
                    setSelectedElements([...selectedElements])
                    return
                }
            }

            const newlySelectedElements = elements.filter(e =>
                e.checkIfPointOnElement(clickedPoint, SELECT_DELTA / currentScale))
            addSelectedElements(newlySelectedElements)
        }
    }

    const handleMouseMove = (event) => {
        if (mouseDrag.current && event.buttons === 4) {
            const { clientX, clientY } = event
            return panView(mouseDrag.current[0], mouseDrag.current[1], clientX, clientY)
        }

        const [clientX, clientY] = getAbsoluteMouseCoordinates(event)
        if (options.snap) {
            let nearbyPoints = findNearbyPoints(clientX, clientY, SNAP_DELTA / currentScale)
            if (currentlyEditedElements) {
                nearbyPoints = nearbyPoints.filter(nbp => 
                    !currentlyEditedElements.some(cee => cee.getPointById(nbp.pointId)))
            }
            
            const clickedPoint = createPoint(clientX, clientY)

            let nearestSnappingPoint = nearbyPoints.length > 0 ? nearbyPoints[0] : null
            let nearestDistance = nearestSnappingPoint ? getPointDistance(clickedPoint, nearestSnappingPoint) : null
            for (let pointIndex = 1; pointIndex < nearbyPoints.length; pointIndex++) {
                const nearbyPoint = nearbyPoints[pointIndex]
                const nearbyPointDistance = getPointDistance(clickedPoint, nearbyPoint)

                if (nearbyPointDistance < nearestDistance) {
                    nearestSnappingPoint = nearbyPoint
                    nearestDistance = nearbyPointDistance
                }
            }

            setSnappedPoint(nearestSnappingPoint)
        }

        if (!currentlyEditedElements && !currentlyCreatedElement) return

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
                                editedElement.radius = newRadius
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

        // should only pass through if currentlyCreatedElement is defined and has all but its last attribute set
        if (!currentlyCreatedElement || !currentlyCreatedElement.isAlmostDefined) return

        const newCurrentlyCreatedElement = ElementManipulator.copyElement(currentlyCreatedElement, true)
        newCurrentlyCreatedElement.setLastAttribute(clientX, clientY)

        setCurrentlyCreatedElement(newCurrentlyCreatedElement)
    }

    const handleMouseWheel = (event) => {
        const { deltaY } = event
        const { clientX, clientY } = event

        if (deltaY !== 0) {
            zoomView(clientX, clientY, deltaY > 0)
        }
    }

    return (
        <>
            <canvas
                // className={styles.canvas}
                id='canvas'
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                onClick={handleMouseClick}
                onAuxClick={handleMouseMiddleClick}
                onMouseDown={(event) => {
                    if (event.button === 1) {
                        mouseDrag.current = [event.clientX, event.clientY]
                    }
                }}
                onWheel={handleMouseWheel}
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