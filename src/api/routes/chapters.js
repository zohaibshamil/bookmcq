const express = require('express');
const router = express.Router();
const chaptersController = require('../controllers/chaptersController');

router.get('/:chapterId/topics', chaptersController.getChapterTopics);

module.exports = router;
