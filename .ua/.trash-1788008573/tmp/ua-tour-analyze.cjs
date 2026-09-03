const fs=require("fs");
try{
const [inp,out]=process.argv.slice(2);
const {nodes,edges,layers}=JSON.parse(fs.readFileSync(inp));
const ids=new Set(nodes.map(n=>n.id));
const fanIn={},fanOut={},adj={};nodes.forEach(n=>{fanIn[n.id]=0;fanOut[n.id]=0;adj[n.id]=[]});
const pairs={};
for(const e of edges){if(!ids.has(e.source)||!ids.has(e.target))continue;fanOut[e.source]++;fanIn[e.target]++;if(e.type==="imports"||e.type==="calls")adj[e.source].push(e.target);pairs[e.source+"|"+e.target]=(pairs[e.source+"|"+e.target]||0)+1;}
const byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
const rank=(m,k)=>Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([id,v])=>({id,[k]:v,name:byId[id].name}));
const fo=Object.values(fanOut).sort((a,b)=>b-a),fi=Object.values(fanIn).sort((a,b)=>a-b);
const foTop=fo[Math.floor(fo.length*0.1)]||1,fiBot=fi[Math.floor(fi.length*0.25)]||0;
const entryNames=new Set(["index.ts","index.js","main.ts","main.js","main.tsx","app.ts","app.js","app.tsx","server.ts","server.js","mod.rs","main.go","main.py","main.rs","manage.py","app.py","wsgi.py","asgi.py","run.py","__main__.py","Application.java","Main.java","Program.cs","config.ru","index.php","App.swift","Application.kt","main.cpp","main.c"]);
const cands=nodes.map(n=>{let s=0;const depth=n.filePath.split("/").length;
if(n.type==="document"){if(n.name==="README.md"&&depth===1)s+=5;else if(n.name.endsWith(".md")&&depth===1)s+=2;}
else{if(entryNames.has(n.name))s+=3;if(depth<=2)s+=1;if(fanOut[n.id]>=foTop&&fanOut[n.id]>0)s+=1;if(fanIn[n.id]<=fiBot)s+=1;}
return{id:n.id,score:s,name:n.name,summary:n.summary,type:n.type};}).sort((a,b)=>b.score-a.score);
const entryCands=cands.slice(0,5);
const start=cands.find(c=>c.type==="file")?.id;
const depthMap={},order=[];if(start){depthMap[start]=0;const q=[start];while(q.length){const c=q.shift();order.push(c);for(const t of adj[c])if(!(t in depthMap)){depthMap[t]=depthMap[c]+1;q.push(t);}}}
const byDepth={};for(const [k,v] of Object.entries(depthMap))(byDepth[v]=byDepth[v]||[]).push(k);
const nc={documentation:[],infrastructure:[],data:[],config:[]};
for(const n of nodes){const r={id:n.id,name:n.name,type:n.type,summary:n.summary};if(n.type==="document")nc.documentation.push(r);else if(["service","pipeline","resource"].includes(n.type))nc.infrastructure.push(r);else if(["table","schema","endpoint"].includes(n.type))nc.data.push(r);else if(n.type==="config")nc.config.push(r);}
const clusters=[];const used=new Set();
for(const k of Object.keys(pairs)){const [a,b]=k.split("|");if(a<b&&pairs[b+"|"+a]&&!used.has(a)&&!used.has(b)){const c=new Set([a,b]);for(const n of nodes){if(c.size>=5)break;if(c.has(n.id))continue;let cnt=0;for(const m of c)if(pairs[n.id+"|"+m]||pairs[m+"|"+n.id])cnt++;if(cnt>=2)c.add(n.id);}let ec=0;for(const x of c)for(const y of c)if(pairs[x+"|"+y])ec++;c.forEach(x=>used.add(x));clusters.push({nodes:[...c],edgeCount:ec});}}
clusters.sort((a,b)=>b.edgeCount-a.edgeCount);
const idx={};nodes.forEach(n=>idx[n.id]={name:n.name,type:n.type,summary:n.summary,filePath:n.filePath});
fs.writeFileSync(out,JSON.stringify({scriptCompleted:true,entryPointCandidates:entryCands,fanInRanking:rank(fanIn,"fanIn"),fanOutRanking:rank(fanOut,"fanOut"),bfsTraversal:{startNode:start,order,depthMap,byDepth},nonCodeFiles:nc,clusters:clusters.slice(0,10),layers:{count:layers.length,list:layers},nodeSummaryIndex:idx,totalNodes:nodes.length,totalEdges:edges.length},null,1));
}catch(e){console.error(e);process.exit(1)}
