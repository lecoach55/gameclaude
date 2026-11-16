// Donjon 3D du Trône de Braise : aucune sauvegarde propre (la partie vit dans le royaume, document « partie » du Trône).
// Ce module remplace celui de Valdragon pour ne JAMAIS écrire dans la base de l'artefact.
export function cloudInit(){return Promise.resolve(false);}
export async function cloudLoad(){return null;}
export function cloudSave(){}
export const cloudOK=()=>false;
export async function cloudPut(){return false;}
