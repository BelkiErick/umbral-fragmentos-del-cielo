import test from 'node:test';
import assert from 'node:assert/strict';
import {runCampaign} from '../scripts/campaign.mjs';
test('complete campaign using only controls: both upgrades, six rooms, final boss',()=>{
  const result=runCampaign(12000);
  assert.equal(result.completed,true,JSON.stringify(result));
  assert.deepEqual([...new Set(result.milestones.map(m=>m.room))],[0,1,2,3,4,5]);
  assert.ok(result.milestones.find(m=>m.room===1&&m.upgrades.doubleJump));
  assert.ok(result.milestones.find(m=>m.room===3&&m.upgrades.phaseDash));
});
