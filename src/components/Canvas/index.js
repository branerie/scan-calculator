import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'

import useElementsHistory from '../../hooks/useElementsHistory'
import useForm from '../../hooks/useForm'
import Navbar from '../Navbar'
import ToolInputMapper from '../ToolInputMapper'

import { createEditedElement, createElement, getRoughElements } from '../../utils/elementFactory'
import Point from '../../drawingElements/point'

let groupId = 1

const Canvas = () => {
    const { elements, addElement, editElement, deleteElement } = useElementsHistory([])
    const [tool, setTool] = useState({ type: 'draw', name: 'line' })
    const [inputValues, setInputValue] = useForm({})
    const [selectedElements, setSelectedElements] = useState([])
    const [currentElement, setCurrentElement] = useState(null)

    // const [isUsingTool, setIsUsingTool] = useState(false)

    useLayoutEffect(() => {
        const canvas = document.getElementById('canvas')
        const context = canvas.getContext('2d')
        context.clearRect(0, 0, canvas.width, canvas.height)

        const roughCanvas = rough.canvas(canvas)

        const roughElements = getRoughElements(elements)
        roughElements.forEach(element => roughCanvas.draw(element))
        if (currentElement && currentElement.isFullyDefined) {
            const roughElementsParam = currentElement.type === 'polyline' ? currentElement.elements : [currentElement]
            const roughElements = getRoughElements(roughElementsParam)

            roughElements.forEach((roughElement) => roughCanvas.draw(roughElement))
        }
    }, [elements, currentElement])

    const handleKeyPress = useCallback((event) => {
        if (event.keyCode === 27) { // escape
            if (currentElement) {
                if (currentElement.type === 'polyline' && currentElement.elements.length > 1) {
                    currentElement.elements.pop()
                    
                    return
                }

                setCurrentElement(null)
            }

            if (selectedElements.length > 0) {
                setSelectedElements([])
            }
        } else if (event.keyCode === 13) { // enter
            if (currentElement.type === 'polyline') {
                currentElement.elements.pop()
                addElement(currentElement)
                
                setCurrentElement(null)
            }
        }
    }, [currentElement, selectedElements, addElement])


    useEffect(() => {
        document.addEventListener('keydown', handleKeyPress)
        return () => document.removeEventListener('keydown', handleKeyPress)
    }, [currentElement, handleKeyPress])

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
        const clickedPoint = new Point(clientX, clientY)
        if (tool.type === 'draw') {
            if (currentElement) {
                
                if (currentElement.isFullyDefined && currentElement.type !== 'polyline') {
                    addElement(currentElement)

                    setCurrentElement(null)
                }

                return currentElement.defineNextAttribute(clickedPoint)
            }

            const newGroupId = groupId++
            const newElement = createElement(tool.name, clientX, clientY, newGroupId)
            setCurrentElement(newElement)
        } else if (tool.type === 'select') {
            const newlySelectedElements = elements.filter(e => 
                                                    e.checkIfPointOnElement(clickedPoint) && 
                                                    !selectedElements.some(se => se.id === e.id))
            setSelectedElements([...selectedElements, ...newlySelectedElements])
        }
    }

    const handleMouseMove = (event) => {
        // should only enter if currentElement is defined and has all but its last attribute set
        if (!currentElement || !currentElement.isAlmostDefined) return

        const { clientX, clientY } = event

        const newCurrentElement = createEditedElement(currentElement)

        const point = new Point(clientX, clientY)
        newCurrentElement.setLastAttribute(point)
        setCurrentElement(newCurrentElement)
    }

    return (
        <>
            <canvas
                // className={styles.canvas}
                id='canvas'
                width={window.innerWidth - 100}
                height={window.innerHeight - 100}
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