const express = require('express');
const router = express.Router();
const topicsController = require('../controllers/topicsController');

router.get('/:topicId/questions', topicsController.getTopicQuestions);

module.exports = router;
