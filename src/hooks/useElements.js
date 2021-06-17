import { useCallback, useReducer, useRef } from 'react'
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '../utils/constants'
import { createElement, createPoint } from '../utils/elementFactory'
import ElementIntersector from '../utils/elementIntersector'
import ElementManipulator from '../utils/elementManipulator'
import HashGrid from '../utils/hashGrid'

const HASH_GRID_DIV_SIZE_X = 50
const HASH_GRID_DIV_SIZE_Y = 25

const elementsReducer = (state, action) => {
    switch (action.type) {
        case 'addElements': {
            const newStateElements = { ...state.elements }
            action.newElements.forEach(newElement => {
                newStateElements[newElement.id] = newElement
            })

            return {
                ...state,
                elements: newStateElements,
                currentlyCreatedElement: null
            }
        }
        case 'changeElements': {
            const newElements = { ...state.elements }
            action.elementsAfterChange.forEach(eac => {
                newElements[eac.id] = eac
            })

            return { ...state, elements: newElements }
        }
        case 'removeElements': {
            const { removedElements } = action
            const elementIds = removedElements.map(re => re.id)

            const newElements = { ...state.elements }
            const { currentlyEditedElements } = state
            let newCurrentlyEditedElements = currentlyEditedElements
            for (const elementId of elementIds) {
                delete newElements[elementId]

                if (newCurrentlyEditedElements && elementId in newCurrentlyEditedElements) {
                    if (newCurrentlyEditedElements === currentlyEditedElements) {
                        newCurrentlyEditedElements = { ...newCurrentlyEditedElements }
                    }

                    delete newCurrentlyEditedElements[elementId]
                }
            }

            return { ...state, elements: newElements, currentlyEditedElements: newCurrentlyEditedElements }
        }
        case 'setElements': {
            return {
                ...state,
                elements: action.newElements,
                currentlyCreatedElement: null,
                currentlyEditedElements: null,
                currentlyCopiedElements: null,
                currentlyReplacedElements: null,
                snappedPoint: null
            }
        }
        case 'addCurrentlyCreated': {
            return { ...state, currentlyCreatedElement: action.value }
        }
        case 'removeCurrentlyCreated': {
            return { ...state, currentlyCreatedElement: null, snappedPoint: null }
        }
        case 'startEditingElements': {
            const newCurrentlyEditedElements = {}
            const newElements = { ...state.elements }
            for (const editedElement of action.editedElements) {
                const editedElementCopy = ElementManipulator.copyElement(editedElement, true)

                if (action.shouldHideOriginal) {
                    newElements[editedElement.id].isShown = false
                }

                newCurrentlyEditedElements[editedElement.id] = editedElementCopy
            }

            return { ...state, currentlyEditedElements: newCurrentlyEditedElements, elements: newElements }
        }
        case 'changeEditingElements': {
            const newCurrentlyEditedElements = state.currentlyEditedElements ? { ...state.currentlyEditedElements } : {}

            for (const newEditingElement of action.newEditingElements) {
                newCurrentlyEditedElements[newEditingElement.id] = newEditingElement
            }

            return { ...state, currentlyEditedElements: newCurrentlyEditedElements }
        }
        case 'stopEditingElements': {
            if (!state.currentlyEditedElements) {
                return state
            }

            const newElements = { ...state.elements }
            for (const elementId of Object.keys(state.currentlyEditedElements)) {
                newElements[elementId].isShown = true
            }

            return { ...state, elements: newElements, currentlyEditedElements: null, snappedPoint: null }
        }
        case 'completeEditingElements': {
            const { currentlyEditedElements } = state
            if (!currentlyEditedElements) {
                return state
            }

            const newElements = { ...state.elements }
            for (const elementId of Object.keys(currentlyEditedElements)) {
                newElements[elementId] = currentlyEditedElements[elementId]
            }

            return { ...state, elements: newElements, currentlyEditedElements: null, snappedPoint: null }
        }
        case 'startCopyingElements': {
            const { elementsToCopy } = action
            const newCopiedElements = []
            elementsToCopy.forEach(element => {
                const copyOfElement = ElementManipulator.copyElement(element, false)
                newCopiedElements.push(copyOfElement)
            })

            return {
                ...state,
                currentlyCopiedElements: {
                    original: elementsToCopy,
                    current: newCopiedElements,
                    positioned: []
                }
            }
        }
        case 'moveCopyingElements': {
            const { currentlyCopiedElements } = state
            if (!currentlyCopiedElements) {
                return state
            }

            const { newCurrentElements } = action

            return {
                ...state,
                currentlyCopiedElements: {
                    ...currentlyCopiedElements,
                    current: newCurrentElements
                }
            }
        }
        case 'continueCopyingElements': {
            if (!state.currentlyCopiedElements) {
                return state
            }

            const { original, current, positioned } = state.currentlyCopiedElements
            const newPositionedElements = [...positioned, ...current]

            const newCurrent = []
            current.forEach(element => {
                const copyOfElement = ElementManipulator.copyElement(element, false)
                newCurrent.push(copyOfElement)
            })

            return {
                ...state,
                currentlyCopiedElements: {
                    original,
                    current: newCurrent,
                    positioned: newPositionedElements
                }
            }
        }
        case 'completeCopyingElements': {
            return { ...state, currentlyCopiedElements: null }
        }
        case 'startReplacingElements': {
            const { currentlyReplacedElements } = state
            const currentReplacements = (currentlyReplacedElements && currentlyReplacedElements.currentReplacements)
                        ? { ...currentlyReplacedElements.currentReplacements }
                        : {}
            
            const newElements = { ...state.elements }
            for (const replacedId of Object.keys(action.replacements)) {
                const { replacingElements, removedSections } = action.replacements[replacedId]
                
                if (currentReplacements[replacedId]) {
                    for (const oldReplacingElement of currentReplacements[replacedId].replacingElements) {
                        delete newElements[oldReplacingElement.id]
                    }
                } else {
                    newElements[replacedId].isShown = false
                }
                
                for (const replacingElement of replacingElements) {
                    newElements[replacingElement.id] = replacingElement
                }
                
                currentReplacements[replacedId] = { replacingElements, removedSections }
            }
            
            const completed = state.currentlyReplacedElements ? state.currentlyReplacedElements.completed : null
            return {
                ...state,
                elements: newElements,
                currentlyReplacedElements: {
                    currentReplacements,
                    ...(!!(completed) && { completed })
                }
            }
        }
        case 'clearReplacingElements': {
            if (!state.currentlyReplacedElements || !state.currentlyReplacedElements.currentReplacements) return state

            const { currentlyReplacedElements: { currentReplacements, completed } } = state

            const newElements = { ...state.elements }
            for (const replacedId of Object.keys(currentReplacements)) {
                newElements[replacedId].isShown = true

                const replacingElements = currentReplacements[replacedId].replacingElements
                for (const replacingElement of replacingElements) {
                    delete newElements[replacingElement.id]
                }
            }

            return { 
                ...state, 
                elements: newElements, 
                currentlyReplacedElements: completed ? { completed } : null 
            }
        }
        case 'completeReplacingElements': {
            if (!state.currentlyReplacedElements) return state

            // const { currentlyReplacedElements: { completed } } = state
            // if (!completed) {
            //     return { ...state, currentlyReplacedElements: null }
            // }

            // const newElements = { ...state.elements }
            // for (const replacedId of completed.replacedIds) {
            //     delete newElements[replacedId]
            // }

            // for (const replacingElement of completed.replacingElements) {
            //     newElements[replacingElement.id] = replacingElement
            // }

            const { completed, currentReplacements } = state.currentlyReplacedElements
            let newElements = null
            if (currentReplacements) {
                newElements = { ...state.elements }
                for (const replacedId of Object.keys(currentReplacements)) {
                    newElements[replacedId].isShown = true
                }
            }

            if (!completed) {
                return {  ...state, currentlyReplacedElements: null, elements: newElements || state.elements }
            }
            
            if (!newElements) {
                newElements = { ...state.elements }
            }

            for (const replacedId of Object.keys(completed)) {
                delete newElements[replacedId]
            }   
            
            return {
                ...state,
                elements: newElements,
                currentlyReplacedElements: null
            }
        }
        case 'continueReplacingElements': {
            if (!state.currentlyReplacedElements || !state.currentlyReplacedElements.currentReplacements) return state

            const { currentlyReplacedElements: { currentReplacements, completed } } = state

            const newCompleted = completed ? { ...completed } : {}
            for (const replacedId of Object.keys(currentReplacements)) {
                newCompleted[replacedId] = currentReplacements[replacedId]
            }

            return { ...state, currentlyReplacedElements: { completed: newCompleted } }            
        }
        case 'setSnappedPoint': {
            return { ...state, snappedPoint: action.value }
        }
        case 'clearSnappedPoint': {
            return { ...state, snappedPoint: null }
        }
        default:
            return state
    }
}

