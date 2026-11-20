import AsyncStorage from '@react-native-async-storage/async-storage';
export const STORE_KEY = 'didyou.android.prototype.v1';
export const INITIAL = {
 answers:{}, saved:[], wishlist:[], myStories:{}, myReplies:{}, myQuestions:[], likes:[],
 visibleDids:[], pinnedDids:[], hideDark:false,
 profile:{name:'Story Seeker',username:'storyseeker',bio:'Collecting moments, one “did you?” at a time ✨',instagram:'',photo:''}
};
export async function loadState() {
 try{
   const json=await AsyncStorage.getItem(STORE_KEY);if(!json)return structuredCloneSafe(INITIAL);
   const old=JSON.parse(json);if(!old||typeof old!=='object')return structuredCloneSafe(INITIAL);
   return {...structuredCloneSafe(INITIAL),...old,profile:{...INITIAL.profile,...old.profile}};
 }catch{return structuredCloneSafe(INITIAL)}
}
export async function saveState(data){await AsyncStorage.setItem(STORE_KEY,JSON.stringify(data))}
export async function resetState(){await AsyncStorage.removeItem(STORE_KEY);return structuredCloneSafe(INITIAL)}
function structuredCloneSafe(x){return JSON.parse(JSON.stringify(x))}
