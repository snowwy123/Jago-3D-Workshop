// SPDX-License-Identifier: MIT
export function setupWorkspace(measure) {
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
  new MutationObserver(filterObjects).observe(objects, {childList: true, subtree: true, attributes: true, attributeFilter: ['title']});
  filterObjects();

  const report = document.getElementById('measureReport');
  const panel = document.getElementById('measurementTools');
  const scope = document.getElementById('measureScope');
  const units = document.getElementById('measureUnits');
  const format = new Intl.NumberFormat(undefined, {maximumFractionDigits: 2});
  function refreshMeasurements() {
    if (!panel.open) return;
    const result = measure(scope.value);
    if (!result) {
      report.textContent = scope.value === 'selection' ? 'Select an object to measure.' : 'No visible objects to measure.';
      return;
    }
    const unit = units.value;
    const factor = {mm: 1, cm: 10, in: 25.4}[unit];
    const value = mm => format.format(mm / factor) + ' ' + unit;
    const lines = result.size.map((size, index) => ['Width (X)', 'Height (Y)', 'Depth (Z)'][index] + ' · ' + value(size));
    lines.push('Lowest point relative to stage surface · ' + value(result.clearance));
    if (result.centreDistance !== null) lines.push('Bounds centres apart · ' + value(result.centreDistance));
    lines.push('Dimensions use world-aligned bounds, including rotation.');
    report.textContent = lines.join('\n');
  }
  panel.addEventListener('toggle', refreshMeasurements);
  scope.addEventListener('change', refreshMeasurements);
  units.addEventListener('change', refreshMeasurements);
  document.getElementById('measureSelection').addEventListener('click', refreshMeasurements);

  const divider = document.getElementById('inspectorDivider');
  const workspace = divider.parentElement;
  const defaultWidth = 285;
  const minimum = 220;
  const storageKey = 'jago-workshop-inspector-width';
  let preferred = null;
  try { preferred = Number(localStorage.getItem(storageKey)) || null; } catch {}
  let width = defaultWidth;
  let drag = null;
  function updateWidth() {
    const maximum = Math.max(minimum, Math.min(560, workspace.clientWidth - 490));
    width = Math.round(Math.min(maximum, Math.max(minimum, preferred ?? (workspace.clientWidth < 1000 ? 245 : defaultWidth))));
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
    preferred = event.key === 'Home' ? null : width + (event.key === 'ArrowLeft' ? 20 : -20);
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
  return {refreshMeasurements};
}
