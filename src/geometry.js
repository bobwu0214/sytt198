import { Box3, Vector3 } from 'three';
export function analyzeGeometry(geometries, scale=1) {
  if(!Number.isFinite(scale)||scale<=0)throw new Error('无效缩放');
  const box=new Box3(),a=new Vector3(),b=new Vector3(),c=new Vector3(),ab=new Vector3(),ac=new Vector3(),cross=new Vector3();
  let area=0,volume=0,triangles=0,badEdges=0,degenerate=0;
  for(const g of geometries){
    const p=g.getAttribute('position');if(!p||p.count<3)throw new Error('文件没有有效三角形');
    for(let i=0;i<p.count;i++){a.fromBufferAttribute(p,i);if(![a.x,a.y,a.z].every(Number.isFinite))throw new Error('模型包含无效坐标');box.expandByPoint(a);}
  }
  if(box.isEmpty())throw new Error('空模型');
  const origin=box.getCenter(new Vector3());
  const epsilon=Math.max(box.getSize(new Vector3()).length()*1e-7,1e-9);
  const key=v=>[v.x,v.y,v.z].map(x=>Math.round(x/epsilon)).join(',');
  for(const g of geometries){
    const edges=new Map(),p=g.getAttribute('position'),idx=g.index,count=idx?idx.count:p.count;let signed=0;
    if(count%3)throw new Error('三角形索引不完整');
    for(let i=0;i<count;i+=3){
      a.fromBufferAttribute(p,idx?idx.getX(i):i).sub(origin);b.fromBufferAttribute(p,idx?idx.getX(i+1):i+1).sub(origin);c.fromBufferAttribute(p,idx?idx.getX(i+2):i+2).sub(origin);
      ab.subVectors(b,a);ac.subVectors(c,a);cross.crossVectors(ab,ac);const triangleArea=cross.length()/2;
      if(triangleArea<epsilon*epsilon){degenerate++;continue;}
      area+=triangleArea;signed+=a.dot(cross.crossVectors(b,c))/6;triangles++;
      const keys=[key(a),key(b),key(c)];
      for(let e=0;e<3;e++){const x=keys[e],y=keys[(e+1)%3],k=x<y?x+'|'+y:y+'|'+x;const v=edges.get(k)||[0,0];v[0]++;v[1]+=x<y?1:-1;edges.set(k,v);}
    }
    for(const [count,orientation]of edges.values())if(count!==2||orientation!==0)badEdges++;
    volume+=Math.abs(signed);
  }
  if(!triangles)throw new Error('模型没有非退化三角形');
  const size=box.getSize(new Vector3()).multiplyScalar(scale).toArray();
  return {volume:volume*scale**3/1000,area:area*scale**2/100,size,triangles,closed:badEdges===0,badEdges,degenerate};
}
