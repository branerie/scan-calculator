import { click, matchSnapshot, moveMouse, pressEscape, selectTool } from "../../utils/canvas"
import { visitPage } from "../../utils/main"

/* eslint-disable no-undef */
describe('<Canvas />', () => {
    beforeEach(() => {
        visitPage('/')
    })

    afterEach(() => {
        matchSnapshot()
    })

    it('should draw circle correctly', () => {
        selectTool('circle')

        click(300, 300)
        click(350, 350)

        click(400, 400)
        click(400, 300)
    })

    it('should edit circle radius by clicking on endpoints', () => {
        selectTool('circle')

        click(500, 500)
        click(400, 500)

        pressEscape()

        // select circle
        click(400, 500)

        click(600, 500)
        click(650, 500)

        click(350, 500)
        click(325, 500)

        click(500, 325)
        click(500, 300)

        click(500, 700)
        click(500, 750)
    })

    it('should move circle by moving center', () => {
        selectTool('circle')

        click(500, 500)
        click(400, 500)

        pressEscape()

        click(400, 500)
        click(500, 500)
        click(600, 500)

        click(600, 500)
        click(350, 350)
    })

    it('should display center snap', () => {
        selectTool('circle')

        click(300, 300)
        click(100, 100)

        moveMouse(303, 303)
    })
})