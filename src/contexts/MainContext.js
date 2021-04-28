import React, { useState, useContext, createContext } from 'react'
// import useElements from '../hooks/useElements'
import useSelection from '../hooks/useSelection'

const Context = createContext()

export function useMainContext() {
    return useContext(Context)
}

export default function MainContextProvider({ children }) {
    const [currentTranslate, setCurrentTranslate] = useState([0, 0])
    const [currentScale, setCurrentScale] = useState(1)
    const [tool, setTool] = useState({ type: 'select', name: 'select' })
    // const elements = useElements()
    const selection = useSelection()
    // const elementsHistory = useElementsHistory([])

    return (
        <Context.Provider value={{
            currentTranslate,
            setCurrentTranslate,
            currentScale,
            setCurrentScale,
            tool,
            setTool,
            // ...elements,
            ...selection,
            // ...elementsHistory
        }}>
            {children}
        </Context.Provider>
    )
}


