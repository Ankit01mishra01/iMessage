import { Router } from 'express';
import { body } from 'express-validator';
import * as projectController from '../controllers/project.controller.js';
import * as authMiddleWare from '../middleware/auth.middleware.js';

const router = Router();

router.post(
    '/create',
    authMiddleWare.authUser,
    body('name').isString().trim().notEmpty().withMessage('Name is required'),
    projectController.createProject
);

router.get('/all', authMiddleWare.authUser, projectController.getAllProject);

router.put(
    '/add-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('users')
        .isArray({ min: 1 })
        .withMessage('Users must be an array of strings')
        .bail()
        .custom((users) => users.every((user) => typeof user === 'string'))
        .withMessage('Each user must be a string'),
    projectController.addUserToProject
);

router.post(
    '/invite/respond',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('action').isIn(['accept', 'reject']).withMessage('Action must be accept or reject'),
    projectController.respondInvite
);

router.post(
    '/remove-user',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('userId').isString().withMessage('User ID is required'),
    projectController.removeMember
);

router.get('/invites/pending', authMiddleWare.authUser, projectController.getPendingInvites);

router.get('/get-project/:projectId', authMiddleWare.authUser, projectController.getProjectById);

router.get('/:projectId/messages', authMiddleWare.authUser, projectController.getMessages);

router.put(
    '/update-file-tree',
    authMiddleWare.authUser,
    body('projectId').isString().withMessage('Project ID is required'),
    body('fileTree').isObject().withMessage('File tree is required'),
    projectController.updateFileTree
);

export default router;
