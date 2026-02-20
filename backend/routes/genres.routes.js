import express from 'express';
import { getAllGenres, getMoviesByGenre } from '../controllers/genres.controller.js';

const router = express.Router();

router.get('/', getAllGenres);

router.get('/:id/movies', getMoviesByGenre);

export default router;
