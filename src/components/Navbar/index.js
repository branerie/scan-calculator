import React from 'react'

const Navbar = ({ tool, setTool, undo, redo }) => {
    return (
        <>
            <div>
                <label>
                    Select
                    <input
                        type='radio'
                        checked={tool.name === 'select'}
                        onChange={() => setTool({ type: 'select', name: 'select' })}
                    />
                </label>
                <label>
                    Line
                    <input
                        type='radio'
                        checked={tool.name === 'line'}
                        onChange={() => setTool({ type: 'draw', name: 'line' })}
                    />
                </label>

                <label>
                    Polyline
                    <input
                        type='radio'
                        checked={tool.name === 'polyline'}
                        onChange={() => setTool({ type: 'draw', name: 'polyline' })}
                    />
                </label>

                <label>
                    Arc
                    <input
                        type='radio'
                        checked={tool.name === 'arc'}
                        onChange={() => setTool({ type: 'draw', name: 'arc' })}
                    />
                </label>

                <label>
                    Circle
                    <input
                        type='radio'
                        checked={tool.name === 'circle'}
                        onChange={() => setTool({ type: 'draw', name: 'circle' })}
                    />
                </label>

                <label>
                    Rectangle
                    <input
                        type='radio'
                        checked={tool.name === 'rectangle'}
                        onChange={() => setTool({ type: 'draw', name: 'rectangle' })}
                    />
                </label>
            </div>
            {/* <div>
                <button onClick={undo}>Undo</button>
                <button onClick={redo}>Redo</button>
            </div> */}
        </>
    )
}

export default Navbar
