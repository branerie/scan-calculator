import React, { useEffect, useLayoutEffect, useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'
import styles from './index.module.css'
import Navbar from '../Navbar'
import {
    createElement,
    getElementAtPosition,
    adjustElementCoordinates,
    cursorForPosition,
    resizedCoordinates,
    useElementsHistory
} from '../../utils'

import Point from '../../drawingElements/point'

const Canvas = () => {
    const { elements, setElements, undo, redo } = useElementsHistory([])
    const [action, setAction] = useState('none')
    const [tool, setTool] = useState('line')
    const [selectedElement, setSelectedElement] = useState(null)

    useLayoutEffect(() => {
        const canvas = document.getElementById('canvas')
        const context = canvas.getContext('2d')
        context.clearRect(0, 0, canvas.width, canvas.height)

        const roughCanvas = rough.canvas(canvas)

        elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement))
    }, [elements])

    useEffect(() => {
        const undoRedoFunction = event => {
            if (event.metaKey || event.ctrlKey) {
                if (event.key === 'z') {
                    undo()
                } else if (event.key === 'y') {
                    redo()
                }
            }
        }

        document.addEventListener('keydown', undoRedoFunction)
        return () => {
            document.removeEventListener('keydown', undoRedoFunction)
        }
    }, [undo, redo])

    const updateElement = (id, x1, y1, x2, y2, type) => {
        const updatedElement = createElement(id, x1, y1, x2, y2, type)

        const elementsCopy = [...elements]
        elementsCopy[id] = updatedElement
        setElements(elementsCopy, true)
    }

    const handleMouseDown = event => {
        const { clientX, clientY } = event
        if (tool === 'selection') {
            const element = getElementAtPosition(clientX, clientY, elements)
            if (element) {
                const offsetX = clientX - element.x1
                const offsetY = clientY - element.y1
                setSelectedElement({ ...element, offsetX, offsetY })
                // setElements(prevState => prevState)

                if (element.position === 'inside') {
                    setAction('moving')
                } else {
                    setAction('resizing')
                }
            }
        } else {
            // const id = elements.length
            const newElement = createElement(new Point(clientX, clientY), new Point(clientX, clientY), tool)
            setElements([...elements, newElement])
            setSelectedElement(newElement)

            setAction('drawing')
        }
    }

    const handleMouseMove = event => {
        const { clientX, clientY } = event

        if (tool === 'selection') {
            const element = getElementAtPosition(clientX, clientY, elements)
            event.target.style.cursor = element ? cursorForPosition(element.position) : 'default'
        }

        if (action === 'drawing') {
            const index = elements.length - 1
            const { x1, y1 } = elements[index]
            updateElement(index, x1, y1, clientX, clientY, tool)
        } else if (action === 'moving') {
            const { id, x1, x2, y1, y2, type, offsetX, offsetY } = selectedElement
            const width = x2 - x1
            const height = y2 - y1
            const newX1 = clientX - offsetX
            const newY1 = clientY - offsetY
            updateElement(id, newX1, newY1, newX1 + width, newY1 + height, type)
        } else if (action === 'resizing') {
            const { id, type, position, ...coordinates } = selectedElement
            const { x1, y1, x2, y2 } = resizedCoordinates(clientX, clientY, position, coordinates)
            updateElement(id, x1, y1, x2, y2, type)
        }
    }

    const handleMouseUp = () => {
        if (selectedElement) {
            const index = selectedElement.id
            const { id, type } = elements[index]
            if (action === 'drawing' || action === 'resizing') {
                if (tool === 'circle' || tool === 'arc') {
                    const { x1, y1, x2, y2 } = elements[index]
                    updateElement(id, x1, y1, x2, y2, type)
                } else {
                    const { x1, y1, x2, y2 } = adjustElementCoordinates(elements[index])
                    updateElement(id, x1, y1, x2, y2, type)
                }
            }
        }
        setAction('none')
        setSelectedElement(null)
    }

    return (
        <div>
            <canvas
                className={styles.canvas}
                id='canvas'
                width={window.innerWidth - 100}
                height={window.innerHeight - 100}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            >
                Canvas
            </canvas>
            <Navbar
                tool={tool}
                setTool={setTool}
                undo={undo}
                redo={redo}
            />
        </div>
    )
}

export default Canvas
