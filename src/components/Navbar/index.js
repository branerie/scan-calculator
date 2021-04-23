import React from 'react'

const Navbar = ({ tool, changeTool, options, setOptions }) => {
    return (
        <>
            <div>
                <label>
                    Select
                    <input
                        type='radio'
                        name='select'
                        checked={tool.name === 'select'}
                        onChange={() => changeTool({ type: 'select', name: 'select' })}
                    />
                </label>
                <label>
                    Line
                    <input
                        type='radio'
                        name='line'
                        checked={tool.name === 'line'}
                        onChange={() => changeTool({ type: 'draw', name: 'line' })}
                    />
                </label>

                <label>
                    Polyline
                    <input
                        type='radio'
                        name='polyline'
                        checked={tool.name === 'polyline'}
                        onChange={() => changeTool({ type: 'draw', name: 'polyline' })}
                    />
                </label>

                <label>
                    Arc
                    <input
                        type='radio'
                        name='arc'
                        checked={tool.name === 'arc'}
                        onChange={() => changeTool({ type: 'draw', name: 'arc' })}
                    />
                </label>

                <label>
                    Circle
                    <input
                        type='radio'
                        name='circle'
                        checked={tool.name === 'circle'}
                        onChange={() => changeTool({ type: 'draw', name: 'circle' })}
                    />
                </label>

                <label>
                    Rectangle
                    <input
                        type='radio'
                        name='rectangle'
                        checked={tool.name === 'rectangle'}
                        onChange={() => changeTool({ type: 'draw', name: 'rectangle' })}
                    />
                </label>

                <label>
                    Snapping
                    <input
                        type='checkbox'
                        name='snapping'
                        checked={options.snap}
                        onChange={() => setOptions((options) => ({ ...options, snap: !options.snap }))}
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
