const {chromium}=require(process.env.PLAYWRIGHT_PATH);
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs/promises');
const {unzipSync,strFromU8}=require('fflate');

(async()=>{
  const browser=await chromium.launch({channel:'msedge',headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1450,height:1000},acceptDownloads:true});
    const errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    page.on('dialog',dialog=>dialog.accept());
    page.setDefaultTimeout(12000);
    const click=id=>page.locator('#'+id).click();
    const select=(id,value)=>page.locator('#'+id).selectOption(value);
    const download=async id=>{
      const pending=page.waitForEvent('download');
      await click(id);
      return fs.readFile(await (await pending).path());
    };
    await page.goto(pathToFileURL(path.resolve(__dirname,'../Jago-3D-Workshop.html')).href);
    await page.waitForFunction(()=>window.JagoWorkshop?.ready);
    assert.deepEqual(await page.locator('#examples option').evaluateAll(options=>options.map(option=>option.value)),
      ['', 'shadow-relay','signal-pavilion','paper-delta','strata-relief','viewpoint-offset']);
    await click('openShadow');
    await page.waitForFunction(()=>document.querySelector('#shadowCanvas').getContext('2d').getImageData(320,240,1,1).data[3]===255);
    const mask=await download('shadowPNG');
    assert.equal(mask[0],137);
    assert.equal(mask.readUInt32BE(16),960);
    await click('fitShadow');
    await click('saveShadowLight');
    assert.equal(await page.evaluate(()=>JagoWorkshop.project.shadowLab.lights.length),3);
    assert.ok(await page.evaluate(()=>JagoWorkshop.project.shadowLab.frame));
    await click('closeShadow');

    await click('openSpecialist');
    const box=(await download('kitDownload')).toString();
    assert.match(box,/id="cut"/);
    assert.match(box,/id="score"/);
    assert.match(box,/GLUE/);
    await select('kitType','prism');
    const prism=(await download('kitDownload')).toString();
    assert.match(prism,/End A/);
    assert.notEqual(box,prism);
    await select('kitType','box');
    await click('kitAssemble');
    await page.waitForFunction(()=>JagoWorkshop.project.objects.at(-1)?.name==='Paper box mockup');
    await click('openSpecialist');
    await page.locator('[data-lab-tab=stack]').click();
    await click('layerCheck');
    assert.match(await page.locator('#specialistStatus').textContent(),/9 layers.*2 registration holes/);
    const stack=unzipSync(await download('layerExport'));
    assert.equal(Object.keys(stack).filter(name=>name.endsWith('.svg')).length,9);
    assert.match(strFromU8(stack['layer-01.svg']),/Layer 01/);
    await click('layerAssemble');
    await page.waitForFunction(()=>JagoWorkshop.project.objects.at(-1)?.groupName==='Stacked relief');
    assert.equal(await page.evaluate(()=>JagoWorkshop.project.objects.filter(o=>o.groupName==='Stacked relief').length),9);

    await click('new');
    await page.waitForFunction(()=>JagoWorkshop.project.objects.length===0);
    await click('openSpecialist');
    await page.locator('[data-lab-tab=align]').click();
    await click('alignmentBuild');
    await page.waitForFunction(()=>JagoWorkshop.project.alignment);
    const letters=await page.evaluate(()=>JagoWorkshop.project.objects.map(o=>({text:o.text,z:o.z})));
    assert.equal(letters.map(o=>o.text).join(''),'JAGO');
    assert.ok(new Set(letters.map(o=>o.z)).size>1);
    await click('openSpecialist');
    await page.locator('[data-lab-tab=align]').click();
    const guide=unzipSync(await download('alignmentExport'));
    assert.ok(guide['alignment.png']&&guide['camera.json']);
    assert.match(strFromU8(guide['placement.csv']),/x_mm/);
    await click('closeSpecialist');

    await click('output');
    await page.locator('[data-out=image]').click();
    await page.locator('#outputWidth').fill('320');
    await page.locator('#outputHeight').fill('240');
    await page.locator('#transparent').check();
    const sprites=unzipSync(await download('pulseSheet'));
    const metadata=JSON.parse(strFromU8(sprites['sprite-sheet.json']));
    assert.deepEqual([metadata.columns,metadata.rows,metadata.frames,metadata.fps],[6,4,24,12]);
    const sprite=Buffer.from(sprites['workshop-sprites.png']);
    assert.equal(sprite.readUInt32BE(16),metadata.width*6);
    assert.equal(sprite.readUInt32BE(20),metadata.height*4);
    assert.equal(sprite[25],6);
    const checks=path.resolve(__dirname,'../Checks');
    await fs.mkdir(checks,{recursive:true});
    await fs.writeFile(path.join(checks,'alignment.png'),guide['alignment.png']);
    await fs.writeFile(path.join(checks,'shadow.png'),mask);
    await fs.writeFile(path.join(checks,'workshop-sprites.png'),sprite);
    await page.keyboard.press('Escape');
    const names={
      'shadow-relay':'Shadow Relay','signal-pavilion':'Signal Pavilion','paper-delta':'Delta · paper prism',
      'strata-relief':'Strata · layered sculpture','viewpoint-offset':'Offset · perspective lettering'
    };
    for(const [key,name] of Object.entries(names)){
      await select('examples',key);
      await page.waitForFunction(name=>JagoWorkshop.project.name===name,name);
      await click('output');
      await page.locator('[data-out=image]').click();
      await page.locator('#outputWidth').fill('640');
      await page.locator('#outputHeight').fill('480');
      await page.locator('#transparent').uncheck();
      await fs.writeFile(path.join(checks,key+'.png'),await download('png'));
      await page.keyboard.press('Escape');
    }
    await select('examples','paper-delta');
    await page.waitForFunction(()=>JagoWorkshop.project.name==='Delta · paper prism');
    await click('openSpecialist');
    assert.equal(await page.locator('#kitType').inputValue(),'prism');
    assert.match((await download('kitDownload')).toString(),/id="print-artwork"/);
    await click('closeSpecialist');
    assert.deepEqual(errors,[]);
    console.log('PASS shadow PNG, A4 nets, closed-solid slices and registration, assembled stack, perspective guide, alpha sprite sheet');
    if(process.env.WORKSHOP_PULSE_HTML) {
      const pulse=await browser.newPage({viewport:{width:1440,height:900}});
      await pulse.goto(pathToFileURL(process.env.WORKSHOP_PULSE_HTML).href);
      await pulse.waitForFunction(()=>window.PulseDesign);
      await pulse.locator('#files').setInputFiles({name:'workshop-sprites.png',mimeType:'image/png',buffer:sprite});
      await pulse.waitForFunction(()=>project.assets.some(asset=>asset.name==='workshop-sprites.png'));
      await pulse.waitForFunction(()=>images.has(project.assets.find(asset=>asset.name==='workshop-sprites.png').id));
      assert.equal(await pulse.evaluate(()=>{
        const asset=project.assets.find(asset=>asset.name==='workshop-sprites.png');
        const canvas=document.createElement('canvas');
        const scene={...project.scenes[0],duration:2,layers:[],experimental:PulseExperimental.normalise({
          engine:'design',design:{parts:[{type:'image',asset:asset.id,x:.5,y:.5,width:1,height:1,
            sheetCols:6,sheetRows:4,frames:24,fps:12}]}
        })};
        const q={...project,width:320,height:240,duration:2,transparent:true,loop:false,scenes:[scene]};
        Pulse.render(canvas,q,0,images);const first=canvas.toDataURL();
        Pulse.render(canvas,q,.75,images);
        return first!==canvas.toDataURL();
      }),true);
      console.log('PASS Workshop sprite sheet imports and renders distinct frames in Pulse');
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
