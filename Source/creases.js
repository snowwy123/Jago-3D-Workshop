// SPDX-License-Identifier: MIT
const panelCounts = [2, 3, 4, 6, 8, 12];

export function creaseSettings(value) {
  const angle = Number(value?.angle);
  return {
    panels: panelCounts.includes(value?.panels) ? value.panels : 6,
    angle: Number.isFinite(angle) ? Math.max(-75, Math.min(75, angle)) : 30
  };
}

// Adjacent panels alternate slope. Their lengths stay fixed as the fold opens.
export function creasePoint(u, v, width, height, settings) {
  const {panels, angle} = settings;
  const slope = angle * Math.PI / 180;
  const panelWidth = width / panels;
  const position = Math.min(panels, Math.max(0, u * panels));
  const panel = Math.min(panels - 1, Math.floor(position));
  const fraction = position - panel;
  const depth = (panel % 2 ? 1 - fraction : fraction) * panelWidth * Math.sin(slope);
  return [(u - .5) * width * Math.cos(slope), v * height, depth];
}

export function creaseSVG(width, height, {panels, angle}) {
  const lines = {mountain: [], valley: []};
  for (let index = 1; index < panels; index++) {
    const x = (width * index / panels).toFixed(4);
    const group = (index % 2 === 1) === (angle >= 0) ? 'mountain' : 'valley';
    lines[group].push('<path d="M' + x + ' 0V' + height + '"/>');
  }
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + 'mm" height="' + height +
    'mm" viewBox="0 0 ' + width + ' ' + height + '">' +
    '<g id="cut" fill="none" stroke="#ff0000" stroke-width="0.1"><rect width="' + width + '" height="' + height + '"/></g>' +
    '<g id="score-mountain" fill="none" stroke="#0055cc" stroke-width="0.1">' + lines.mountain.join('') + '</g>' +
    '<g id="score-valley" fill="none" stroke="#008844" stroke-width="0.1">' + lines.valley.join('') + '</g></svg>';
}

export function installCreases({current, commit, download, filename}) {
  const tools = document.getElementById('creaseTools');
  const toggle = document.getElementById('creaseEnabled');
  const panels = document.getElementById('creasePanels');
  const angle = document.getElementById('creaseAngle');
  const exportButton = document.getElementById('creaseExport');
  function sync() {
    const sheet = current()?.sheet;
    tools.hidden = !sheet;
    if (!sheet) return;
    const settings = creaseSettings(sheet.crease);
    toggle.checked = !!sheet.crease;
    panels.value = settings.panels;
    angle.value = settings.angle;
    panels.disabled = angle.disabled = exportButton.disabled = !sheet.crease;
  }
  toggle.onchange = () => commit(() => {
    const sheet = current().sheet;
    if (toggle.checked) sheet.crease = creaseSettings();
    else delete sheet.crease;
  });
  const update = () => commit(() => {
    current().sheet.crease = creaseSettings({panels: Number(panels.value), angle: Number(angle.value)});
  });
  panels.onchange = angle.onchange = update;
  exportButton.onclick = () => {
    const object = current();
    if (!object?.sheet?.crease) return;
    const svg = creaseSVG(object.width, object.height, object.sheet.crease);
    download(new Blob([svg], {type: 'image/svg+xml'}), filename() + '-cut-and-score.svg');
  };
  return {sync};
}

export function pleatedDisplay({fresh, object}) {
  const project = fresh();
  project.name = 'Contour · pleated display';
  project.background = '#26323a';
  project.grid = false;
  project.projection = 'perspective';
  project.camera = {projection:'perspective', position:[175,145,380], target:[0,62,0], fov:38, zoom:1};
  const artwork = document.createElement('canvas');
  artwork.width = 960;
  artwork.height = 480;
  const ctx = artwork.getContext('2d');
  ctx.fillStyle = '#f4d8a4';
  ctx.fillRect(0, 0, 960, 480);
  ctx.fillStyle = '#23343c';
  ctx.font = 'bold 82px sans-serif';
  ctx.fillText('CONTOUR', 55, 110);
  ctx.font = '22px sans-serif';
  ctx.fillText('PAPER / LIGHT / FOLD', 60, 150);
  ctx.lineWidth = 5;
  for (let row = 0; row < 9; row++) {
    ctx.strokeStyle = row % 3 ? '#326766' : '#b24e36';
    ctx.beginPath();
    for (let x = 0; x <= 960; x += 6) {
      const y = 235 + row * 21 + Math.sin(x / 95 + row * .23) * 36;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  project.objects = [object('sheet', {
    name: 'Contour display',
    width: 240,
    height: 120,
    depth: .1,
    y: 0,
    texture: artwork.toDataURL('image/png'),
    sheet: {finish:'paper', crease:{panels:8,angle:32}}
  })];
  return project;
}
