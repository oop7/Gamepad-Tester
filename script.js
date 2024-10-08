document.addEventListener('DOMContentLoaded', () => {
  const runningElem = document.querySelector('#running');
  const gamepadsElem = document.querySelector('#gamepads');
  const gamepadsByIndex = {};

  const controllerTemplate = `
  <div>
    <div class="head"><div class="index"></div><div class="id"></div></div>
    <div class="info"><div class="label">connected:</div><span class="connected"></span></div>
    <div class="info"><div class="label">mapping:</div><span class="mapping"></span></div>
    <div class="inputs">
      <div class="axes"></div>
      <div class="buttons"></div>
    </div>
  </div>
  `;
  const axisTemplate = `
  <svg viewBox="-2.2 -2.2 4.4 4.4" width="128" height="128">
      <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.04" />
      <path d="M0,-2L0,2M-2,0L2,0" stroke="#888" stroke-width="0.04" />
      <circle cx="0" cy="0" r="0.22" fill="red" class="axis" />
      <text text-anchor="middle" fill="#CCC" x="0" y="2">0</text>
  </svg>
  `;

  const buttonTemplate = `
  <svg viewBox="-2.2 -2.2 4.4 4.4" width="64" height="64">
    <circle cx="0" cy="0" r="2" fill="none" stroke="#888" stroke-width="0.1" />
    <circle cx="0" cy="0" r="0" fill="none" fill="red" class="button" />
    <text class="value" dominant-baseline="middle" text-anchor="middle" fill="#CCC" x="0" y="0">0.00</text>
    <text class="index" alignment-baseline="hanging" dominant-baseline="hanging" text-anchor="start" fill="#CCC" x="-2" y="-2">0</text>
  </svg>
  `;

  function addGamepad(gamepad) {
    console.log('add:', gamepad.index);
    const elem = document.createElement('div');
    elem.innerHTML = controllerTemplate;

    const axesElem = elem.querySelector('.axes');
    const buttonsElem = elem.querySelector('.buttons');
    
    const axes = [];
    for (let ndx = 0; ndx < gamepad.axes.length; ndx += 2) {
      const div = document.createElement('div');
      div.innerHTML = axisTemplate;
      axesElem.appendChild(div);
      axes.push({
        axis: div.querySelector('.axis'),
        value: div.querySelector('text'),
      });
    }

    const buttons = [];
    for (let ndx = 0; ndx < gamepad.buttons.length; ++ndx) {
      const div = document.createElement('div');
      div.innerHTML = buttonTemplate;
      buttonsElem.appendChild(div);
      div.querySelector('.index').textContent = ndx;
      buttons.push({
        circle: div.querySelector('.button'),
        value: div.querySelector('.value'),
      });
    }

    gamepadsByIndex[gamepad.index] = {
      gamepad,
      elem,
      axes,
      buttons,
      index: elem.querySelector('.index'),
      id: elem.querySelector('.id'),
      mapping: elem.querySelector('.mapping'),
      connected: elem.querySelector('.connected'),
    };
    gamepadsElem.appendChild(elem);
  }

  function removeGamepad(gamepad) {
    const info = gamepadsByIndex[gamepad.index];
    if (info) {
      delete gamepadsByIndex[gamepad.index];
      info.elem.parentElement.removeChild(info.elem);
    }
  }

  function addGamepadIfNew(gamepad) {
    const info = gamepadsByIndex[gamepad.index];
    if (!info) {
      addGamepad(gamepad);
    } else {
      info.gamepad = gamepad;
    }
  }

  function handleConnect(e) {
    console.log('connect');
    addGamepadIfNew(e.gamepad);
  }

  function handleDisconnect(e) {
    console.log('disconnect');
    removeGamepad(e.gamepad);
  }

  function updateStatus() {
    const gamepads = navigator.getGamepads();
    const isAnyGamepadConnected = Array.from(gamepads).some(gamepad => gamepad && gamepad.connected);
    runningElem.textContent = isAnyGamepadConnected ? 'Connected' : 'Disconnected';
    runningElem.className = isAnyGamepadConnected ? 'connected' : 'disconnected';
  }

  function processController(info) {
    const {elem, gamepad, axes, buttons} = info;
    const lines = [`gamepad  : ${gamepad.index}`];
    for (const key of ['index', 'id', 'connected', 'mapping']) {
      info[key].textContent = gamepad[key];
    }
    axes.forEach(({axis, value}, ndx) => {
      const off = ndx * 2;
      axis.setAttributeNS(null, 'cx', gamepad.axes[off] * 2);
      axis.setAttributeNS(null, 'cy', gamepad.axes[off + 1] * 2);
      value.textContent = `${gamepad.axes[off].toFixed(2).padStart(5)},${gamepad.axes[off + 1].toFixed(2).padStart(5)}`;
    });
    buttons.forEach(({circle, value}, ndx) => {
      const button = gamepad.buttons[ndx];
      circle.setAttributeNS(null, 'r', button.value * 2);
      circle.setAttributeNS(null, 'fill', button.pressed ? 'red' : 'gray');
      value.textContent = `${button.value.toFixed(2)}`;
    });
  }

  function addNewPads() {
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad) {
        addGamepadIfNew(gamepad);
      }
    }
  }

  function process() {
    updateStatus();
    addNewPads();  // some browsers add by polling, others by event

    Object.values(gamepadsByIndex).forEach(processController);
    requestAnimationFrame(process);
  }
  requestAnimationFrame(process);

  window.addEventListener("gamepadconnected", handleConnect);
  window.addEventListener("gamepaddisconnected", handleDisconnect);
});
