// Donjon 3D du Trône de Braise : aucune sauvegarde propre (la partie vit dans le royaume, document « partie » du Trône).
// Ce module remplace celui de Valdragon pour ne JAMAIS écrire dans la base de l'artefact ni dans localStorage.
// Seule exception : les mesures (🧪 banc) et signalements (🐞) sont confiés à la page du royaume, qui les envoie
// avec sa trousse de test (documents mesures_* / signalement_* uniquement, jamais « partie »).
export function cloudInit(){return Promise.resolve(false);}
export async function cloudLoad(){return null;}
export function cloudSave(){}
export const cloudOK=()=>false;
let n=0;const att=new Map();
addEventListener('message',ev=>{const m=ev.data;if(!m||m.t!=='tk3d-ok'||ev.source!==parent)return;const f=att.get(m.n);if(f){att.delete(m.n);f(!!m.ok);}});
export function cloudPut(id,obj){
 if(!/^(mesures|signalement)_/.test(id)||parent===window)return Promise.resolve(false);
 return new Promise(r=>{const k=++n;att.set(k,r);setTimeout(()=>{if(att.has(k)){att.delete(k);r(false);}},15000);
  try{parent.postMessage({t:'tk3d',n:k,id,doc:obj},'*');}catch(e){att.delete(k);r(false);}});
}
