import { useReducer } from 'react'

const selectionReducer = (state, action) => {
    switch (action.type) {
        case 'addElements': {
            const newElements = { ...state.elements }
            
            const addedElements = Array.isArray(action.values) ? action.values : [action.values]
            addedElements.forEach(addedElement => {
                newElements[addedElement.id] = addedElement
            })

            return {
                elements: newElements,
                points: state.points
            }
        }
        case 'removeElements': {
            const newElements = { ...state.elements }

            const removedElements = Array.isArray(action.values) ? action.values : [action.values]
            removedElements.forEach(removedElement => {
                delete newElements[removedElement.id]
            })

            return {
                elements: newElements,
                points: state.points
            }
        }
        case 'addPoints': {
            const addedPoints = Array.isArray(action.values) ? action.values : [action.values]

            return {
                elements: state.elements,
                points: [ ...state.points, ...addedPoints ]
            }
        }
        case 'removePoints': {
            const removedPoints = Array.isArray(action.values) ? action.values : [action.values]

            return {
                elements: state.elements,
                points: state.points.filter(p => !removedPoints.find(rp => rp.pointId === p.pointId))
            }
        }
        case 'clear': {
            return { elements: {}, points: {} }
        }
        case 'clearPoints': {
            return {
                elements: state.elements,
                points: []
            }
        }
        case 'setElements': {
            return {
                elements: action.values.reduce((acc, value) => ({ ...acc, [value.id]: value }), {}),
                points: state.points
            }
        }
        case 'setPoints': {
            return {
                elements: state.elements,
                points: action.values
            }
        }
        default:
            return state
    }
}

const useSelection = () => {
    const [selection, selectionDispatch] = useReducer(selectionReducer, { elements: {}, points: {} })

    const addSelectedElements = (elements) => selectionDispatch({ type: 'addElements', values: elements })
    const removeSelectedElements = (elements) => selectionDispatch({ type: 'removeElements', values: elements })
    const hasSelectedElement = (element) => !!(selection.elements[element.id])
    const setSelectedElements = (newElements) => selectionDispatch({ type: 'setElements', values: newElements })

    const addSelectedPoints = (points) => selectionDispatch({ type: 'addPoints', values: points })
    const removeSelectedPoints = (points) => selectionDispatch({ type: 'removePoints', values: points })
    const setSelectedPoints = (newPoints) => selectionDispatch({ type: 'setPoints', values: newPoints })

    const clearSelection = () => selectionDispatch({ type: 'clear' })
    const clearSelectedPoints = () => selectionDispatch({ type: 'clearPoints' })

    return {
        selectedElements: Object.keys(selection.elements).length > 0 ? Object.values(selection.elements) : null,
        selectedPoints: selection.points.length > 0 ? selection.points: null,
        addSelectedElements,
        removeSelectedElements,
        hasSelectedElement,
        addSelectedPoints,
        removeSelectedPoints,
        clearSelection,
        clearSelectedPoints,
        setSelectedElements,
        setSelectedPoints
    }
}

export default useSelection