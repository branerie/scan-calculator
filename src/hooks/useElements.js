import { useReducer } from 'react'
import ElementManipulator from '../utils/elementManipulator'

const elementsReducer = (state, action) => {
    switch (action.type) {
        case 'addElement': {
            return { 
                ...state, 
                elements: {
                    ...state.elements, 
                    [action.value.id]: action.value
                },
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

                newElements[editedElement.id].isShown = false
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
        snappedPoint: null,
    })

    const addElement = (element) => elementsDispatch({ type: 'addElement', value: element })
    const removeElements = (removedElements) =>  elementsDispatch({ type: 'removeElements', removedElements })
    const changeElements = (elementsAfterChange) => elementsDispatch({ type: 'changeElements', elementsAfterChange })
    const setElements = (newElements) => elementsDispatch({ type: 'setElements', newElements })
    const addCurrentlyCreatedElement = (createdElement) => elementsDispatch({ type: 'addCurrentlyCreated', value: createdElement })
    const removeCurrentlyCreatedElement = () => elementsDispatch({ type: 'removeCurrentlyCreated' })
    const startEditingElements = (editedElements) => elementsDispatch({ type: 'startEditingElements', editedElements })
    const changeEditingElements = (newEditingElements) => elementsDispatch({ type: 'changeEditingElements', newEditingElements })
    const stopEditingElements = () => elementsDispatch({ type: 'stopEditingElements' })

    const completeEditingElements = () => {
        const editedElements = Object.values(elementsState.currentlyEditedElements)

        elementsDispatch({ type: 'completeEditingElements' })
        return editedElements
    }

    const getElementById = (elementId) => elementsState.elements[elementId]

    const setSnappedPoint = (snappedPoint) => elementsDispatch({ type: 'setSnappedPoint', value: snappedPoint })
    const clearSnappedPoint = () => elementsDispatch({ type: 'clearSnappedPoint' })

    return {
        elements: Object.values(elementsState.elements),
        currentlyEditedElements: elementsState.currentlyEditedElements 
                                    ? Object.values(elementsState.currentlyEditedElements)
                                    : null,
        currentlyCreatedElement: elementsState.currentlyCreatedElement,
        snappedPoint: elementsState.snappedPoint,
        addElement,
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
        setSnappedPoint,
        clearSnappedPoint
    }
}

export default useElements