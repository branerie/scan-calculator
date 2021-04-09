import { useState } from 'react'
import { createEditedElement } from '../utils/elementFactory'

let nextId = 1

const useElementsHistory = (initialElements, initialGroups) => {
    const [elements, setElements] = useState(initialElements || [])
    const [groups, setGroups] = useState(initialGroups || {})
    const [historyPointer, setHistoryPointer] = useState(null)
    const [actionHistory, setActionHistory] = useState([])

    const addElement = (newElement) => {
        newElement.id = nextId++
        setElements([...elements, newElement])
        updateHistoryEvents({ action: 'add', element: newElement })
    }

    const editElement = (elementId, payload) => {
        const elementIndex = elements.findIndex(e => e.id === elementId)
        if (elementIndex < 0) {
            throw new Error(`Element with id ${elementId} does not exist`)
        }

        const newElements = [...elements]
        const oldElement = newElements[elementIndex]

        const newElement = createEditedElement(oldElement, payload, true)
        newElements[elementIndex] = newElement

        setElements(newElements)

        updateHistoryEvents({ action: 'edit', oldElement })
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
        updateHistoryEvents({ action: 'delete', deletedElement })
    }

    const undo = () => {
        if (historyPointer === 0) {
            return
        }

        const newPointer = historyPointer === null ? actionHistory.length - 2 : historyPointer - 1

        setHistoryPointer(newPointer)
        updateElementsFromHistory(newPointer, true)
    }

    const redo = () => {
        if (historyPointer === null || historyPointer === actionHistory.length - 1) {
            return
        }

        setHistoryPointer(pointer => pointer + 1)
        updateElementsFromHistory(historyPointer + 1, false)
    }

    function updateElementsFromHistory(lastEventIndex, isUndo) {
        const lastHistoryEvent = actionHistory[lastEventIndex]
        let updateOperation = lastHistoryEvent.action

        // Undoing an added element means removing it, while undoing a delete command means adding an element.
        // Therefore, we switch the actual update operations. Redo works normally
        if (isUndo) {
            if (updateOperation === 'add') {
                updateOperation = 'delete'
            } else if (updateOperation === 'delete') {
                updateOperation = 'add'
            }
        }

        let newElements
        if (updateOperation === 'add') {
            newElements = [...elements, lastHistoryEvent]
        } else if (updateOperation === 'edit') {
            let elementAfterEdit = null
            newElements = elements.map(element => {
                if (element.id === lastHistoryEvent.id) {
                    elementAfterEdit = element
                    return lastHistoryEvent.oldElement
                }

                return element
            })

            lastHistoryEvent.oldElement = elementAfterEdit
            setActionHistory(actionHistory => actionHistory.map(event => {
                if (event.action === 'edit' && event.oldElement.id === lastHistoryEvent.oldElement.id) {
                    return lastHistoryEvent
                }

                return event
            }))
        } else if (updateOperation === 'delete') {
            newElements = elements.filter(e => e.id !== lastHistoryEvent.id)
        } else {
            throw new Error('Invalid event action')
        }

        setElements(newElements)
    }

    function updateHistoryEvents(newEvent) {
        let newActionHistory = actionHistory
        if (historyPointer !== null) {
            newActionHistory = actionHistory.slice(0, historyPointer + 1)
            setHistoryPointer(null)
        }

        setActionHistory([...newActionHistory, newEvent])
    }

    return {
        elements,
        addElement,
        editElement,
        deleteElement,
        undo,
        redo,
    }
}

export default useElementsHistory