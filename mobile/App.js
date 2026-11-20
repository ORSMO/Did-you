import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, ScrollView, FlatList, Animated,
  PanResponder, Dimensions, Image, KeyboardAvoidingView, Platform,
  Alert, StatusBar, Linking, StyleSheet
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { SEED_QUESTIONS } from './src/seed';
import { DEMO_REPLIES } from './src/demoThreads';
import { C, MOODS, META } from './src/theme';
import { INITIAL, loadState, saveState, resetState } from './src/store';

const WIDTH = Dimensions.get('window').width;
const navigation = [
  { key: 'Swipe', icon: '◈' }, { key: 'Explore', icon: '⌕' },
  { key: 'Create', icon: '+' }, { key: 'My Life', icon: '▤' }, { key: 'Profile', icon: '◉' }
];
const makeId = (prefix) => prefix + '-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 100000).toString(36);
const category = (value) => META[value] || META.Personal;
const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g,' ').replace(/\b(did|you|ever)\b/g,'').trim();
const titleOf = (value) => {
  const trimmed=value.trim().replace(/[?.!]+$/,'');
  return (/^did you\b/i.test(trimmed) ? trimmed : 'Did you ever ' + trimmed) + '?';
};

function Pill({ children, selected, onPress, tint }) {
  return <Pressable onPress={onPress} style={[s.pill,selected && s.pillSelected, tint && {borderColor:tint}]}>
    <Text style={[s.pillText,selected && s.pillTextSelected]}>{children}</Text>
  </Pressable>;
}
function Action({label,onPress,kind='dark',small=false,disabled=false}) {
  return <Pressable disabled={disabled} accessibilityRole="button" onPress={onPress}
    style={[s.action,kind==='primary' && s.actionPrimary,kind==='outline' && s.actionOutline,small && s.actionSmall,disabled && {opacity:.5}]}>
    <Text style={[s.actionText,kind==='primary' && s.actionTextPrimary,small && {fontSize:11}]}>{label}</Text>
  </Pressable>;
}
function Avatar({data,size=44}) {
 const uri=data.profile?.photo;
 return <View style={[s.avatar,{width:size,height:size,borderRadius:size*.31}]}>
   {uri ? <Image source={{uri}} style={{width:'100%',height:'100%',borderRadius:size*.31}}/> :
     <Text style={{fontSize:size*.46,color:'#40275F'}}>✦</Text>}
 </View>;
}
function ScreenTitle({eyebrow,title,description}) {
 return <View style={{marginBottom:14}}>
  <Text style={s.eyebrow}>{eyebrow}</Text>
  <Text style={s.pageTitle}>{title}</Text>
  {description ? <Text style={s.subtle}>{description}</Text> : null}
 </View>;
}
function QuestionRow({q,onOpen,accessory}) {
 return <Pressable onPress={()=>onOpen(q.id)} style={s.questionRow}>
   <View style={[s.questionThumb,{backgroundColor:category(q.category).colors[0]}]}><Text style={{fontSize:29}}>{q.emoji}</Text></View>
   <View style={{flex:1,minWidth:0}}>
     <Text style={s.rowCategory}>{q.category.toUpperCase()}</Text>
     <Text numberOfLines={2} style={s.rowTitle}>{q.title}</Text>
     <Text style={s.rowSmall}>{q.stories?.length || 0} sample stories</Text>
   </View>
   {accessory || <Text style={{fontSize:18,color:C.muted}}>›</Text>}
 </Pressable>;
}
function SwipeCard({question:q,onVote,onStories}) {
 const position=useRef(new Animated.ValueXY()).current;
 const busy=useRef(false);
 const rotate=position.x.interpolate({inputRange:[-WIDTH,0,WIDTH],outputRange:['-22deg','0deg','22deg'],extrapolate:'clamp'});
 const labelOpacity=position.x.interpolate({inputRange:[-100,0,100],outputRange:[1,0,1],extrapolate:'clamp'});
 const [direction,setDirection]=useState('yes');
 const submit=(value)=>{
   if(busy.current)return;
   busy.current=true;
   setDirection(value);
   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(()=>{});
   Animated.timing(position,{toValue:{x:value==='yes'?WIDTH+90:-WIDTH-90,y:-20},duration:245,useNativeDriver:false})
     .start(()=>onVote(q.id,value));
 };
 const pan=useMemo(()=>PanResponder.create({
   onMoveShouldSetPanResponder:(_e,g)=>Math.abs(g.dx)>10&&Math.abs(g.dx)>Math.abs(g.dy)*1.25,
   onPanResponderMove:Animated.event([null,{dx:position.x,dy:position.y}],{useNativeDriver:false}),
   onPanResponderRelease:(_e,g)=>{
     if(Math.abs(g.dx)>80 || (Math.abs(g.dx)>43 && Math.abs(g.vx)>0.65)){
       submit(g.dx>0?'yes':'no');
     }else{
       Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:false,bounciness:8}).start();
     }
   },
   onPanResponderTerminate:()=>Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:false}).start()
 }),[q.id]);
 const c=category(q.category);
 return <View style={{flex:1,minHeight:0}}>
   <View style={[s.backCard,{backgroundColor:c.colors[1]}]}/>
   <Animated.View {...pan.panHandlers} style={[s.swipeCard,{backgroundColor:c.colors[0],transform:[...position.getTranslateTransform(),{rotate}]}]}>
     <View pointerEvents="none" style={s.cardRing}/>
     <View style={s.cardTop}>
       <View style={s.tag}><Text style={s.tagText}>{q.emoji} {q.category}</Text></View>
       <Pressable onPress={onStories} style={s.storyBubble}><Text style={s.storyBubbleText}>💬 Stories ↗</Text></Pressable>
     </View>
     <View style={s.cardCenter}><Text style={s.bigEmoji}>{q.emoji}</Text></View>
     <View style={s.cardBottom}>
       <Text numberOfLines={4} adjustsFontSizeToFit style={s.cardQuestion}>{q.title}</Text>
       <Text numberOfLines={2} style={s.cardSub}>{q.description}</Text>
     </View>
     <Animated.View pointerEvents="none" style={[s.swipeStamp,{opacity:labelOpacity,borderColor:direction==='yes'?'#E4FFB3':'#FFE0EC'}]}>
       <Text style={s.stampText}>{direction==='yes'?'YES!':'NOPE!'}</Text>
     </Animated.View>
   </Animated.View>
   <View style={s.voteRow}>
     <Action label="✕  No, I didn't" kind="outline" onPress={()=>submit('no')}/>
     <Action label="✓  Yes, I did" kind="primary" onPress={()=>submit('yes')}/>
   </View>
 </View>;
}
function SwipeScreen({questions,data,onAnswer,onOpen,onSave,onUndo,last,setLast}) {
 const [mood,setMood]=useState('All');
 const [skipped,setSkipped]=useState([]);
 const deck=questions.filter(q=>(mood==='All'||q.category===mood)&&(!data.hideDark||q.category!=='Dark'));
 const q=deck.find(item=>!data.answers[item.id]&&!skipped.includes(item.id));
 const remaining=deck.filter(item=>!data.answers[item.id]&&!skipped.includes(item.id)).length;
 const vote=(id,value)=>{onAnswer(id,value);setLast({id,value});};
 const skip=()=>{if(q)setSkipped(prev=>[...prev,q.id])};
 const undone=()=>{if(last){onUndo(last.id);setLast(null)}};
 return <View style={s.swipeScreen}>
   <View style={s.swipeHeading}>
     <View><Text style={s.eyebrow}>DISCOVER YOUR LIFE ✦</Text><Text style={s.swipeHeadingText}>Have you ever...</Text></View>
     <View style={{alignItems:'flex-end'}}><Text style={s.counterStrong}>{Object.keys(data.answers).length} answered</Text><Text style={s.counterSmall}>{remaining} left</Text></View>
   </View>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,flexShrink:0,marginBottom:7}} contentContainerStyle={{gap:7,paddingRight:15}}>
      {MOODS.filter(m=>!data.hideDark||m!=='Dark').map(m=><Pill key={m} selected={mood===m} onPress={()=>{setMood(m);setSkipped([])}}>{m==='All'?'✨ For you':category(m).emoji+' '+m}</Pill>)}
   </ScrollView>
   {q ? <>
     <SwipeCard key={q.id} question={q} onVote={vote} onStories={()=>onOpen(q.id)}/>
     <View style={s.swipeUtility}>
       <Pressable onPress={skip}><Text style={s.utilityText}>⇥ Skip</Text></Pressable>
       <Pressable onPress={()=>onSave(q.id)}><Text style={s.utilityText}>{data.saved.includes(q.id)?'✓ Saved':'☆ Save'}</Text></Pressable>
       <Pressable onPress={()=>onOpen(q.id)} style={s.storyShortcut}><Text style={s.storyShortcutText}>💬 Read stories ↗</Text></Pressable>
     </View>
     {last ? <View style={s.lastRow}><Text style={s.lastText}>✓ Answer saved privately</Text><Pressable onPress={()=>onOpen(last.id)}><Text style={s.lastAction}>Last story ↗</Text></Pressable><Pressable onPress={undone}><Text style={s.lastAction}>↶ Undo</Text></Pressable></View> : null}
   </> :
     <View style={s.zeroState}>
       <Text style={{fontSize:54}}>✨</Text><Text style={s.zeroTitle}>You're all caught up!</Text>
       <Text style={s.subtle}>You've seen every question in this mood.</Text>
       <Action label="Bring back skipped cards" onPress={()=>setSkipped([])}/>
     </View>}
 </View>;
}
function ExploreScreen({questions,onOpen}) {
 const [term,setTerm]=useState(''),[mood,setMood]=useState('All');
 const items=questions.filter(q=>(mood==='All'||q.category===mood)&&[q.title,q.description,q.category].join(' ').toLowerCase().includes(term.trim().toLowerCase()))
 .sort((a,b)=>(b.yes+b.no)-(a.yes+a.no));
 return <View style={s.standardScreen}>
   <ScreenTitle eyebrow="EXPLORE THE STORIES" title="Find your people." description="Every question is a community."/>
   <TextInput value={term} onChangeText={setTerm} placeholder="Search Thailand, love, funny moments..." placeholderTextColor={C.muted} style={s.input}/>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,marginVertical:12}} contentContainerStyle={{gap:7}}>
     {MOODS.map(m=><Pill key={m} selected={mood===m} onPress={()=>setMood(m)}>{m==='All'?'✦ All':category(m).emoji+' '+m}</Pill>)}
   </ScrollView>
   <View style={s.inlineHeader}><Text style={s.sectionHeading}>Communities</Text><Text style={s.mutedSmall}>{items.length} questions</Text></View>
   <FlatList data={items} keyExtractor={q=>q.id} contentContainerStyle={{paddingBottom:24}} renderItem={({item})=><QuestionRow q={item} onOpen={onOpen}/>}
     keyboardShouldPersistTaps="handled" ListEmptyComponent={<Text style={s.subtle}>No questions match. Try a different search.</Text>}/>
 </View>;
}
function ReplyNode({item,depth=0,replyMap,likes,onLike,onReply}) {
 const [collapsed,setCollapsed]=useState(false);
 const [composing,setComposing]=useState(false);
 const [draft,setDraft]=useState('');
 const [anon,setAnon]=useState(false);
 const children=[...(item.replies||[]),...(DEMO_REPLIES[item.id]||[]),...(replyMap[item.id]||[])];
 const count=children.length;
 const liked=likes.includes(item.id);
 return <View style={[s.replyNode,depth>0&&{marginLeft:Math.min(depth,5)*10,borderLeftWidth:2,borderLeftColor:depth%2?C.violet:C.teal,paddingLeft:10}]}>
   <View style={s.replyHead}><Text style={s.replyAvatar}>{item.user==='@anonymous'?'🌙':'🙂'}</Text>
      <Text style={s.replyName}>{item.user}</Text><Text style={s.mutedSmall}> · {item.created||'Recently'}</Text></View>
   <Text style={s.replyBody}>{item.body}</Text>
   <View style={{flexDirection:'row',alignItems:'center',gap:16,marginTop:8}}>
      <Pressable onPress={()=>onLike(item.id)}><Text style={[s.replyAction,liked&&{color:C.lime}]}>▲ {(item.likes||0)+(liked?1:0)}</Text></Pressable>
      <Pressable onPress={()=>setComposing(v=>!v)}><Text style={s.replyAction}>↳ Reply</Text></Pressable>
      {count>0?<Pressable onPress={()=>setCollapsed(v=>!v)}><Text style={s.replyAction}>{collapsed?'+ Show':'− Hide'} {count}</Text></Pressable>:null}
   </View>
   {composing?<View style={s.replyComposer}>
     <Text style={s.mutedSmall}>Replying to {item.user}</Text>
     <TextInput value={draft} onChangeText={setDraft} multiline placeholder="Join the conversation…" placeholderTextColor={C.muted} style={[s.input,{minHeight:62,marginVertical:8}]} />
     <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8}}>
       <Pressable onPress={()=>setAnon(v=>!v)}><Text style={s.mutedSmall}>{anon?'☑':'☐'} Anonymous</Text></Pressable>
       <Action small label="Post reply ↗" kind="primary" onPress={()=>{
         if(draft.trim().length<2)return;
         onReply(item.id,draft.trim(),anon);setDraft('');setComposing(false);setCollapsed(false);
       }}/>
     </View>
   </View>:null}
   {!collapsed?children.map(child=><ReplyNode key={child.id} item={child} depth={depth+1} replyMap={replyMap} likes={likes} onLike={onLike} onReply={onReply}/>):null}
 </View>;
}
function CommunityScreen({q,data,onBack,onAnswer,onStory,onDiscussion,onReply,onLike,onWish,onShow}) {
 const [tab,setTab]=useState('Stories');
 const [draft,setDraft]=useState('');
 const [anon,setAnon]=useState(false);
 const [composer,setComposer]=useState(false);
 const stories=[...(data.myStories[q.id]||[]),...(q.stories||[])];
 const talks=[...(data.myDiscussions?.[q.id]||[]),{id:q.id+'-discussion-a',user:'@curiouscat',body:'What is one thing you wish you knew before this experience?',likes:12},{id:q.id+'-discussion-b',user:'@openhorizon',body:'I like hearing how different this can be for everyone.',likes:8}];
 const total=q.yes+q.no+(data.answers[q.id]?1:0);
 const yesPct=total?Math.round((q.yes+(data.answers[q.id]==='yes'?1:0))/total*100):0;
 const answer=data.answers[q.id];
 return <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}>
   <ScrollView contentContainerStyle={{padding:18,paddingBottom:28}} keyboardShouldPersistTaps="handled">
      <Pressable onPress={onBack} style={{marginBottom:14}}><Text style={s.backLabel}>‹ Back to questions</Text></Pressable>
      <View style={[s.communityHero,{backgroundColor:category(q.category).colors[0]}]}>
        <Text style={{fontSize:48,alignSelf:'flex-end'}}>{q.emoji}</Text>
        <Text style={s.heroCategory}>{q.category.toUpperCase()} · DID YOU?</Text><Text style={s.heroTitle}>{q.title}</Text>
        <Text style={s.heroSub}>{q.description}</Text>
      </View>
      <View style={s.pulseBox}>
        <View style={s.inlineHeader}><Text style={s.sectionHeading}>Community pulse</Text><Text style={s.mutedSmall}>Illustrative results</Text></View>
        <View style={s.pulseTrack}><View style={[s.pulseYes,{width:yesPct+'%'}]}/></View>
        <View style={s.inlineHeader}><Text style={{color:C.lime,fontSize:11,fontWeight:'800'}}>{yesPct}% Yes</Text><Text style={{color:C.pink,fontSize:11,fontWeight:'800'}}>{100-yesPct}% No</Text></View>
        {answer?<View style={{marginTop:9,gap:8}}>
          <Text style={s.subtle}>Your private answer: {answer==='yes'?'Yes, I did':'No, I didn’t'}</Text>
          {answer==='yes'?<Action small kind="outline" label={data.visibleDids.includes(q.id)?'✓ Displayed on profile · Hide':'✦ Display this Did on profile'} onPress={()=>onShow(q.id)}/>:
            <Action small kind="outline" label={data.wishlist.includes(q.id)?'✓ On your bucket list':'☆ Add to bucket list'} onPress={()=>onWish(q.id)}/>}
        </View>:
        <View style={{flexDirection:'row',gap:8,marginTop:12}}>
          <View style={{flex:1}}><Action label="✕ No" kind="outline" onPress={()=>onAnswer(q.id,'no')}/></View>
          <View style={{flex:1}}><Action label="✓ Yes" kind="primary" onPress={()=>onAnswer(q.id,'yes')}/></View>
        </View>}
      </View>
      <View style={s.communityTabs}>{['Stories','Discussion'].map(t=><Pressable key={t} onPress={()=>{setTab(t);setComposer(false);setDraft('')}} style={[s.communityTab,t===tab&&s.activeTab]}>
        <Text style={[s.communityTabText,t===tab&&{color:C.lime}]}>{t} ({t==='Stories'?stories.length:talks.length})</Text>
      </Pressable>)}</View>
      <Action label={composer?'Close editor':tab==='Stories'?'+ Share your experience':'+ Start a discussion'} kind="primary" onPress={()=>setComposer(v=>!v)}/>
      {composer?<View style={s.communityComposer}>
         <TextInput multiline value={draft} onChangeText={setDraft} maxLength={1500} placeholder={tab==='Stories'?'Tell the story behind your answer...':'What do you want to talk about?'} placeholderTextColor={C.muted} style={[s.input,{minHeight:110,textAlignVertical:'top'}]}/>
         <View style={{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginTop:12}}>
           {tab==='Stories'?<Pressable onPress={()=>setAnon(v=>!v)}><Text style={s.mutedSmall}>{anon?'☑':'☐'} Anonymous</Text></Pressable>:<Text style={s.mutedSmall}>Be respectful</Text>}
           <Action small label="Post" kind="primary" onPress={()=>{
              if(draft.trim().length<4){Alert.alert('Write a little more','Add at least 4 characters.');return}
              if(tab==='Stories')onStory(q.id,draft.trim(),anon);else onDiscussion(q.id,draft.trim());
              setDraft('');setComposer(false);setAnon(false);
           }}/>
         </View>
      </View>:null}
      <Text style={[s.subtle,{marginTop:15,marginBottom:7}]}>Sample posts are fictional. Your posts are saved only on this phone.</Text>
      {(tab==='Stories'?stories:talks).map(item=><View key={item.id} style={s.threadRoot}>
         <ReplyNode item={item} replyMap={data.myReplies} likes={data.likes} onLike={onLike} onReply={onReply}/>
       </View>)}
   </ScrollView>
 </KeyboardAvoidingView>;
}
function CreateScreen({questions,onCreate,onOpen}) {
 const [title,setTitle]=useState(''),[desc,setDesc]=useState(''),[mood,setMood]=useState('Funny');
 const duplicate=questions.find(q=>normalize(q.title)===normalize(titleOf(title)));
 const submit=()=>{
  if(title.trim().length<7){Alert.alert('Complete the question','Try asking something people can answer Yes or No.');return}
  if(duplicate){onOpen(duplicate.id);return}
  const q={id:makeId('question'),title:titleOf(title),description:desc.trim()||'Share your experience with this community.',category:mood,emoji:category(mood).emoji,yes:0,no:0,stories:[]};
  onCreate(q);setTitle('');setDesc('');setMood('Funny');onOpen(q.id);
 };
 return <ScrollView style={s.standardScreen} contentContainerStyle={{paddingBottom:36}} keyboardShouldPersistTaps="handled">
  <ScreenTitle eyebrow="START SOMETHING" title="Ask the world." description="One great question can spark a thousand stories."/>
  <Text style={s.fieldLabel}>Your Did You question</Text>
  <TextInput style={s.input} value={title} onChangeText={setTitle} maxLength={145} placeholder="Did you ever live abroad?" placeholderTextColor={C.muted}/>
  <Text style={s.fieldLabel}>A little context (optional)</Text>
  <TextInput style={[s.input,{minHeight:100,textAlignVertical:'top'}]} value={desc} onChangeText={setDesc} multiline maxLength={260} placeholder="What made you curious?" placeholderTextColor={C.muted}/>
  <Text style={s.fieldLabel}>Pick a mood</Text>
  <View style={{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:14}}>
   {MOODS.filter(m=>m!=='All').map(m=><Pill key={m} selected={mood===m} onPress={()=>setMood(m)}>{category(m).emoji+' '+m}</Pill>)}
  </View>
  <View style={[s.communityHero,{backgroundColor:category(mood).colors[0],minHeight:145}]}>
   <Text style={s.heroCategory}>PREVIEW · {mood.toUpperCase()}</Text>
   <Text style={s.heroTitle}>{title.trim()?titleOf(title):'Did you ever…?'}</Text>
   <Text style={s.heroSub}>{desc.trim()||'Your new question lives here.'}</Text>
  </View>
  {duplicate?<Action label="Existing community found — view it" onPress={()=>onOpen(duplicate.id)} />:null}
  <View style={{marginTop:15}}><Action label="+ Create question" kind="primary" onPress={submit}/></View>
  <Text style={[s.subtle,{marginTop:12}]}>Prototype questions are local to this device. Production requires moderation before public publishing.</Text>
 </ScrollView>;
}
function LifeScreen({questions,data,onOpen,onShow,onWish}) {
 const [filter,setFilter]=useState('Answered');
 const idSet=filter==='Answered'?Object.keys(data.answers):filter==='Saved'?data.saved:data.wishlist;
 const items=idSet.slice().reverse().map(id=>questions.find(q=>q.id===id)).filter(Boolean);
 const yes=Object.values(data.answers).filter(a=>a==='yes').length;
 return <ScrollView style={s.standardScreen} contentContainerStyle={{paddingBottom:40}}>
    <ScreenTitle eyebrow="YOUR LIFE COLLECTION" title="The things you've lived." description="Answers are private. Choose which Dids appear on your profile."/>
    <View style={{flexDirection:'row',gap:9,marginBottom:16}}>
      {[['✓',yes,'I did'],['✕',Object.keys(data.answers).length-yes,'Not yet'],['✦',data.visibleDids.length,'On display']].map(([ico,n,label])=>
        <View key={label} style={s.metric}><Text style={s.metricNumber}>{n}</Text><Text style={s.mutedSmall}>{ico} {label}</Text></View>)}
    </View>
    <View style={{flexDirection:'row',gap:7,marginBottom:15}}>{['Answered','Saved','Wishlist'].map(t=>
      <Pill key={t} selected={filter===t} onPress={()=>setFilter(t)}>{t}</Pill>)}</View>
    {items.length===0?<View style={s.zeroState}><Text style={{fontSize:44}}>🌱</Text><Text style={s.zeroTitle}>Your story starts with a swipe.</Text></View>:
      items.map(q=><View key={q.id} style={{marginBottom:5}}>
        <QuestionRow q={q} onOpen={onOpen} accessory={<Text style={{fontSize:11,color:C.lime,fontWeight:'800'}}>{data.answers[q.id]==='yes'?'✓ YES':data.answers[q.id]==='no'?'✕ NO':'↗'}</Text>}/>
        {filter==='Answered'&&data.answers[q.id]==='yes'?
          <Pressable onPress={()=>onShow(q.id)} style={s.displayToggle}><Text style={s.displayToggleText}>{data.visibleDids.includes(q.id)?'✓ Shown on profile · tap to hide':'+ Show this Did on profile'}</Text></Pressable>:null}
      </View>)}
    <Text style={[s.subtle,{marginTop:14}]}>Your private answers are not automatically displayed or shared.</Text>
 </ScrollView>;
}
function ProfileScreen({questions,data,onUpdate,onShow,onPin,onClear,onOpen}) {
 const [editing,setEditing]=useState(false);
 const [name,setName]=useState(data.profile.name),[username,setUsername]=useState(data.profile.username),[bio,setBio]=useState(data.profile.bio),[instagram,setInstagram]=useState(data.profile.instagram);
 const [tab,setTab]=useState('Dids');
 const dids=data.visibleDids.map(id=>questions.find(q=>q.id===id)).filter(q=>q&&data.answers[q.id]==='yes');
 const highlights=dids.filter(q=>data.pinnedDids.includes(q.id));
 const ownStories=Object.entries(data.myStories).flatMap(([id,rows])=>rows.filter(r=>r.user!=='@anonymous').map(r=>({question:questions.find(q=>q.id===id),story:r}))).filter(x=>x.question);
 const pickPhoto=async()=>{
   try{
      const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images'],allowsEditing:true,aspect:[1,1],quality:0.5,base64:true});
      if(!result.canceled && result.assets?.[0]){
        const asset=result.assets[0];
        const uri=asset.base64?'data:image/jpeg;base64,'+asset.base64:asset.uri;
        if(uri.length>2400000){Alert.alert('Photo too big','Please choose a smaller photo for the demo.');return}
        onUpdate({photo:uri});
      }
   }catch{Alert.alert('Photo unavailable','Please try another picture.')}
 };
 const save=()=>{
  if(name.trim().length<2||username.trim().length<3){Alert.alert('Profile needs a name','Use at least 2 characters for your name and 3 for your username.');return}
  onUpdate({name:name.trim().slice(0,36),username:username.replace(/[^a-zA-Z0-9_]/g,'').slice(0,18),bio:bio.trim().slice(0,160),instagram:instagram.replace(/^@/,'').replace(/[^a-zA-Z0-9._]/g,'').slice(0,30)});
  setEditing(false);
 };
 return <ScrollView style={s.standardScreen} contentContainerStyle={{paddingBottom:42}} keyboardShouldPersistTaps="handled">
  <Text style={s.eyebrow}>YOUR LIFE, ON DISPLAY ✦</Text>
  <View style={s.profileBanner}><Text style={s.coverKicker}>DID YOU? / THE EXPERIENCE CLUB</Text><Text style={s.coverTitle}>Life looks good{"\n"}on you. ✨</Text></View>
  <View style={s.profilePanel}>
    <View style={{flexDirection:'row',alignItems:'flex-end',gap:12,marginTop:-38}}>
     <Pressable onPress={pickPhoto} style={s.profilePhoto}><Avatar data={data} size={78}/><View style={s.photoPlus}><Text style={{color:C.bg,fontWeight:'900'}}>＋</Text></View></Pressable>
     <View style={{flex:1,marginBottom:7}}><Text style={s.profileName}>{data.profile.name}</Text><Text style={s.subtle}>@{data.profile.username}</Text></View>
    </View>
    <Text style={[s.body,{marginTop:12}]}>{data.profile.bio}</Text>
    {data.profile.instagram?<Pressable onPress={()=>Linking.openURL('https://www.instagram.com/'+data.profile.instagram+'/')}>
      <Text style={{color:C.lime,marginTop:10,fontWeight:'800'}}>◎ Instagram @{data.profile.instagram} ↗</Text>
    </Pressable>:null}
    <View style={[s.metricsRow,{marginTop:15}]}>
      {[['Dids',dids.length],['Stories',ownStories.length],['Questions',data.myQuestions.length]].map(([label,n])=><View key={label} style={{alignItems:'center',flex:1}}><Text style={s.metricNumber}>{n}</Text><Text style={s.mutedSmall}>{label}</Text></View>)}
    </View>
    <Action label={editing?'Close editor':'✎ Edit profile'} onPress={()=>setEditing(x=>!x)}/>
  </View>
  {editing?<View style={s.editor}>
    <Text style={s.fieldLabel}>Name</Text><TextInput style={s.input} value={name} onChangeText={setName} maxLength={36}/>
    <Text style={s.fieldLabel}>Username</Text><TextInput style={s.input} value={username} onChangeText={setUsername} maxLength={18} autoCapitalize="none"/>
    <Text style={s.fieldLabel}>Bio</Text><TextInput style={[s.input,{minHeight:85}]} value={bio} onChangeText={setBio} maxLength={160} multiline/>
    <Text style={s.fieldLabel}>Instagram handle</Text><TextInput style={s.input} value={instagram} onChangeText={setInstagram} autoCapitalize="none" placeholder="@yourhandle" placeholderTextColor={C.muted}/>
    <Action kind="primary" label="Save profile ✦" onPress={save}/>
  </View>:null}
  <View style={[s.inlineHeader,{marginTop:24}]}><Text style={s.sectionHeading}>★ Highlights</Text><Text style={s.mutedSmall}>Pin up to 3</Text></View>
  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{flexGrow:0,marginBottom:22}}>
    {highlights.length?highlights.map(q=><Pressable key={q.id} onPress={()=>onOpen(q.id)} style={{alignItems:'center',marginRight:18}}>
      <View style={[s.highlight,{backgroundColor:category(q.category).colors[0]}]}><Text style={{fontSize:31}}>{q.emoji}</Text></View><Text style={s.mutedSmall}>{q.category}</Text>
    </Pressable>):<Text style={s.subtle}>Your favorite displayed Dids can be pinned here.</Text>}
  </ScrollView>
  <View style={s.communityTabs}>{['Dids','Stories','Questions'].map(t=><Pressable key={t} onPress={()=>setTab(t)} style={[s.communityTab,tab===t&&s.activeTab]}>
    <Text style={[s.communityTabText,tab===t&&{color:C.lime}]}>{t}</Text></Pressable>)}</View>
  {tab==='Dids'?dids.length?<View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
    {dids.map(q=><View key={q.id} style={{width:'48%'}}>
      <Pressable onPress={()=>onOpen(q.id)} style={[s.didTile,{backgroundColor:category(q.category).colors[0]}]}>
        <Text style={{fontSize:47,marginBottom:18}}>{q.emoji}</Text>
        <Text style={s.didText}>{q.title}</Text><Text style={s.didStatus}>✓ I DID</Text>
      </Pressable>
      <View style={{flexDirection:'row',justifyContent:'space-between'}}>
        <Pressable onPress={()=>onPin(q.id)}><Text style={s.mutedSmall}>{data.pinnedDids.includes(q.id)?'📌 Unpin':'☆ Pin'}</Text></Pressable>
        <Pressable onPress={()=>onShow(q.id)}><Text style={s.mutedSmall}>Hide ✕</Text></Pressable>
      </View>
    </View>)}
  </View>:<Text style={s.subtle}>Swipe Yes on an experience, then tap “Show on profile” in My Life.</Text>:
  tab==='Stories'?ownStories.length?ownStories.map(({question:q,story:r})=>
    <Pressable key={r.id} onPress={()=>onOpen(q.id)} style={s.storyPreview}><Text style={s.rowCategory}>{q.category.toUpperCase()}</Text><Text style={s.rowTitle}>{q.title}</Text><Text numberOfLines={3} style={s.subtle}>{r.body}</Text></Pressable>):
    <Text style={s.subtle}>Stories you post with your username appear here. Anonymous stories do not.</Text>:
    data.myQuestions.length?data.myQuestions.map(q=><QuestionRow key={q.id} q={q} onOpen={onOpen}/>):<Text style={s.subtle}>Questions you create appear here.</Text>}
  <View style={s.privacyNote}><Text style={s.sectionHeading}>🔒 Your privacy</Text>
    <Text style={[s.subtle,{marginTop:8}]}>Only Dids you explicitly choose to display appear on your profile. Answers stay private by default. This is a local prototype, not a live public account.</Text>
  </View>
  <Pressable onPress={()=>Alert.alert('Reset this phone?','This will erase local answers, comments, and your profile.',[{text:'Cancel'},{text:'Erase',style:'destructive',onPress:onClear}])}>
    <Text style={[s.mutedSmall,{textAlign:'center',marginTop:20}]}>Reset local demo data</Text>
  </Pressable>
 </ScrollView>;
}
export default function App() {
 const [data,setData]=useState(INITIAL),[hydrated,setHydrated]=useState(false);
 const [screen,setScreen]=useState('Swipe'),[activeId,setActiveId]=useState(null),[last,setLast]=useState(null);
 useEffect(()=>{let live=true;loadState().then(saved=>{if(live){setData(saved);setHydrated(true)}});return()=>{live=false}},[]);
 useEffect(()=>{if(hydrated)saveState(data).catch(()=>{})},[data,hydrated]);
 const questions=useMemo(()=>[...data.myQuestions,...SEED_QUESTIONS],[data.myQuestions]);
 const mutate=useCallback(fn=>setData(prev=>{const next=JSON.parse(JSON.stringify(prev));fn(next);return next}),[]);
 const answer=(id,value)=>mutate(d=>{d.answers[id]=value});
 const undo=(id)=>mutate(d=>{delete d.answers[id]});
 const toggle=(key,id)=>mutate(d=>{d[key]=d[key].includes(id)?d[key].filter(x=>x!==id):[...d[key],id]});
 const showDid=(id)=>mutate(d=>{if(d.answers[id]!=='yes')return;if(d.visibleDids.includes(id)){d.visibleDids=d.visibleDids.filter(x=>x!==id);d.pinnedDids=d.pinnedDids.filter(x=>x!==id)}else d.visibleDids.push(id)});
 const pinDid=(id)=>mutate(d=>{if(!d.visibleDids.includes(id))return;if(d.pinnedDids.includes(id))d.pinnedDids=d.pinnedDids.filter(x=>x!==id);else if(d.pinnedDids.length<3)d.pinnedDids.push(id);else Alert.alert('Three highlights max','Unpin one highlight first.')});
 const create=(q)=>mutate(d=>{d.myQuestions.unshift(q)});
 const addStory=(id,body,anonymous)=>mutate(d=>{(d.myStories[id]??=[]).unshift({id:makeId('story'),user:anonymous?'@anonymous':'@'+d.profile.username,body,likes:0,created:'Just now',replies:[]})});
 const addDiscussion=(id,body)=>mutate(d=>{(d.myDiscussions??={})[id]??=[];d.myDiscussions[id].unshift({id:makeId('discussion'),user:'@'+d.profile.username,body,likes:0,created:'Just now'})});
 const addReply=(parentId,body,anonymous)=>mutate(d=>{(d.myReplies[parentId]??=[]).push({id:makeId('reply'),user:anonymous?'@anonymous':'@'+d.profile.username,body,likes:0,created:'Just now'})});
 const updateProfile=(changes)=>mutate(d=>{d.profile={...d.profile,...changes}});
 const open=(id)=>{setActiveId(id)};
 const changeScreen=(value)=>{setActiveId(null);setScreen(value)};
 const clear=async()=>{const empty=await resetState();setData(empty);setLast(null);changeScreen('Swipe')};
 const active=activeId?questions.find(q=>q.id===activeId):null;
 return <SafeAreaProvider><SafeAreaView style={s.safe} edges={['top','bottom']}>
   <StatusBar backgroundColor={C.bg} barStyle="light-content"/>
   <View style={s.header}><Text style={s.wordmark}>did you<Text style={{color:C.lime}}>?</Text></Text>
      <Pressable onPress={()=>changeScreen('Profile')}><Avatar data={data} size={37}/></Pressable></View>
   <View style={{flex:1,minHeight:0}}>
    {!hydrated?<View style={s.zeroState}><Text style={s.pageTitle}>Loading your stories…</Text></View>:
    active?<CommunityScreen key={active.id} q={active} data={data} onBack={()=>setActiveId(null)} onAnswer={answer} onStory={addStory} onDiscussion={addDiscussion} onReply={addReply} onLike={id=>toggle('likes',id)} onWish={id=>toggle('wishlist',id)} onShow={showDid}/>:
    screen==='Swipe'?<SwipeScreen questions={questions} data={data} onAnswer={answer} onUndo={undo} last={last} setLast={setLast} onOpen={open} onSave={id=>toggle('saved',id)}/>:
    screen==='Explore'?<ExploreScreen questions={questions} onOpen={open}/>:
    screen==='Create'?<CreateScreen questions={questions} onCreate={create} onOpen={open}/>:
    screen==='My Life'?<LifeScreen questions={questions} data={data} onOpen={open} onShow={showDid} onWish={id=>toggle('wishlist',id)}/>:
    <ProfileScreen questions={questions} data={data} onOpen={open} onShow={showDid} onPin={pinDid} onUpdate={updateProfile} onClear={clear}/>}
   </View>
   <View style={s.tabBar}>{navigation.map(item=><Pressable key={item.key} accessibilityRole="tab" accessibilityState={{selected:screen===item.key}}
     onPress={()=>changeScreen(item.key)} style={[s.navItem,screen===item.key&&!active&&{backgroundColor:'#28273B'}]}>
     <Text style={[s.navIcon,screen===item.key&&{color:C.lime}]}>{item.icon}</Text>
     <Text style={[s.navCaption,screen===item.key&&{color:C.lime}]}>{item.key}</Text>
   </Pressable>)}</View>
 </SafeAreaView></SafeAreaProvider>;
}
const s=StyleSheet.create({
 safe:{flex:1,backgroundColor:C.bg},
 header:{height:58,paddingHorizontal:20,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},
 wordmark:{fontSize:28,color:C.ink,fontWeight:'900',letterSpacing:-1.2},
 avatar:{justifyContent:'center',alignItems:'center',backgroundColor:'#B8A4FD',overflow:'hidden'},
 tabBar:{height:66,backgroundColor:'#161421',borderTopColor:C.edge,borderTopWidth:1,paddingHorizontal:4,flexDirection:'row',justifyContent:'space-around',alignItems:'center'},
 navItem:{flex:1,height:55,borderRadius:12,justifyContent:'center',alignItems:'center',gap:1},
 navIcon:{fontSize:23,color:'#8E89A3',fontWeight:'800'},
 navCaption:{fontSize:9,fontWeight:'800',color:'#8E89A3'},
 eyebrow:{fontSize:10,fontWeight:'900',letterSpacing:1.7,color:C.lime},
 pageTitle:{fontSize:29,fontWeight:'900',letterSpacing:-1,color:C.ink,marginTop:5},
 subtle:{fontSize:12,color:C.muted,lineHeight:18},
 mutedSmall:{fontSize:10,color:C.muted},
 body:{fontSize:13,lineHeight:20,color:C.ink},
 sectionHeading:{fontSize:17,fontWeight:'900',color:C.ink},
 inlineHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
 action:{backgroundColor:C.soft,borderRadius:13,borderWidth:1,borderColor:C.edge,paddingVertical:13,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},
 actionPrimary:{backgroundColor:C.lime,borderColor:C.lime},actionOutline:{backgroundColor:'#292538',borderColor:'#785570'},
 actionSmall:{paddingVertical:9,paddingHorizontal:10,borderRadius:10},
 actionText:{fontSize:12,color:C.ink,fontWeight:'900'},actionTextPrimary:{color:'#24291B'},
 pill:{backgroundColor:C.soft,borderColor:C.edge,borderWidth:1,borderRadius:50,paddingVertical:8,paddingHorizontal:13},
 pillSelected:{backgroundColor:C.lime,borderColor:C.lime},
 pillText:{fontSize:11,fontWeight:'800',color:'#D2CEDC'},pillTextSelected:{color:'#20231C'},
 swipeScreen:{flex:1,minHeight:0,paddingHorizontal:17,paddingBottom:4},
 swipeHeading:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:9},
 swipeHeadingText:{fontSize:24,color:C.ink,fontWeight:'900',letterSpacing:-.6},
 counterStrong:{color:C.lime,fontWeight:'900',fontSize:11},counterSmall:{color:C.muted,fontSize:10,marginTop:3},
 backCard:{position:'absolute',top:11,left:8,right:8,bottom:8,borderRadius:25,opacity:.48},
 swipeCard:{flex:1,minHeight:0,borderRadius:24,padding:18,justifyContent:'space-between',overflow:'hidden',elevation:8},
 cardRing:{position:'absolute',width:280,height:280,borderRadius:140,borderWidth:1,borderColor:'#FFFFFF55',right:-75,top:5},
 cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',zIndex:2},
 tag:{backgroundColor:'#00000025',borderColor:'#FFFFFF66',borderWidth:1,borderRadius:22,paddingVertical:6,paddingHorizontal:10},
 tagText:{fontSize:10,fontWeight:'900',color:'white'},storyBubble:{padding:8,borderRadius:50,backgroundColor:'#FFFFFF2A',borderWidth:1,borderColor:'#FFFFFF55'},
 storyBubbleText:{fontSize:10,fontWeight:'900',color:'white'},
 cardCenter:{flex:1,minHeight:0,justifyContent:'center',alignItems:'center'},bigEmoji:{fontSize:79,textShadowColor:'#00000022',textShadowOffset:{width:0,height:7},textShadowRadius:14},
 cardBottom:{paddingBottom:4},cardQuestion:{fontSize:30,lineHeight:33,fontWeight:'900',letterSpacing:-1.1,color:'white'},
 cardSub:{fontSize:12,lineHeight:17,color:'#F7EDFF',marginTop:7},
 swipeStamp:{position:'absolute',top:62,alignSelf:'center',borderWidth:4,borderRadius:10,paddingHorizontal:17,paddingVertical:4,transform:[{rotate:'-12deg'}]},
 stampText:{fontSize:27,fontWeight:'900',color:'white',letterSpacing:2},
 voteRow:{flexDirection:'row',gap:9,marginTop:10},swipeUtility:{height:39,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},
 utilityText:{fontSize:11,color:C.muted,fontWeight:'800'},storyShortcut:{backgroundColor:'#342B45',borderColor:'#6C5185',borderWidth:1,borderRadius:10,paddingHorizontal:12,paddingVertical:8},
 storyShortcutText:{fontSize:11,fontWeight:'900',color:'#F3DFFF'},
 lastRow:{height:31,flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:6,borderTopColor:C.edge,borderTopWidth:1},
 lastText:{fontSize:10,color:C.lime,fontWeight:'800'},lastAction:{fontSize:10,color:C.ink,fontWeight:'800'},
 standardScreen:{flex:1,paddingHorizontal:18,paddingTop:9},
 input:{backgroundColor:'#211E31',color:C.ink,borderWidth:1,borderColor:'#4C435C',borderRadius:13,paddingHorizontal:13,paddingVertical:12,fontSize:13},
 fieldLabel:{fontSize:12,color:C.ink,fontWeight:'800',marginTop:17,marginBottom:8},
 questionRow:{backgroundColor:'#201D2E',borderColor:C.edge,borderWidth:1,borderRadius:16,padding:11,marginBottom:9,flexDirection:'row',alignItems:'center',gap:11},
 questionThumb:{width:60,height:62,borderRadius:13,justifyContent:'center',alignItems:'center'},
 rowCategory:{color:C.lime,fontWeight:'800',fontSize:9,letterSpacing:.6},rowTitle:{color:C.ink,fontWeight:'900',fontSize:13,marginTop:3},
 rowSmall:{fontSize:10,color:C.muted,marginTop:5},
 backLabel:{fontSize:12,color:C.muted,fontWeight:'800'},
 communityHero:{borderRadius:21,padding:18,minHeight:196,justifyContent:'space-between'},
 heroCategory:{fontSize:10,fontWeight:'900',color:'white',letterSpacing:1},
 heroTitle:{fontSize:26,lineHeight:28,fontWeight:'900',color:'white',letterSpacing:-.9,marginTop:7},
 heroSub:{fontSize:11,color:'#FFF2FA',marginTop:9,lineHeight:15},
 pulseBox:{backgroundColor:'#201C30',padding:14,borderWidth:1,borderColor:C.edge,borderRadius:17,marginVertical:13},
 pulseTrack:{height:10,backgroundColor:C.pink,borderRadius:12,overflow:'hidden',marginBottom:8},
 pulseYes:{height:10,backgroundColor:C.lime},
 communityTabs:{flexDirection:'row',backgroundColor:C.soft,borderRadius:12,marginVertical:14,padding:4,gap:4},
 communityTab:{flex:1,alignItems:'center',paddingVertical:11,borderRadius:9},
 activeTab:{backgroundColor:'#413950'},communityTabText:{fontSize:11,color:C.muted,fontWeight:'900'},
 communityComposer:{backgroundColor:C.soft,borderRadius:15,padding:12,marginVertical:12},
 threadRoot:{borderWidth:1,borderColor:C.edge,backgroundColor:'#1F1C2C',borderRadius:16,padding:12,marginBottom:10},
 replyNode:{paddingBottom:9,paddingTop:5},replyHead:{flexDirection:'row',alignItems:'center',gap:6},
 replyAvatar:{fontSize:15,color:C.ink},replyName:{fontSize:11,fontWeight:'900',color:C.ink},replyBody:{fontSize:12,color:'#E5DFF0',marginTop:7,lineHeight:18},
 replyAction:{fontSize:10,fontWeight:'800',color:'#BAB1C8'},
 replyComposer:{backgroundColor:'#2E2840',padding:11,marginTop:10,borderRadius:11},
 zeroState:{flex:1,justifyContent:'center',alignItems:'center',padding:28,gap:12},
 zeroTitle:{fontSize:22,fontWeight:'900',color:C.ink,textAlign:'center'},
 metric:{flex:1,backgroundColor:C.soft,borderRadius:15,padding:15,alignItems:'center'},
 metricNumber:{fontSize:24,color:C.lime,fontWeight:'900'},
 displayToggle:{alignSelf:'flex-end',paddingVertical:7,paddingHorizontal:12,marginBottom:5,backgroundColor:'#2D3340',borderRadius:9},
 displayToggleText:{fontSize:10,color:C.lime,fontWeight:'900'},
 profileBanner:{height:150,backgroundColor:'#73519B',borderTopLeftRadius:22,borderTopRightRadius:22,marginTop:12,padding:18,justifyContent:'space-between'},
 coverKicker:{fontSize:9,color:'white',fontWeight:'900',letterSpacing:1.5},coverTitle:{fontSize:27,color:'white',fontWeight:'900',letterSpacing:-1},
 profilePanel:{padding:15,backgroundColor:'#221E31',borderBottomLeftRadius:20,borderBottomRightRadius:20},
 profilePhoto:{borderWidth:4,borderColor:'#221E31',borderRadius:27,overflow:'visible'},
 photoPlus:{position:'absolute',right:-5,bottom:-4,width:24,height:24,borderRadius:12,backgroundColor:C.lime,alignItems:'center',justifyContent:'center'},
 profileName:{fontSize:22,color:C.ink,fontWeight:'900'},
 metricsRow:{flexDirection:'row',justifyContent:'space-around',borderTopWidth:1,borderTopColor:C.edge,borderBottomWidth:1,borderBottomColor:C.edge,paddingVertical:13,marginBottom:13},
 editor:{padding:13,backgroundColor:C.soft,borderRadius:16,marginTop:12,paddingBottom:20},
 highlight:{height:70,width:70,borderRadius:35,borderColor:C.violet,borderWidth:3,alignItems:'center',justifyContent:'center',marginBottom:6},
 didTile:{height:178,justifyContent:'flex-end',padding:13,borderRadius:16,marginBottom:8},
 didText:{color:'white',fontSize:15,fontWeight:'900',lineHeight:18},didStatus:{color:'#E2FFC3',fontSize:9,fontWeight:'900',marginTop:7},
 storyPreview:{padding:13,borderWidth:1,borderColor:C.edge,borderRadius:14,backgroundColor:C.soft,marginBottom:10},
 privacyNote:{marginTop:25,borderColor:C.edge,borderWidth:1,borderRadius:16,padding:15,backgroundColor:'#1F1B2B'}
});
