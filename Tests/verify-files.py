from pathlib import Path
from zipfile import ZipFile
from PIL import Image
from io import BytesIO
import xml.etree.ElementTree as ET,json,hashlib
r=Path(__file__).parent.parent/'Checks'
with ZipFile(r/'exact-1.zip') as a,ZipFile(r/'exact-2.zip') as b:
 names=sorted(n for n in a.namelist() if n.endswith('.png'));assert len(names)==12
 for n in names:assert a.read(n)==b.read(n),n
 assert a.read(names[0])!=a.read(names[3]);im=Image.open(BytesIO(a.read(names[0])));assert im.size==(320,240)
 meta=json.loads(a.read('sequence.json'));assert meta['fps']==12 and meta['timeStep']==1/12
print('All 12 exact frames match across exports; motion changes the quarter-cycle frame; dimensions and timing metadata verified')
ns={'m':'http://schemas.microsoft.com/3dmanufacturing/core/2015/02'}
for name,expected in [('joined.3mf',12000),('hollow.3mf',None)]:
 with ZipFile(r/name) as z:
  assert {'[Content_Types].xml','_rels/.rels','3D/3dmodel.model'}<=set(z.namelist())
  model=ET.fromstring(z.read('3D/3dmodel.model'));assert model.attrib['unit']=='millimeter'
  points=[tuple(float(v.attrib[k]) for k in ['x','y','z']) for v in model.findall('.//m:vertex',ns)]
  tris=[tuple(int(t.attrib[k]) for k in ['v1','v2','v3']) for t in model.findall('.//m:triangle',ns)]
  edges={};volume=0
  for t in tris:
   for i in range(3):
    e=tuple(sorted((t[i],t[(i+1)%3])));edges[e]=edges.get(e,0)+1
   a,b,c=[points[i] for i in t];volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6
  assert all(n==2 for n in edges.values());assert min(p[2] for p in points)>=-.0001
  if expected:assert abs(volume-expected)<.1
  print(name,'closed indexed topology, Z-up bed placement, volume',round(volume,3),'mm3')

