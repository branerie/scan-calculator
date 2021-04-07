import React from 'react'

const Navbar = ({ tool, setTool, undo, redo }) => {
    return (
        <>
            <div>
                <input
                    type="radio"
                    id="selection"
                    checked={tool === "selection"}
                    onChange={() => setTool("selection")}
                />
                <label htmlFor="selection">Selection</label>
                <input
                    type="radio"
                    id="line"
                    checked={tool === "line"}
                    onChange={() => setTool("line")}
                />
                <label htmlFor="line">Line</label>
                <input
                    type="radio"
                    id="rectangle"
                    checked={tool === "rectangle"}
                    onChange={() => setTool("rectangle")}
                />
                <label htmlFor="rectangle">Rectangle</label>
                <input
                    type="radio"
                    id="circle"
                    checked={tool === "circle"}
                    onChange={() => setTool("circle")}
                />
                <label htmlFor="circle">Circle</label>
                <input
                    type="radio"
                    id="arc"
                    checked={tool === "arc"}
                    onChange={() => setTool("arc")}
                />
                <label htmlFor="arc">Arc</label>
            </div>
            <div>
                <button onClick={undo}>Undo</button>
                <button onClick={redo}>Redo</button>
            </div>
        </>
    )
}

export default Navbar
