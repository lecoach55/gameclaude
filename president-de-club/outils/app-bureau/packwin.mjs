import { packager } from '@electron/packager';
const p = await packager({ dir:'./app', name:'President de Club', executableName:'President de Club', platform:'win32', arch:'x64', out:'./distwin', overwrite:true, electronVersion:'33.2.1' });
console.log(p);
