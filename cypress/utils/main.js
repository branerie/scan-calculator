/* eslint-disable no-undef */
const visitPage = (page) => {
    cy.visit(`http://localhost:3000${page}`)
}

const undo = () => {
    const body = cy.get('body')
    body.trigger('keydown', {  metaKey: true, ctrlKey: true, key: 'z' })
}

const redo = () => {
    const body = cy.get('body')
    body.trigger('keydown', {  metaKey: true, ctrlKey: true, key: 'y' })
}

export {
    visitPage,
    undo,
    redo
}