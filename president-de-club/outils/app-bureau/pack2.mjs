import { packager } from '@electron/packager';
const p = await packager({ dir:'./app', name:'President de Club', executableName:'President de Club', platform:'darwin', arch:['x64','arm64'], icon:'./icon.icns', out:'./dist2', overwrite:true, appBundleId:'fr.president-de-club.app', appCategoryType:'public.app-category.sports-games', electronVersion:'33.2.1', appVersion:'2.9.0', appCopyright:'Président de Club', extendInfo:{CFBundleDisplayName:'Président de Club', LSMinimumSystemVersion:'11.0'} });
console.log(p);
