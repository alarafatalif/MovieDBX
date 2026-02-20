import express from 'express';
import { 
  addToWatchlist, 
  getUserWatchlist, 
  removeFromWatchlist,
  checkWatchlist,
  toggleWatched
} from '../controllers/watchlist.controller.js';

const router = express.Router();

router.post('/', addToWatchlist);

router.get('/check/:userId/:movieId', checkWatchlist);

router.patch('/:userId/:movieId/watched', toggleWatched);

router.get('/:userId', getUserWatchlist);

router.delete('/:userId/:movieId', removeFromWatchlist);

export default router;
