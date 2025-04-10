
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { BookReview } from "@/lib/nostr/types";
import { formatPubkey } from "@/lib/utils/format";
import { isLoggedIn, getCurrentUser } from "@/lib/nostr";
import { RepliesSection } from "@/components/social/RepliesSection";
import { NOSTR_KINDS } from "@/lib/nostr/types";
import { BookRating } from "./BookRating";
import { Switch } from "@/components/ui/switch";
import { EmojiTextarea } from "@/components/emoji/EmojiTextarea";
import { Rating } from "@/lib/utils/Rating";

interface BookReviewSectionProps {
  reviews: BookReview[];
  userRating: Rating;
  reviewText: string;
  setReviewText: (text: string) => void;
  submitting: boolean;
  handleSubmitReview: () => void;
  handleRateBook: (rating: Rating) => void;
  handleReactToReview: (reviewId: string) => void;
  isSpoiler: boolean;
  setIsSpoiler: (value: boolean) => void;
}

export const BookReviewSection: React.FC<BookReviewSectionProps> = ({
  reviews,
  userRating,
  reviewText,
  setReviewText,
  submitting,
  handleSubmitReview,
  handleRateBook,
  handleReactToReview,
  isSpoiler,
  setIsSpoiler
}) => {
  const [spoilerRevealed, setSpoilerRevealed] = useState<{[key: string]: boolean}>({});
  const [hasExistingReview, setHasExistingReview] = useState(false);
  const currentUser = getCurrentUser();
  
  // Convert rating to 0-5 scale for display
  const displayRating = userRating && typeof userRating.toScale === 'function' ? userRating.toScale(5) : 0;
  
  // Check if the current user has an existing review
  useEffect(() => {
    if (currentUser && reviews.length > 0) {
      const existingReview = reviews.find(review => review.pubkey === currentUser.pubkey);
      setHasExistingReview(!!existingReview && !!existingReview.content);
    } else {
      setHasExistingReview(false);
    }
  }, [reviews, currentUser]);
  
  return (
    <div className="space-y-6">
      {renderReviewForm()}
      <div className="mt-8 space-y-4">
        {renderReviews()}
      </div>
    </div>
  );

  function renderStars(count: number) {
    return Array(5).fill(0).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${index < count ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
      />
    ));
  }

  function renderRatingControls() {
    return (
      <div className="mt-4">
        <p className="text-sm font-medium mb-2">
          {userRating && userRating.fraction > 0 ? 'Your Rating:' : 'Rate this book:'}
        </p>
        <div className="flex gap-2 items-center">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              onClick={() => handleRateBook(Rating.fromScale(rating, 5))}
              disabled={submitting}
              className={`rounded-full p-1 ${displayRating === rating ? 'bg-yellow-100 dark:bg-yellow-900/30' : ''}`}
              aria-label={`Rate ${rating} stars`}
            >
              <Star 
                className={`h-6 w-6 ${
                  displayRating >= rating 
                    ? 'text-bookverse-highlight fill-bookverse-highlight' 
                    : 'text-gray-300 dark:text-gray-600'
                }`} 
              />
            </button>
          ))}
          
          {userRating && userRating.fraction > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {displayRating}/5
            </span>
          )}
        </div>
      </div>
    );
  }

  function renderReviewForm() {
    if (!isLoggedIn()) {
      return (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please sign in to leave a review or rating
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Write a Review</CardTitle>
          <CardDescription>Share your thoughts about this book</CardDescription>
        </CardHeader>
        <CardContent>
          {renderRatingControls()}
          <EmojiTextarea
            className="mt-4"
            placeholder={hasExistingReview && !reviewText ? 
              "Leave empty to preserve your previous review text when updating rating" : 
              "Write your review here..."}
            value={reviewText}
            onChange={(e) => {
              if (typeof e === 'string') {
                setReviewText(e);
              } else {
                setReviewText(e.target.value);
              }
            }}
            rows={4}
          />
          {hasExistingReview && !reviewText && (
            <div className="flex items-center space-x-2 mt-2 text-muted-foreground text-sm">
              <Info className="h-3.5 w-3.5" />
              <span>
                If you only want to update your rating, your existing review text will be preserved
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2 mt-3">
            <Switch
              id="spoiler-toggle"
              checked={isSpoiler}
              onCheckedChange={setIsSpoiler}
            />
            <label
              htmlFor="spoiler-toggle"
              className="text-sm cursor-pointer flex items-center gap-1"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              <span>This review contains spoilers</span>
            </label>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleSubmitReview} 
            disabled={submitting}
          >
            {submitting ? "Submitting..." : (userRating && !reviewText && hasExistingReview) ? 
              "Update Rating" : "Submit Review"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  function handleRevealSpoiler(reviewId: string) {
    setSpoilerRevealed(prev => ({
      ...prev,
      [reviewId]: true
    }));
  }

  function renderReviews() {
    if (reviews.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No reviews yet. Be the first to review this book!
        </p>
      );
    }
    
    return reviews.map((review) => (
      <Card key={review.id} className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={review.author?.picture} />
                <AvatarFallback>{review.author?.name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <div>
                <Link 
                  to={`/user/${review.pubkey}`} 
                  className="font-medium hover:underline"
                >
                  {review.author?.name || formatPubkey(review.pubkey)}
                </Link>
                <div className="flex items-center text-muted-foreground text-xs">
                  <time>{new Date(review.createdAt).toLocaleDateString()}</time>
                  {review.rating && (
                    <>
                      <span className="mx-1">•</span>
                      <div className="flex items-center">
                        <BookRating rating={review.rating} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Link to={`/review/${review.id}`} className="text-muted-foreground hover:text-bookverse-accent" title="View full review">
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          
          {review.isSpoiler && !spoilerRevealed[review.id] && (
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-500 mt-2">
              <AlertTriangle className="h-3 w-3" />
              <span className="text-xs">Spoiler warning</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="py-2">
          {review.isSpoiler && !spoilerRevealed[review.id] ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 rounded-md text-center">
              <p className="text-amber-700 dark:text-amber-400 mb-2">
                This review contains spoilers
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleRevealSpoiler(review.id)}
                className="bg-white dark:bg-transparent hover:bg-amber-50 dark:hover:bg-amber-900/30 border-amber-300 dark:border-amber-700"
              >
                <span className="text-amber-700 dark:text-amber-400">Reveal Content</span>
              </Button>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{review.content}</p>
          )}
        </CardContent>
        <CardFooter className="pt-0 flex-col items-start">
          <RepliesSection 
            eventId={review.id}
            authorPubkey={review.pubkey}
            initialReplies={review.replies}
            buttonLayout="horizontal"
            onReaction={handleReactToReview}
            eventKind={NOSTR_KINDS.REVIEW}
          />
        </CardFooter>
      </Card>
    ));
  }
};
