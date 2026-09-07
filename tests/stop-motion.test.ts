import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import { cloneScene, duration, frameAtTime, MAX_FRAMES, motionFrames, moveFrame, newProject, parseProject } from '../src/components/stop-motion/model';
import { loadProject, saveProject } from '../src/components/stop-motion/storage';

test('motion presets preserve identities and do not mutate the editable pose', () => {
  const project = newProject(); const original = JSON.stringify(project.scene);
  for (const preset of ['wave', 'walk', 'talk'] as const) {
    const frames = motionFrames(project.scene, project.scene.actors[0].id, preset);
    assert.equal(frames.length, 12); assert.equal(new Set(frames.map(f => f.id)).size, 12);
    assert.equal(frames[0].scene.actors[0].id, project.scene.actors[0].id);
    assert.notDeepEqual(frames[1].scene.actors[0], frames[2].scene.actors[0]);
    frames[0].scene.actors[0].pose.head = 50;
    assert.notEqual(frames[1].scene.actors[0].pose.head, 50);
    assert.equal(JSON.stringify(project.scene), original);
  }
});
test('timeline honors held frames and clamps the final playhead', () => {
  const project = newProject();
  project.frames = motionFrames(project.scene, project.scene.actors[0].id, 'wave').slice(0, 3);
  project.frames[0].hold = 3; project.frames[1].hold = 2;
  assert.equal(duration(project), .75);
  assert.equal(frameAtTime(project.frames, 8, 0), 0);
  assert.equal(frameAtTime(project.frames, 8, .25), 0);
  assert.equal(frameAtTime(project.frames, 8, .375), 1);
  assert.equal(frameAtTime(project.frames, 8, .625), 2);
  assert.equal(frameAtTime(project.frames, 8, 100), 2);
});
test('walking at maximum elevation still creates a project that can be reopened', () => {
  const project = newProject(); project.scene.actors[0].y = 3;
  project.frames = motionFrames(project.scene, project.scene.actors[0].id, 'walk');
  assert.deepEqual(parseProject(project), project);
});
test('reordering is immutable, preserves scenes and safely ignores boundary moves', () => {
  const project = newProject(), frames = motionFrames(project.scene, project.scene.actors[0].id, 'walk');
  const ids = frames.map(f => f.id);
  const moved = moveFrame(frames, ids[0], 1);
  assert.deepEqual(moved.slice(0, 2).map(f => f.id), [ids[1], ids[0]]);
  assert.deepEqual(frames.map(f => f.id), ids);
  assert.equal(moveFrame(frames, ids[0], -1), frames);
  assert.equal(moveFrame(frames, 'missing', 1), frames);
  assert.equal(moveFrame(frames, ids.at(-1)!, 1), frames);
});
test('project round trip preserves editable frames, character profile, audio and brief', async () => {
  const project = newProject(); project.brief = 'O coelho faz uma pausa.'; project.client = 'TG';
  project.scene.actors[0].description = 'Curioso e gentil';
  project.audio = 'data:audio/wav;base64,AAAA'; project.audioName = 'voz.wav'; project.backdrop = 'data:image/png;base64,AAAA';
  project.frames = motionFrames(project.scene, project.scene.actors[0].id, 'talk');
  const imported = parseProject(JSON.parse(JSON.stringify(project)));
  assert.deepEqual(imported, project);
  imported.scene.actors[0].pose.head = 30;
  assert.notEqual(project.scene.actors[0].pose.head, 30);
  await saveProject(project); assert.deepEqual(await loadProject(), project);
  const updated = { ...project, title: 'Versão final' };
  await saveProject(updated); assert.deepEqual(await loadProject(), updated);
});
test('imports reject unsupported projects, unsafe media, invalid numbers and duplicate IDs', () => {
  const project = newProject();
  assert.throws(() => parseProject({ ...project, version: 2 }));
  assert.throws(() => parseProject({ ...project, audio: 'https://example.com/audio.mp3' }));
  assert.throws(() => parseProject({ ...project, backdrop: 'data:image/svg+xml;base64,AAAA' }));
  assert.throws(() => parseProject({ ...project, fps: Number.NaN }));
  assert.throws(() => parseProject({ ...project, frames: Array(MAX_FRAMES + 1).fill({}) }));
  const scene = cloneScene(project.scene); scene.actors[1].id = scene.actors[0].id;
  assert.throws(() => parseProject({ ...project, scene }));
  const frames = motionFrames(project.scene, project.scene.actors[0].id, 'wave');
  frames[1].id = frames[0].id; assert.throws(() => parseProject({ ...project, frames }));
  frames[1].id = 'different'; frames[0].hold = 1.5; assert.throws(() => parseProject({ ...project, frames }));
});
