import { useCallback, useRef, useState } from 'react'
import { createTree } from '../utils/pointsSearchTree'

import { CANVAS_WIDTH } from '../utils/constants'

let nextId = 1

const buildPointsTreeDataObject = (point, elementId, pointType) => {
    return {
        leafValue: point.x,
        y: point.y,
        elementId: elementId,
        pointId: point.pointId,
        pointType
    }
}

const useElementsHistory = (initialElements, initialGroups) => {
    // TODO: maybe change to object with id as keys?
    const [elements, setElements] = useState(initialElements || [])
    const [historyPointer, setHistoryPointer] = useState(null)
    const [actionHistory, setActionHistory] = useState([])
    const [selectedElements, setSelectedElements] = useState(null)
    const [selectedPoints, setSelectedPoints] = useState(null)
    const [currentlyCreatedElement, setCurrentlyCreatedElement] = useState(null)
    const [currentlyEditedElements, setCurrentlyEditedElements] = useState(null)
    const pointsTree = useRef(createTree(CANVAS_WIDTH))

    const clearSelection = useCallback(() => {
        setSelectedElements(null)
        setSelectedPoints(null)
    }, [])

    const addElement = (newElement) => {
        newElement.id = nextId++
        // TODO: decide where to add id's to polyline elements:
        // on creation or after explode/trim?
        const elementPoints = newElement.getSnappingPoints()
        for (const [pointType, pointValues] of Object.entries(elementPoints)) {
            for (const pointValue of pointValues) {
                pointsTree.current.insert(
                    pointValue.x,
                    buildPointsTreeDataObject(pointValue, newElement.id, pointType)
                )
            }
        }

        setElements([...elements, newElement])
        updateHistoryEvents({ action: 'add', element: newElement })
    }

    const editElements = (editedElements, shouldAddToHistory = true) => {
        const editedElementIds = editedElements.map(ee => ee.id)
        const newHistoryEvents = []
        const newElements = elements.map(element => {
            if (!editedElementIds.includes(element.id)) {
                return element
            }

            newHistoryEvents.push({ action: 'edit', oldElement: element })
            return editedElements.find(ee => ee.id === element.id)
        })

        selectedPoints.forEach(selectedPoint => {
            const elementOfPoint = currentlyEditedElements.find(cee => cee.getPointById(selectedPoint.pointId))
            if (!elementOfPoint) {
                throw new Error('Mismatch between selectedPoints and currentlyEditedElements.')
            }

            const editedPoint = elementOfPoint.getPointById(selectedPoint.pointId)
            pointsTree.current.replace(
                selectedPoint.leafValue,
                { pointId: selectedPoint.pointId },
                editedPoint.x,
                buildPointsTreeDataObject(editedPoint, elementOfPoint.id, selectedPoint.pointType)
            )
        })

        setElements(newElements)

        const newSelectedElements = selectedElements.map(se => {
            if (!editedElementIds.includes(se.id)) {
                return se
            }

            return editedElements.find(ee => ee.id === se.id)
        })

        setSelectedElements(newSelectedElements)
        newHistoryEvents.forEach(nhe => updateHistoryEvents(nhe))

        setSelectedPoints(null)
        setCurrentlyEditedElements(null)
    }

    const deleteElement = (elementId) => {
        const elementIndex = elements.findIndex(e => e.id === elementId)
        if (elementIndex < 0) {
            throw new Error(`Element with id ${elementId} does not exist`)
        }

        const deletedElement = elements[elementIndex]
        const newElements = [...elements]
        newElements.splice(elementIndex, 1)

        const elementPoints = deletedElement.getSnappingPoints()
        for (const pointValues of Object.values(elementPoints)) {
            for (const pointValue of pointValues) {
                pointsTree.current.remove(pointValue.x, { y: pointValue.y, elementId: pointValue.elementId })
            }
        }

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

    const findNearbyPoints = (mouseX, mouseY, delta) => {
        const filteredPoints = pointsTree.current.find(
            Math.max(mouseX - delta, 0),
            Math.min(mouseX + delta, CANVAS_WIDTH)
        )

        return filteredPoints.filter(point => Math.abs(point.y - mouseY) <= delta)
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
        setElements,
        selectedElements,
        setSelectedElements,
        currentlyCreatedElement,
        setCurrentlyCreatedElement,
        currentlyEditedElements,
        setCurrentlyEditedElements,
        selectedPoints,
        setSelectedPoints,
        clearSelection,
        addElement,
        editElements,
        deleteElement,
        findNearbyPoints,
        undo,
        redo,
    }
}

export default useElementsHistory