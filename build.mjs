import {build} from 'esbuild';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const worker=await build({entryPoints:['Source/print-worker.js'],bundle:true,write:false,format:'iife',target:'es2022',platform:'browser',loader:{'.wasm':'binary'},external:['node:*'],minify:true});fs.writeFileSync('Source/print-worker-source.js','export default '+JSON.stringify(worker.outputFiles[0].text)+';');
const result=await build({entryPoints:['Source/app.js'],bundle:true,write:false,format:'iife',target:'es2022',minify:true,legalComments:'inline'});
const html=fs.readFileSync('Source/index.html','utf8').replace('/*APP_STYLE*/',fs.readFileSync('Source/style.css','utf8')).replace('/*APP_SCRIPT*/',()=>result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script'));
fs.writeFileSync('Jago-3D-Workshop.html',html);fs.writeFileSync('index.html',html);console.log('Built offline 3D workshop');
