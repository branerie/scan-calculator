import { click, pressEnter, pressEscape, selectTool } from '../../../utils/canvas'

const createAndSelectMultipleElements = () => {
    selectTool('line')
    click(50, 50)
    click(150, 150)
    pressEscape()

    selectTool('arc')
    click(300, 300)
    click(300, 400)
    click(300, 200)
    pressEscape()

    selectTool('polyline')
    click(400, 400)
    click(400, 480)
    click(500, 480)
    click(500, 300)
    pressEnter()

    selectTool('circle')
    click(600, 600)
    click(600, 660)

    selectTool('rectangle')
    click(200, 500)
    click(400, 650)

    pressEscape()

    click(50, 50)   // select line
    click(400, 300) // select arc
    click(400, 400) // select polyline
    click(600, 660) // select circle
}

export {
    createAndSelectMultipleElements
}