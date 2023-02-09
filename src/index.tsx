import React from 'react'
import { createRoot } from 'react-dom/client'
import { enableMapSet } from 'immer'
import './index.css'
import App from './App'

enableMapSet()

// const elementsStoreContainer = document.createElement('div')
// elementsStoreContainer.id = 'zustand-ElementsStore'
// document.body.appendChild(elementsStoreContainer)

// const toolsStoreContainer = document.createElement('div')
// toolsStoreContainer.id = 'zustand-ToolsStore'
// document.body.appendChild(toolsStoreContainer)

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
