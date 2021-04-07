import React, { useEffect, useLayoutEffect, useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'

import Point from '../../drawingElements/point'

const Canvas = () => {
    const [elements, setElements] = useState([])

    // useLayoutEffect(() => {
    //     const canvas = document.getElementById('canvas')
    //     const context = canvas.getContext('2d')
    //     context.clearRect(0, 0, canvas.width, canvas.height)

    //     const roughCanvas = rough.canvas(canvas)

    //     elements.forEach(({ roughElement }) => roughCanvas.draw(roughElement))
    // }, [elements])

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
}

export default Canvas