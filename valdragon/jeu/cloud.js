// ===== Valdragon · sauvegarde en ligne (base de données de l'artefact, sous-arbre privé du joueur) =====
let DB=null,UID=null,init=null,busy=false,pending=null,last='';
function timeout(p,ms){return Promise.race([p,new Promise((_,r)=>setTimeout(()=>r({code:'timeout'}),ms))]);}
export function cloudInit(){if(init)return init;init=(async()=>{try{if(!window.claude||!window.claude.use)return false;
 const [db,user]=await Promise.all([window.claude.use('db'),window.claude.use('user')]);if(!db||!user)return false;const id=await user.id();if(!id)return false;DB=db;UID=id;return true;}catch(e){return false;}})();return init;}
const ref=()=>DB.collection('data/users/'+UID).doc('partie');
export async function cloudLoad(){if(!await cloudInit())return null;try{const s=await timeout(ref().get(),10000);if(!s||!s.exists)return null;const d=s.data();return d&&typeof d.s==='string'?d:null;}catch(e){return null;}}
export function cloudSave(str,t){if(str===last)return;pending={s:str,t};pump();}
async function pump(){if(busy||!pending)return;if(!await cloudInit()){pending=null;return;}busy=true;const p=pending;pending=null;
 try{await ref().set(p);last=p.s;}catch(e){if(e&&e.code==='unavailable'){pending=pending||p;setTimeout(()=>{busy=false;pump();},1500+Math.random()*1500);return;}}
 busy=false;if(pending)pump();}
export const cloudOK=()=>!!DB;
