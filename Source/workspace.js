// SPDX-License-Identifier: MIT
export function setupWorkspace() {
  const search = document.getElementById('objectSearch');
  const objects = document.getElementById('objects');
  const status = document.getElementById('objectSearchStatus');
  function filterObjects() {
    const query = search.value.trim().toLocaleLowerCase();
    let visible = 0;
    for (const row of objects.children) {
      const button = row.firstElementChild;
      row.hidden = ![button.textContent, button.title].some(text => text.toLocaleLowerCase().includes(query));
      if (!row.hidden) visible++;
    }
    status.hidden = !query;
    status.textContent = visible ? visible + ' matching objects' : 'No matching objects.';
  }
  search.addEventListener('input', filterObjects);
  new MutationObserver(filterObjects).observe(objects, {childList: true});
  filterObjects();

  const divider = document.getElementById('inspectorDivider');
  const workspace = divider.parentElement;
  const defaultWidth = 285;
  const minimum = 220;
  const storageKey = 'jago-workshop-inspector-width';
  let preferred = defaultWidth;
  try { preferred = Number(localStorage.getItem(storageKey)) || defaultWidth; } catch {}
  let width = defaultWidth;
  let drag = null;
  function updateWidth() {
    const maximum = Math.max(minimum, Math.min(560, workspace.clientWidth - 490));
    width = Math.round(Math.min(maximum, Math.max(minimum, preferred)));
    workspace.style.setProperty('--inspector-width', width + 'px');
    divider.setAttribute('aria-valuemin', minimum);
    divider.setAttribute('aria-valuemax', maximum);
    divider.setAttribute('aria-valuenow', width);
  }
  function saveWidth() {
    preferred = width;
    try { localStorage.setItem(storageKey, String(width)); } catch {}
  }
  divider.addEventListener('pointerdown', event => {
    if (event.button !== 0 || drag) return;
    event.preventDefault();
    divider.focus();
    drag = {id: event.pointerId, x: event.clientX, width};
    divider.setPointerCapture(event.pointerId);
    divider.dataset.dragging = '';
  });
  divider.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    preferred = drag.width + drag.x - event.clientX;
    updateWidth();
  });
  divider.addEventListener('lostpointercapture', () => {
    drag = null;
    delete divider.dataset.dragging;
    saveWidth();
  });
  divider.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home'].includes(event.key)) return;
    event.preventDefault();
    preferred = event.key === 'Home' ? defaultWidth : width + (event.key === 'ArrowLeft' ? 20 : -20);
    updateWidth();
    saveWidth();
  });
  divider.addEventListener('dblclick', () => {
    preferred = defaultWidth;
    updateWidth();
    saveWidth();
  });
  new ResizeObserver(updateWidth).observe(workspace);
  updateWidth();
}
