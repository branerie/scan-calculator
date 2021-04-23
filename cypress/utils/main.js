/* eslint-disable no-undef */
const visitPage = (page) => {
    cy.visit(`http://localhost:3000${page}`)
}

export {
    visitPage
}