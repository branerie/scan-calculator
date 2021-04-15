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
        elementPoints.forEach(elementPoint => {
            pointsTree.current.insert(
                elementPoint.x,
                buildPointsTreeDataObject(elementPoint, newElement.id, elementPoint.pointType)
            )
        })

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

            element.isShown = true
            newHistoryEvents.push({ action: 'edit', element })
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

        
        const newSelectedElements = selectedElements.map(se => {
            if (!editedElementIds.includes(se.id)) {
                return se
            }
            
            return editedElements.find(ee => ee.id === se.id)
        })
        
        setSelectedElements(newSelectedElements)
        newHistoryEvents.forEach(nhe => updateHistoryEvents(nhe))
        setElements(newElements)

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

        const snappingPoints = deletedElement.getSnappingPoints()
        for (const snappingPoint of snappingPoints) {
            pointsTree.current.remove(
                snappingPoint.x, 
                { y: snappingPoint.y, elementId: snappingPoint.elementId },
                snappingPoint.pointType
            )
        }

        setElements(newElements)
        
        updateHistoryEvents({ action: 'delete', element: deletedElement })
    }

    const undo = () => {
        if (historyPointer === 0) {
            return
        }

        const newPointer = historyPointer === null ? actionHistory.length - 1 : historyPointer - 1

        setHistoryPointer(newPointer)
        updateElementsFromHistory(newPointer, true)
    }

    const redo = () => {
        if (historyPointer === null) {
            return
        }
        
        updateElementsFromHistory(historyPointer, false)
        setHistoryPointer(pointer => {
            if (pointer === actionHistory.length -1) {
                return null
            }

            return pointer + 1
        })
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
            newElements = [...elements, lastHistoryEvent.element]
        } else if (updateOperation === 'edit') {
            // gets new state of elements after undo/redo operation
            // also, saves state of edited element in elementAfterEdit in order to put it in history
            // to be able to get the element back to this state using redo/undo
            let elementAfterEdit = null
            newElements = elements.map(element => {
                if (element.id === lastHistoryEvent.element.id) {
                    elementAfterEdit = element
                    return lastHistoryEvent.element
                }

                return element
            })

            const pointsAfterUndo = lastHistoryEvent.element.getSnappingPoints()
            elementAfterEdit.getSnappingPoints().forEach(pointBeforeUndo => {
                const pointAfterUndo = pointsAfterUndo.find(pau => pau.pointId === pointBeforeUndo.pointId)

                pointsTree.current.replace(
                    pointBeforeUndo.x,
                    { pointId: pointBeforeUndo.pointId },
                    pointAfterUndo.x,
                    buildPointsTreeDataObject(pointAfterUndo, pointBeforeUndo.elementId, pointBeforeUndo.pointType)
                )
            })

            const newSelectedElements = selectedElements.filter(se => se.id !== lastHistoryEvent.element.id)
            if (newSelectedElements.length < selectedElements.length) {
                newSelectedElements.push(lastHistoryEvent.element)
                setSelectedElements(newSelectedElements)
            }

            // change actionHistory by adding elementAfterEdit so it can be accessed using undo/redo
            const newActionHistory = [...actionHistory]
            newActionHistory[lastEventIndex].element = elementAfterEdit
            setActionHistory(newActionHistory)
        } else if (updateOperation === 'delete') {
            newElements = elements.filter(e => e.id !== lastHistoryEvent.element.id)
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