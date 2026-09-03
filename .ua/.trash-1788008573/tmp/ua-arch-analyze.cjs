const fs=require('fs');const [,,inp,out]=process.argv;
try{
const d=JSON.parse(fs.readFileSync(inp));const nodes=d.fileNodes,imps=d.importEdges||[],all=d.allEdges||[];
const grp=p=>{const s=p.split('/');return s.length>1?s[0]:'(root)'};
const directoryGroups={},nodeTypeGroups={},byId={};
for(const n of nodes){byId[n.id]=n;(directoryGroups[grp(n.filePath)]??=[]).push(n.id);(nodeTypeGroups[n.type]??=[]).push(n.id)}
const fanIn={},fanOut={},ig={},intra={};
for(const e of imps){const a=byId[e.source],b=byId[e.target];if(!a||!b)continue;fanOut[e.source]=(fanOut[e.source]||0)+1;fanIn[e.target]=(fanIn[e.target]||0)+1;const g1=grp(a.filePath),g2=grp(b.filePath);const k=g1+'->'+g2;ig[k]=(ig[k]||0)+1;for(const g of new Set([g1,g2])){intra[g]??={internalEdges:0,totalEdges:0};intra[g].totalEdges++;if(g1===g2)intra[g].internalEdges++}}
for(const g in intra)intra[g].density=intra[g].totalEdges?+(intra[g].internalEdges/intra[g].totalEdges).toFixed(2):0;
const cc={};for(const e of all){const a=byId[e.source],b=byId[e.target];if(!a||!b)continue;const k=a.type+'|'+b.type+'|'+e.type;cc[k]=(cc[k]||0)+1}
const interGroupImports=Object.entries(ig).map(([k,c])=>{const [from,to]=k.split('->');return{from,to,count:c}}).filter(x=>x.from!==x.to);
const dependencyDirection=[];for(const x of interGroupImports){const rev=ig[x.to+'->'+x.from]||0;if(x.count>rev)dependencyDirection.push({dependent:x.from,dependsOn:x.to})}
const pat={routes:'api',components:'ui',features:'ui',hooks:'hooks',lib:'utility',config:'config',data:'data',test:'test',styles:'assets',public:'assets','src-tauri':'infrastructure','.github':'ci-cd',i18n:'config'};
const patternMatches={};for(const g in directoryGroups)patternMatches[g]=pat[g]||'unknown';
const paths=nodes.map(n=>n.filePath);
const infraFiles=paths.filter(p=>/Dockerfile|docker-compose|\.tf$|\.github\/workflows|src-tauri/.test(p));
const res={scriptCompleted:true,directoryGroups,nodeTypeGroups,crossCategoryEdges:Object.entries(cc).map(([k,c])=>{const [fromType,toType,edgeType]=k.split('|');return{fromType,toType,edgeType,count:c}}),interGroupImports,intraGroupDensity:intra,patternMatches,
deploymentTopology:{hasDockerfile:paths.some(p=>/Dockerfile/.test(p)),hasCompose:paths.some(p=>/docker-compose/.test(p)),hasK8s:false,hasTerraform:false,hasCI:paths.some(p=>/\.github\/workflows/.test(p)),infraFiles},
dataPipeline:{schemaFiles:paths.filter(p=>/zod|\.proto|\.graphql/.test(p)),migrationFiles:[],dataModelFiles:paths.filter(p=>/generated\/models/.test(p)),apiHandlerFiles:paths.filter(p=>/^src\/routes/.test(p))},
docCoverage:(()=>{const gs=Object.keys(directoryGroups);const w=gs.filter(g=>directoryGroups[g].some(id=>/\.md$/i.test(byId[id].filePath)));return{groupsWithDocs:w.length,totalGroups:gs.length,coverageRatio:+(w.length/gs.length).toFixed(2),undocumentedGroups:gs.filter(g=>!w.includes(g))}})(),
dependencyDirection,fileStats:{totalFileNodes:nodes.length,filesPerGroup:Object.fromEntries(Object.entries(directoryGroups).map(([g,v])=>[g,v.length])),nodeTypeCounts:Object.fromEntries(Object.entries(nodeTypeGroups).map(([g,v])=>[g,v.length]))},fileFanIn:fanIn,fileFanOut:fanOut};
fs.writeFileSync(out,JSON.stringify(res,null,2));
}catch(e){console.error(e);process.exit(1)}
