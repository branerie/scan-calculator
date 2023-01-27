/* eslint-disable no-undef */

const DELETE_KEY = 46;
const ENTER_KEY = 13;
const ESCAPE_KEY = 27;

const click = (clientX, clientY) => {
  const canvas = cy.get("canvas");
  canvas.trigger("mousemove", { clientX, clientY });
  canvas.click(clientX, clientY);
};

const pressEnter = () => {
  const canvas = cy.get("canvas");
  canvas.trigger("keydown", { key: ENTER_KEY });
};

const pressEscape = () => {
  const canvas = cy.get("canvas");
  canvas.trigger("keydown", { key: ESCAPE_KEY });
};

const pressDelete = () => {
  const canvas = cy.get("canvas");
  canvas.trigger("keydown", { key: DELETE_KEY });
};

const selectTool = toolName => {
  cy.get(`input[name="${toolName}"]`).click();
};

const matchSnapshot = () => {
  cy.get("body").toMatchImageSnapshot();
};

const moveMouse = (clientX, clientY) => {
  const canvas = cy.get("canvas");
  canvas.trigger("mousemove", { clientX, clientY });
};

const mousePan = (startX, startY, endX, endY) => {
  const canvas = cy.get("canvas");
  canvas.trigger("mousedown", { clientX: startX, clientY: startY, button: 1 });
  canvas.trigger("mousemove", { clientX: endX, clientY: endY, buttons: 4 });

  canvas.trigger("auxclick", { clientX: endX, clientY: endY });
};

const zoom = (nSteps, clientX, clientY, isZoomOut = true) => {
  const canvas = cy.get("canvas");
  for (let i = 0; i < nSteps; i++) {
    canvas.trigger("wheel", { deltaY: isZoomOut ? 1 : -1, clientX, clientY });
  }
};

export {
  click,
  moveMouse,
  mousePan,
  zoom,
  pressDelete,
  pressEnter,
  pressEscape,
  selectTool,
  matchSnapshot
};
