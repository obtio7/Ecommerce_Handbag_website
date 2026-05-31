import { Router, Request, Response } from 'express';
import Review from '../models/Review.js';

const router = Router();

/**
 * GET /api/reviews/:productId
 * Get all reviews for a product
 */
router.get('/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ 
      productId, 
      isApproved: true 
    })
      .sort({ createdAt: -1 })
      .lean();

    // Map to frontend format
    const mappedReviews = reviews.map(review => ({
      id: review._id.toString(),
      productId: review.productId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    }));

    res.json(mappedReviews);
  } catch (error) {
    console.error('[Reviews] Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/reviews
 * Create a new review
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { productId, userId, userName, rating, comment } = req.body;

    // Validation
    if (!productId || !userId || !userName || !rating || !comment) {
      return res.status(400).json({ 
        error: 'Missing required fields: productId, userId, userName, rating, comment' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    if (comment.length > 1000) {
      return res.status(400).json({ error: 'Comment must be 1000 characters or less' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(400).json({ 
        error: 'You have already reviewed this product' 
      });
    }

    // Create review
    const review = new Review({
      productId,
      userId,
      userName,
      rating,
      comment,
    });

    await review.save();

    res.status(201).json({
      id: review._id.toString(),
      productId: review.productId,
      userId: review.userId,
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    });
  } catch (error) {
    console.error('[Reviews] Error creating review:', error);
    res.status(500).json({ error: 'Failed to create review' });
  }
});

/**
 * DELETE /api/reviews/:id
 * Delete a review (user can only delete their own)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const review = await Review.findById(id);
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.userId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    await Review.findByIdAndDelete(id);

    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    console.error('[Reviews] Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

/**
 * GET /api/reviews/stats/:productId
 * Get review statistics for a product
 */
router.get('/stats/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const stats = await Review.aggregate([
      { $match: { productId, isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          ratings: {
            $push: '$rating'
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return res.json({
        averageRating: 0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      });
    }

    // Calculate distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    stats[0].ratings.forEach((rating: number) => {
      distribution[rating as keyof typeof distribution]++;
    });

    res.json({
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
      distribution,
    });
  } catch (error) {
    console.error('[Reviews] Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch review stats' });
  }
});

export default router;
