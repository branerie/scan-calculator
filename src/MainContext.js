import React, { useState, useContext, createContext } from 'react'

const Context = createContext()

export function useMainContext() {
    return useContext(Context)
}

export default function MainContextProvider({ children }) {
    const [currentTranslate, setCurrentTranslate] = useState([0, 0])
    const [currentScale, setCurrentScale] = useState(1)

    return (
        <Context.Provider value={{ 
            currentTranslate, 
            setCurrentTranslate, 
            currentScale, 
            setCurrentScale
        }}>
            {children}
        </Context.Provider>
    )
}


