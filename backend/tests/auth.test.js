import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';

const { default: app } = await import('../app.js');
const userModel = (await import('../models/user.model.js')).default;
const projectModel = (await import('../models/project.model.js')).default;

const testEmail = `test-${Date.now()}@example.com`;
const testPassword = 'password123';
let accessToken = '';
let refreshToken = '';
let userId = '';
let projectId = '';

test.before(async () => {
    await userModel.deleteMany({ email: testEmail });
});

test.after(async () => {
    if (projectId) {
        await projectModel.deleteMany({ _id: projectId });
    }
    await userModel.deleteMany({ email: testEmail });
});

test('registers a new user', async () => {
    const response = await request(app).post('/users/register').send({
        email: testEmail,
        password: testPassword,
    });

    assert.equal(response.status, 201);
    assert.ok(response.body.token);
    assert.ok(response.body.refreshToken);
    assert.equal(response.body.user.email, testEmail);

    accessToken = response.body.token;
    refreshToken = response.body.refreshToken;
    userId = response.body.user._id;
});

test('logs in an existing user', async () => {
    const response = await request(app).post('/users/login').send({
        email: testEmail,
        password: testPassword,
    });

    assert.equal(response.status, 200);
    assert.ok(response.body.token);
});

test('returns profile for authenticated user', async () => {
    const response = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.user.email, testEmail);
});

test('rejects unauthenticated profile access', async () => {
    const response = await request(app).get('/users/profile');
    assert.equal(response.status, 401);
});

test('creates a project', async () => {
    const response = await request(app)
        .post('/projects/create')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: `project-${Date.now()}` });

    assert.equal(response.status, 201);
    assert.ok(response.body._id);
    projectId = response.body._id;
});

test('blocks project access without token', async () => {
    const response = await request(app).get(`/projects/get-project/${projectId}`);
    assert.equal(response.status, 401);
});

test('allows owner to fetch project', async () => {
    const response = await request(app)
        .get(`/projects/get-project/${projectId}`)
        .set('Authorization', `Bearer ${accessToken}`);

    assert.equal(response.status, 200);
    assert.equal(response.body.project._id, projectId);
});

test('refreshes access token', async () => {
    const response = await request(app).post('/users/refresh').send({ refreshToken });
    assert.equal(response.status, 200);
    assert.ok(response.body.token);
    accessToken = response.body.token;
});

test('logs out and blacklists token', async () => {
    const response = await request(app)
        .post('/users/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

    assert.equal(response.status, 200);

    const profile = await request(app)
        .get('/users/profile')
        .set('Authorization', `Bearer ${accessToken}`);

    assert.equal(profile.status, 401);
});
