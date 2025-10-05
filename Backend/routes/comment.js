const express = require('express');
const router = express.Router();

const commentController = require('../controllers/comment.controller');


router.post('/Add', commentController.createComment);

router.get('/getById/:id', commentController.getCommentById);

router.get('/getByTask/:taskId', commentController.getCommentsByTask);

router.put('/Update/:id', commentController.updateComment);

router.delete('/Delete/:id', commentController.deleteComment);


module.exports = router;
