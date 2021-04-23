/* eslint-disable no-undef */

const ENTER_KEY_CODE = 13
const ESCAPE_KEY_CODE = 27

const click = (clientX, clientY) => {
    const canvas = cy.get('canvas')
    canvas.trigger('mousemove', { clientX, clientY })
    canvas.click(clientX, clientY)
}

const pressEnter = () => {
    const canvas = cy.get('canvas')
    canvas.trigger('keydown', { keyCode: ENTER_KEY_CODE })
}

const pressEscape = () => {
    const canvas = cy.get('canvas')
    canvas.trigger('keydown', { keyCode: ESCAPE_KEY_CODE })
}

const selectDrawingTool = (toolName) => {
    cy.get(`input[name="${toolName}"]`).click()
}

const matchSnapshot = () => {
    cy.get('body').toMatchImageSnapshot()
}

const moveMouse = (clientX, clientY) => {
    const canvas = cy.get('canvas')
    canvas.trigger('mousemove', { clientX, clientY })
}

export {
    click,
    moveMouse,
    pressEnter,
    pressEscape,
    selectDrawingTool,
    matchSnapshot
}