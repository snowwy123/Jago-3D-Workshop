from pathlib import Path
import urllib.request,json,tarfile,io,hashlib,base64
r=Path(__file__).parent
versions={}
pinned=json.loads((r/"dependency-versions.json").read_text(encoding="utf-8")) if (r/"dependency-versions.json").exists() else {}
for name in ['three','esbuild','@esbuild/win32-x64']:
 meta=json.load(urllib.request.urlopen('https://registry.npmjs.org/'+name.replace('/','%2f')))
 version=pinned.get(name) or (versions.get('esbuild') if name.startswith('@') else meta['dist-tags']['latest'])
 data=meta['versions'][version];versions[name]=version
 raw=urllib.request.urlopen(data['dist']['tarball']).read()
 integrity=data['dist'].get('integrity','')
 if integrity.startswith('sha512-') and base64.b64encode(hashlib.sha512(raw).digest()).decode()!=integrity[7:]:raise ValueError('Dependency integrity failed: '+name)
 target=r/'node_modules'/name;target.mkdir(parents=True,exist_ok=True)
 with tarfile.open(fileobj=io.BytesIO(raw),mode='r:gz') as archive:
  for member in archive.getmembers():
   rel=Path(*Path(member.name).parts[1:]);dest=(target/rel).resolve()
   if not dest.is_relative_to(target.resolve()) or not member.isfile():continue
   dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(archive.extractfile(member).read())
(r/'dependency-versions.json').write_text(json.dumps(versions,indent=2),encoding='utf-8')
print(versions)
