import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';

const { default: app } = await import('../app.js');
const userModel = (await import('../models/user.model.js')).default;
const projectModel = (await import('../models/project.model.js')).default;
const { issueAuthTokens } = await import('../services/auth.service.js');

const ownerEmail = `owner-${Date.now()}@example.com`;
const outsiderEmail = `outsider-${Date.now()}@example.com`;
const inviteeEmail = `invitee-${Date.now()}@example.com`;
const password = 'password123';

let ownerToken = '';
let outsiderToken = '';
let inviteeToken = '';
let ownerId = '';
let inviteeId = '';
let projectId = '';

test.before(async () => {
    await userModel.deleteMany({ email: { $in: [ownerEmail, outsiderEmail, inviteeEmail] } });

    const owner = await userModel.create({
        email: ownerEmail,
        password: await userModel.hashPassword(password),
    });
    const outsider = await userModel.create({
        email: outsiderEmail,
        password: await userModel.hashPassword(password),
    });
    const invitee = await userModel.create({
        email: inviteeEmail,
        password: await userModel.hashPassword(password),
    });

    ownerId = owner._id.toString();
    inviteeId = invitee._id.toString();

    ownerToken = (await issueAuthTokens(owner)).accessToken;
    outsiderToken = (await issueAuthTokens(outsider)).accessToken;
    inviteeToken = (await issueAuthTokens(invitee)).accessToken;

    const project = await projectModel.create({
        name: `authz-${Date.now()}`,
        owner: owner._id,
        users: [owner._id],
        members: [{ user: owner._id, role: 'owner', status: 'active' }],
    });

    projectId = project._id.toString();
});

test.after(async () => {
    await projectModel.deleteMany({ _id: projectId });
    await userModel.deleteMany({ email: { $in: [ownerEmail, outsiderEmail, inviteeEmail] } });
});

test('forbids outsider from reading project', async () => {
    const response = await request(app)
        .get(`/projects/get-project/${projectId}`)
        .set('Authorization', `Bearer ${outsiderToken}`);

    assert.equal(response.status, 403);
});

test('owner can invite collaborator', async () => {
    const response = await request(app)
        .put('/projects/add-user')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ projectId, users: [inviteeId], role: 'collaborator' });

    assert.equal(response.status, 200);
});

test('invitee can accept invite', async () => {
    const response = await request(app)
        .post('/projects/invite/respond')
        .set('Authorization', `Bearer ${inviteeToken}`)
        .send({ projectId, action: 'accept' });

    assert.equal(response.status, 200);
});

test('invitee can access project after accepting', async () => {
    const response = await request(app)
        .get(`/projects/get-project/${projectId}`)
        .set('Authorization', `Bearer ${inviteeToken}`);

    assert.equal(response.status, 200);
});

test('outsider cannot update file tree', async () => {
    const response = await request(app)
        .put('/projects/update-file-tree')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ projectId, fileTree: { 'app.js': { file: { contents: 'test' } } } });

    assert.equal(response.status, 403);
});

test('owner can remove collaborator', async () => {
    const response = await request(app)
        .post('/projects/remove-user')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ projectId, userId: inviteeId });

    assert.equal(response.status, 200);
});
