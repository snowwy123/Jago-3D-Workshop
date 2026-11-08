const {chromium}=require(process.env.PLAYWRIGHT_PATH);
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const p=await browser.newPage({viewport:{width:1450,height:1000},acceptDownloads:true});
    p.setDefaultTimeout(8000);
    const errors=[];
    p.on('pageerror',error=>errors.push(error.message));
    p.on('dialog',dialog=>dialog.accept());
    await p.goto(pathToFileURL(path.resolve(__dirname,'../Jago-3D-Workshop.html')).href);
    await p.waitForFunction(()=>window.JagoWorkshop?.ready);
    await p.getByText('More shapes & starters',{exact:true}).click();
    await p.locator('#primitivePicker').selectOption('tube');
    await p.locator('#addPrimitive').click();
    assert.equal(await p.evaluate(()=>JagoWorkshop.project.objects.at(-1).type),'tube');
    await p.locator('#tubeWall').fill('5');
    await p.locator('#tubeWall').dispatchEvent('change');
    await p.getByText('Linked copies',{exact:true}).click();
    await p.locator('#makeLinked').click();
    let parts=await p.evaluate(()=>JagoWorkshop.project.objects.slice(-2));
    assert.equal(parts[1].linkedSource,parts[0].id);
    const copyX=parts[1].x, copyId=parts[1].id;
    assert.equal(await p.locator('#obj-width').evaluate(e=>e.inert),true);
    assert.equal(await p.locator('#obj-x').evaluate(e=>e.inert),false);
    await p.locator('#linkedEditSource').click();
    await p.locator('#obj-width').fill('90');
    await p.locator('#obj-width').dispatchEvent('change');
    parts=await p.evaluate(()=>JagoWorkshop.project.objects.slice(-2));
    assert.equal(parts[1].width,90);
    assert.equal(parts[1].x,copyX);
    await p.getByRole('button',{name:/^↳ Tube · linked$/}).click();
    assert.equal(await p.evaluate(()=>JagoWorkshop.selected),copyId);
    await p.locator('#linkedDetach').click();
    assert.equal(await p.evaluate(()=>JagoWorkshop.project.objects.at(-1).linkedSource),undefined);
    await p.locator('#constructionPicker').selectOption('Ribbed shade');
    await p.locator('#addConstruction').click();
    assert.equal(await p.evaluate(()=>JagoWorkshop.project.objects.at(-3).count),16);

    for (const type of ['capsule','wedge']) {
      await p.locator('#primitivePicker').selectOption(type);
      await p.locator('#addPrimitive').click();
      assert.equal(await p.evaluate(()=>JagoWorkshop.project.objects.at(-1).type),type);
    }
    for (const name of ['Layered sign','Relief badge','Radial sculpture']) {
      await p.locator('#constructionPicker').selectOption(name);
      await p.locator('#addConstruction').click();
      assert.equal(await p.evaluate(()=>JagoWorkshop.project.objects.at(-1).groupName),name);
    }
    await p.evaluate(key=>JagoWorkshop.loadExampleFixture(key),'pleated-display');
    await p.waitForFunction(()=>JagoWorkshop.project.objects[0]?.sheet?.crease);
    await p.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    const before=await p.locator('#canvas').evaluate(e=>e.toDataURL());
    await p.locator('#output').click();
    await p.locator('[data-out=project]').click();
    await p.getByText('Projector rehearsal & cues',{exact:true}).click();
    await p.locator('#aimRehearsal').click();
    await p.waitForFunction(()=>JagoWorkshop.project.rehearsal.enabled&&!!JagoWorkshop.project.projectorCamera);
    await p.waitForFunction(before=>document.getElementById('canvas').toDataURL()!==before,before);
    await p.locator('#rehearsalName').fill('Grid');
    await p.locator('#saveRehearsalCue').click();
    const artwork=await p.evaluate(()=>{
      const c=document.createElement('canvas');c.width=64;c.height=32;
      const ctx=c.getContext('2d');ctx.fillStyle='#e5763e';ctx.fillRect(0,0,64,32);
      ctx.fillStyle='#14394e';ctx.fillRect(0,0,32,32);
      return c.toDataURL().split(',')[1];
    });
    await p.locator('#rehearsalFile').setInputFiles({name:'Colour bars.png',mimeType:'image/png',buffer:Buffer.from(artwork,'base64')});
    await p.waitForFunction(()=>JagoWorkshop.project.rehearsal.artwork&&JagoWorkshop.project.rehearsal.mix===1);
    await p.locator('#rehearsalName').fill('Warm wash');
    await p.locator('#saveRehearsalCue').click();
    await p.locator('#rehearsalCue').selectOption('0');
    await p.locator('#rehearsalFade').fill('0.1');
    await p.locator('#playRehearsalCue').click();
    await p.waitForFunction(()=>JagoWorkshop.project.rehearsal.mix===0);
    await p.keyboard.press('Escape');
    await p.locator('[data-view=front]').click();
    await p.screenshot({path:path.resolve(__dirname,'../Checks/rehearsal.png')});
    const saved=await p.evaluate(()=>JagoWorkshop.project);
    await p.evaluate(q=>JagoWorkshop.load(q),saved);
    assert.equal(await p.evaluate(()=>JagoWorkshop.project.rehearsal.cues.length),2);
    assert.deepEqual(errors,[]);
    console.log('PASS tube wall, linked dimensions and position, detach, construction starter, rehearsal grid, fade and reload');
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
