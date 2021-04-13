import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'

import useElementsHistory from '../../hooks/useElementsHistory'
import useForm from '../../hooks/useForm'
import Navbar from '../Navbar'
import ToolInputMapper from '../ToolInputMapper'

import { createEditedElement, createElement, createPoint, getRoughElements } from '../../utils/elementFactory'

import { CANVAS_WIDTH, CANVAS_HEIGHT, SELECT_DELTA } from '../../utils/constants'

let groupId = 1

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
        findNearbyPoints
    } = useElementsHistory([])

    const [tool, setTool] = useState({ type: 'draw', name: 'line' })
    const [inputValues, setInputValue] = useForm({})

    // const [isUsingTool, setIsUsingTool] = useState(false)

    useLayoutEffect(() => {
        const canvas = document.getElementById('canvas')
        const context = canvas.getContext('2d')
        context.clearRect(0, 0, canvas.width, canvas.height)

        const roughCanvas = rough.canvas(canvas)

        let roughElements = getRoughElements(elements.filter(e => e.isShown))
        // roughElements.forEach(element => roughCanvas.draw(element))

        if (currentlyCreatedElement && currentlyCreatedElement.isFullyDefined) {
            const roughElementsParam = currentlyCreatedElement.type === 'polyline'
                ? currentlyCreatedElement.elements
                : [currentlyCreatedElement]

            const createdRoughElements = getRoughElements(roughElementsParam)
            roughElements = roughElements.concat(createdRoughElements)
            // roughElements.forEach((roughElement) => roughCanvas.draw(roughElement))
        }

        if (currentlyEditedElements) {
            const editedElements = []
            for (const editedElement of currentlyEditedElements) {
                const roughElementsParam = editedElement.type === 'polyline'
                        ? editedElement.elements
                        : [editedElement]
                
                editedElements.push(roughElementsParam)
            }

            const editedRoughElements = getRoughElements(editedElements.flat())
            roughElements = roughElements.concat(editedRoughElements)
        }

        roughElements.forEach(roughElement => roughCanvas.draw(roughElement))

        if (!selectedElements) return

        const elementsWithHighlightedPoints = selectedElements.concat(currentlyEditedElements || [])
        elementsWithHighlightedPoints.forEach(selectedElement => {
            if (!selectedElement.isShown) return

            const { endPoints } = selectedElement.getSnappingPoints()

            endPoints.forEach(endPoint => {
                let pointFill = 'blue'
                if (selectedPoints && 
                    selectedPoints.some(p => p.leafValue === endPoint.x && p.y === endPoint.y && p.id === endPoint.id)) {
                    pointFill = 'red'
                }

                roughCanvas.rectangle(
                    endPoint.x - 4,
                    endPoint.y - 4, 8, 8,
                    {
                        fill: pointFill,
                        fillStyle: 'solid',
                        strokeWidth: 1,
                        roughness: 0
                    }
                )
            })
        })
    }, [elements, currentlyCreatedElement, selectedElements, selectedPoints, currentlyEditedElements])

    const handleKeyPress = useCallback((event) => {
        if (event.keyCode === 27) { // escape
            if (currentlyCreatedElement) {
                if (currentlyCreatedElement.type === 'polyline' && currentlyCreatedElement.elements.length > 1) {
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
            if (currentlyCreatedElement && currentlyCreatedElement.type === 'polyline') {
                currentlyCreatedElement.elements.pop()
                addElement(currentlyCreatedElement)

                setCurrentlyCreatedElement(null)
            }
        } else if (event.keyCode === 46) { // delete
            if (!selectedElements || selectedElements.length === 0) return

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
        setCurrentlyCreatedElement, 
        setCurrentlyEditedElements,
        setElements, 
        elements, 
        setSelectedPoints, 
        clearSelection, 
        addElement, 
        deleteElement
    ])


    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress)
        return () => document.removeEventListener('keydown', handleKeyPress)
    }, [handleKeyPress])

    // useEffect(() => {
    //     const undoRedoFunction = event => {
    //         if (event.metaKey || event.ctrlKey) {
    //             if (event.key === 'z') {
    //                 undo()
    //             } else if (event.key === 'y') {
    //                 redo()
    //             }
    //         }
    //     }

    //     document.addEventListener('keydown', undoRedoFunction)
    //     return () => {
    //         document.removeEventListener('keydown', undoRedoFunction)
    //     }
    // }, [undo, redo])

    const handleMouseClick = (event) => {
        if (!tool) {
            // TODO: Handle element select
            return
        }

        const { clientX, clientY } = event
        const clickedPoint = createPoint(clientX, clientY)
        if (tool.type === 'draw') {
            if (currentlyCreatedElement) {

                if (currentlyCreatedElement.isFullyDefined && currentlyCreatedElement.type !== 'polyline') {
                    addElement(currentlyCreatedElement)

                    setCurrentlyCreatedElement(null)
                }

                return currentlyCreatedElement.defineNextAttribute(clickedPoint)
            }

            const newGroupId = tool.name === 'polyline' ? groupId++ : null
            const newElement = createElement(tool.name, clientX, clientY, newGroupId)
            setCurrentlyCreatedElement(newElement)
        } else if (tool.type === 'select') {
            if (currentlyEditedElements) {
                return editElements(currentlyEditedElements)
            }
            
            if (selectedElements && selectedElements.length > 0) {
                const nearbyPoints = findNearbyPoints(clientX, clientY, SELECT_DELTA)

                const selectedPoints = []
                const editedElements = []
                for (const point of nearbyPoints) {
                    const editedElement = selectedElements.find(se => se.id === point.elementId)
                    if (editedElement && point.pointType === 'endPoints') {
                        selectedPoints.push(point)
                        const copiedElement = editedElement.copy(true)
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
            console.log(newlySelectedElements)
        }
    }

    const handleMouseMove = (event) => {
        if (!currentlyEditedElements && !currentlyCreatedElement) return

        const { clientX, clientY } = event
        
        if (currentlyEditedElements && selectedPoints) {
            const newCurrentlyEditedElements = []
            for (const editedElement of currentlyEditedElements) {
                const newCurrentlyEditedElement = createEditedElement(editedElement)
                for (const selectedPoint of selectedPoints) {
                    newCurrentlyEditedElement.setPointById(selectedPoint.pointId, clientX, clientY)
                }

                newCurrentlyEditedElements.push(newCurrentlyEditedElement)
            }
            
            setCurrentlyEditedElements(newCurrentlyEditedElements)
        }
        
        // should only enter if currentlyCreatedElement is defined and has all but its last attribute set
        if (!currentlyCreatedElement || !currentlyCreatedElement.isAlmostDefined) return

        const point = createPoint(clientX, clientY)
        
        const newCurrentlyCreatedElement = createEditedElement(currentlyCreatedElement)

        newCurrentlyCreatedElement.setLastAttribute(point)
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