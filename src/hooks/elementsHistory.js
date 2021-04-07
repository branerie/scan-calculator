import { useState } from 'react'
import rough from 'roughjs/bundled/rough.esm'
import { createEditedElement } from '../utils/elementFactory'

const generator = rough.generator()

const useElementsHistory = initialState => {
    const [elements, setElements] = useState([initialState])
    const [historyPointer, setHistoryPointer] = useState(null)
    const [actionHistory, setActionHistory] = useState([])

    const addElement = (newElement) => {
        setElements([...elements, newElement])
        setActionHistory({ action: 'add', element: newElement })
        setHistoryPointer(null)
    }

    const editElement = (elementId, payload) => {
        const elementIndex = elements.findIndex(e => e.id === elementId)
        if (elementIndex < 0) {
            throw new Error(`Element with id ${elementId} does not exist`)
        }

        const newElements = [...elements]
        const oldElement = newElements[elementIndex]

        const newElement = createEditedElement(oldElement, payload)
        newElements[elementIndex] = newElement

        setElements(newElements)
        setActionHistory({ action: 'edit', oldElement })
        setHistoryPointer(null)
    }

    const deleteElement = (elementId) => {
        const elementIndex = elements.findIndex(e => e.id === elementId)
        if (elementIndex < 0) {
            throw new Error(`Element with id ${elementId} does not exist`)
        }

        const deletedElement = elements[elementIndex]
        const newElements = [...elements]
        newElements.splice(elementIndex, 1)
        

        setElements(newElements)
        setActionHistory({ action: 'delete', deletedElement })
        setHistoryPointer(null)
    }
    
    const undo = () => {
        setHistoryPointer(actionHistory.length - 2)
    }

    const redo = () => {

    }

    return {
        elements,
        addElement,
        editElement,
        deleteElement,
        undo,
        redo
    }
}