const useElements = () => {
    const [elementsState, elementsDispatch] = useReducer(elementsReducer, {
        elements: {},
        currentlyCreatedElement: null,
        currentlyEditedElements: null,
        currentlyCopiedElements: null,
        currentlyReplacedElements: null,
        snappedPoint: null,
    })

    const hashGrid = useRef(new HashGrid(
        Math.ceil(CANVAS_WIDTH / HASH_GRID_DIV_SIZE_X),
        HASH_GRID_DIV_SIZE_X,
        Math.ceil(CANVAS_HEIGHT / HASH_GRID_DIV_SIZE_Y),
        HASH_GRID_DIV_SIZE_Y
    ))

    const addElements = useCallback((newElements) => {
        elementsDispatch({ type: 'addElements', newElements })
        hashGrid.current.addElements(newElements)
    }, [])

    const removeElements = useCallback((removedElements) => {
        elementsDispatch({ type: 'removeElements', removedElements })
        hashGrid.current.removeElements(removedElements)
    }, [])

    const changeElements = useCallback((elementsAfterChange) => {
        elementsDispatch({ type: 'changeElements', elementsAfterChange })
        hashGrid.current.changeElements(elementsAfterChange)
    }, [])

    const setElements = useCallback((newElements) => {
        elementsDispatch({ type: 'setElements', newElements })
        hashGrid.current.setElements(newElements)
    }, [])

    const getElementsContainingPoint = useCallback((pointX, pointY, maxPointDiff) => {
        const elementIdsInDivision = hashGrid.current.getDivisionContents(pointX, pointY)
        if (!elementIdsInDivision) return null

        const point = createPoint(pointX, pointY)

        const elementsWithPoint = []
        for (const elementId of elementIdsInDivision) {
            const element = elementsState.elements[elementId]
            if (element.checkIfPointOnElement(point, maxPointDiff)) {
                elementsWithPoint.push(element)
            }
        }

        return elementsWithPoint.length > 0 ? elementsWithPoint : null
    }, [elementsState.elements])

    const getElementsInContainer = useCallback((boxStartPoint, boxEndPoint, shouldSkipPartial = true) => {
        const startPoint = { x: Math.min(boxStartPoint.x, boxEndPoint.x), y: Math.min(boxStartPoint.y, boxEndPoint.y) }
        const endPoint = { x: Math.max(boxStartPoint.x, boxEndPoint.x), y: Math.max(boxStartPoint.y, boxEndPoint.y) }

        const elementIds = hashGrid.current.getContainerContents(startPoint, endPoint)
        if (!elementIds) return null

        const elementsInContainer = []
        for (const elementId of elementIds) {
            const element = elementsState.elements[elementId]
            const boundingBox = element.getBoundingBox()

            const isLeftInContainer = boundingBox.left >= startPoint.x
            const isTopInContainer = boundingBox.top >= startPoint.y
            const isRightInContainer = boundingBox.right <= endPoint.x
            const isBottomInContainer = boundingBox.bottom <= endPoint.y

            if (isLeftInContainer && isTopInContainer && isRightInContainer && isBottomInContainer) {
                elementsInContainer.push(element)
            }

            if (shouldSkipPartial) continue

            const container = createElement('rectangle', startPoint.x, startPoint.y)
            container.setLastAttribute(endPoint.x, endPoint.y)
            const intersections = ElementIntersector.getIntersections(element, container)
            if (intersections) {
                elementsInContainer.push(element)
            }
        }

        return elementsInContainer.length > 0 ? elementsInContainer : null
    }, [elementsState.elements])

    const addCurrentlyCreatedElement = (createdElement) =>
            elementsDispatch({ type: 'addCurrentlyCreated', value: createdElement })
    const removeCurrentlyCreatedElement = () =>     elementsDispatch({ type: 'removeCurrentlyCreated' })
    const startEditingElements = (editedElements, shouldHideOriginal = true) =>
            elementsDispatch({ type: 'startEditingElements', editedElements, shouldHideOriginal })
    const changeEditingElements = (newEditingElements) =>
            elementsDispatch({ type: 'changeEditingElements', newEditingElements })
    const stopEditingElements = () => elementsDispatch({ type: 'stopEditingElements' })
    const startCopyingElements = (elementsToCopy) => elementsDispatch({ type: 'startCopyingElements', elementsToCopy })
    const moveCopyingElements = (dX, dY) => {
        const newCurrentElements = [...elementsState.currentlyCopiedElements.current]
        for (const currentElement of newCurrentElements) {
            currentElement.move(dX, dY)
        }

        elementsDispatch({ type: 'moveCopyingElements', newCurrentElements })
    }

    const continueCopyingElements = () => elementsDispatch({ type: 'continueCopyingElements' })
    const completeCopyingElements = () => {
        const positionedCopies = elementsState.currentlyCopiedElements
            ? elementsState.currentlyCopiedElements.positioned
            : []

        elementsDispatch({ type: 'completeCopyingElements' })
        return positionedCopies
    }

    const completeEditingElements = () => {
        const editedElements = Object.values(elementsState.currentlyEditedElements)

        elementsDispatch({ type: 'completeEditingElements' })
        hashGrid.current.changeElements(editedElements)

        return editedElements
    }

    const startReplacingElements = (replacements) => 
                    elementsDispatch({ type: 'startReplacingElements', replacements })
    const clearReplacingElements = () => {
        if (!elementsState.currentlyReplacedElements || !elementsState.currentlyReplacedElements.currentReplacements) return

        elementsDispatch({ type: 'clearReplacingElements' })
    }

    const completeReplacingElements = () => {
        const { currentlyReplacedElements } = elementsState
        if (!currentlyReplacedElements) return

        const { completed } = currentlyReplacedElements
        
        elementsDispatch({ type: 'completeReplacingElements' })

        return completed
    }

    const continueReplacingElements = () => {
        const { currentlyReplacedElements } = elementsState
        if (!currentlyReplacedElements || !currentlyReplacedElements.currentReplacements) return

        const { currentReplacements } = currentlyReplacedElements
        const replacingElements = Object.values(currentReplacements).reduce((acc, cr) => [...acc, ...cr.replacingElements], [])
        const replacedIds = Object.keys(currentReplacements)

        elementsDispatch({ type: 'continueReplacingElements' })
        hashGrid.current.addElements(replacingElements)
        hashGrid.current.removeElementsById(replacedIds)
    }

    const isReplacingElement = (element) => {
        const { currentlyReplacedElements } = elementsState
        if (!currentlyReplacedElements || !currentlyReplacedElements.replacingElements) return false

        const { replacingElements } = currentlyReplacedElements

        // TODO: replacedIds - move away from array implementation?
        return replacingElements.some(id => id === element.id)
    }

    const getElementById = (elementId) => elementsState.elements[elementId]

    const setSnappedPoint = (snappedPoint) => elementsDispatch({ type: 'setSnappedPoint', value: snappedPoint })
    const clearSnappedPoint = () => elementsDispatch({ type: 'clearSnappedPoint' })

    return {
        elements: Object.values(elementsState.elements),
        currentlyCreatedElement: elementsState.currentlyCreatedElement,
        currentlyEditedElements: elementsState.currentlyEditedElements
            ? Object.values(elementsState.currentlyEditedElements)
            : null,
        currentlyCopiedElements: elementsState.currentlyCopiedElements
            ? elementsState.currentlyCopiedElements
                .current
                .concat(elementsState.currentlyCopiedElements.positioned)
            : null,
        currentlyReplacedElements: elementsState.currentlyReplacedElements,
        snappedPoint: elementsState.snappedPoint,
        addElements,
        removeElements,
        changeElements,
        getElementById,
        setElements,
        addCurrentlyCreatedElement,
        removeCurrentlyCreatedElement,
        startEditingElements,
        changeEditingElements,
        stopEditingElements,
        completeEditingElements,
        startCopyingElements,
        moveCopyingElements,
        continueCopyingElements,
        completeCopyingElements,
        startReplacingElements,
        clearReplacingElements,
        completeReplacingElements,
        continueReplacingElements,
        isReplacingElement,
        setSnappedPoint,
        clearSnappedPoint,
        getElementsContainingPoint,
        getElementsInContainer
    }
}

export default useElements