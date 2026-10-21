import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { DogDetailModal } from '../src/components/DogDetailModal';
import { matchesFilters, DEFAULT_FILTERS, rewindHistory } from '../src/utils/discovery';
import { readStored, isBoolean } from '../src/utils/storage';
import { isPet, isMessages, isMatches } from '../src/utils/validation';
import { generateDogBio } from '../src/utils/gemini';
import type { Dog } from '../src/types/dog';
const pet:Dog={id:'test',name:'Test',age:2,breed:'Test',gender:'Boy',size:'Small (10-25 lbs)',energyLevel:'Moderate Stroller',playStyles:[],photos:[],bio:'Test',quirks:[],favoritePark:'Park',distanceMiles:2,vaccinated:true,neutered:true,goodWith:[],badges:[],purposes:['Morning Walk Buddy'],owner:{name:'Human',avatar:'',bio:'',verified:false,memberSince:'',responseTime:''}};
test('status labels follow false and unknown data',()=>{
  for (const flag of [false,undefined]) {
    const html=renderToStaticMarkup(<DogDetailModal dog={{...pet,vaccinated:flag,neutered:flag}} onClose={()=>{}} onLike={()=>{}} onPlanPlaydate={()=>{}} onStartChat={()=>{}}/>);
    assert.ok(!html.includes('Vaccines Up to Date'));
    assert.ok(!html.includes('Verified Test Profile'));
    assert.ok(html.includes(flag === false ? 'Not Vaccinated' : 'Vaccination Unknown'));
  }
});
test('purpose and health filters apply',()=>{
  assert.equal(matchesFilters(pet,DEFAULT_FILTERS),false);
  assert.equal(matchesFilters(pet,{...DEFAULT_FILTERS,purpose:['Morning Walk Buddy']}),true);
  assert.equal(matchesFilters({...pet,vaccinated:false},{...DEFAULT_FILTERS,purpose:[]}),false);
});
test('rewind restores the last visible ID, preserves excluded history',()=>{
  assert.deepEqual(rewindHistory(['a','b','c'],['a','b']),['a','c']);
  assert.deepEqual(rewindHistory(['a','b'],['c']),['a','b']);
});
test('storage rejects corrupted and unsupported versions without throwing',()=>{
  const memory=new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{getItem:(key:string)=>memory.get(key) || null}});
  for (const raw of ['{','{"version":2,"value":false}','{"version":1,"value":"false"}']) {
    memory.set('tailwag:v1:test',raw);assert.equal(readStored('test',true,isBoolean),true);
  }
  memory.set('tailwag:v1:test','{"version":1,"value":false}');assert.equal(readStored('test',true,isBoolean),false);
  delete (globalThis as any).localStorage;
});
test('persisted payload validators reject malformed records',()=>{
  assert.equal(isPet({id:'a'}),false);assert.equal(isPet(pet),true);
  assert.equal(isMatches([{dog:pet,matchedAt:'now',unreadCount:-1}]),false);
  assert.equal(isMessages({a:[{id:'a',senderId:'user',text:'Hi',timestamp:'now',isPlaydateProposal:true}]}),false);
});
test('offline generation works without a provider key',async()=>{
  assert.ok((await generateDogBio('Test','Retriever',['Fetch'],'Ball','Playful')).length>20);
});
