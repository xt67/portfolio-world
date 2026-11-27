import test from 'node:test';
import assert from 'node:assert/strict';
import {repositories} from '../src/catalog.js';
import {repositoryCards} from '../src/panels.js';

test('the arcade omits forks and puts the live destination before source on each hosted card',()=>{
  assert.ok(repositories.every(repo=>!repo.fork));
  assert.doesNotMatch(repositoryCards(),/github-readme-stats/i);
  for(const repo of repositories.filter(repo=>repo.homepage)){
    const card=repositoryCards(repo.owner,repo.name);
    assert.ok(card.includes('class="card-primary" href="'+repo.homepage+'"'));
    assert.ok(card.indexOf(repo.homepage)<card.indexOf('GitHub source'));
  }
  assert.match(repositoryCards('xt67','Qatar-Water'),/water-capacity-analysis\.streamlit\.app/);
  assert.match(repositoryCards('xt67','AutoCar-Sim'),/href="\/\?visit=drive"/);
});
