import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'

import useElementsHistory from '../../hooks/useElementsHistory'
import useForm from '../../hooks/useForm'
import Navbar from '../Navbar'
import ToolInputMapper from '../ToolInputMapper'

import { createEditedElement, createElement } from '../../utils/elementFactory'
import Point from '../../drawingElements/point'

const Canvas = () => {
    const { elements, addElement, editElement, deleteElement } = useElementsHistory([])
    const [tool, setTool] = useState({ type: 'draw', name: 'line' })
    const [inputValues, setInputValue] = useForm({})
    const [currentElement, setCurrentElement] = useState(null)

    // const [isUsingTool, setIsUsingTool] = useState(false)

    useLayoutEffect(() => {
        const canvas = document.getElementById('canvas')
        const context = canvas.getContext('2d')
        context.clearRect(0, 0, canvas.width, canvas.height)

        const roughCanvas = rough.canvas(canvas)

        elements.forEach(element => roughCanvas.draw(element.drawingElement))
        if (currentElement && currentElement.isFullyDefined) {
            roughCanvas.draw(currentElement.drawingElement)
        }
    }, [elements, currentElement])

    const handleKeyPress = useCallback((event) => {
        if (event.keyCode === 27) { // escape
            if (currentElement) {
                setCurrentElement(null)
            }
        } else if (event.keyCode === 13) { // enter
        }
    }, [currentElement])


    useEffect(() => {
        if (currentElement) {
            document.addEventListener('keydown', handleKeyPress)
            return () => document.removeEventListener('keydown', handleKeyPress)
        }
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

        if (tool.type === 'draw') {
            if (currentElement) {
                const { clientX, clientY } = event
                const newPoint = new Point(clientX, clientY)
                
                if (currentElement.isFullyDefined) {
                    addElement(currentElement)


                    return setCurrentElement(null)
                }

                return currentElement.defineNextAttribute(newPoint)
            }

            const { clientX, clientY } = event
            const newElement = createElement(tool.name, clientX, clientY)
            setCurrentElement(newElement)
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
                onKeyUp={handleKeyPress}
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