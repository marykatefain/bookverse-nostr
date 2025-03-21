
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";

interface BookReviewActivityProps {
  userName: string;
  userPubkey: string;
  bookTitle: string;
  bookIsbn: string;
  bookCover?: string;
  rating?: number;
  content?: string;
}

export function BookReviewActivity({ 
  userName, 
  userPubkey, 
  bookTitle, 
  bookIsbn, 
  bookCover,
  rating, 
  content 
}: BookReviewActivityProps) {
  const [imageError, setImageError] = useState(false);
  
  // Convert rating to a number between 1-5 if it exists
  const displayRating = rating !== undefined ? Math.round(rating) : undefined;
  
  return (
    <div className="flex gap-3">
      {bookCover && !imageError && (
        <Link to={`/book/${bookIsbn}`} className="shrink-0">
          <img 
            src={bookCover} 
            alt={bookTitle} 
            className="h-16 w-12 object-cover rounded-sm"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        </Link>
      )}
      <div>
        <p>
          <Link to={`/user/${userPubkey}`} className="font-medium hover:underline">
            {userName}
          </Link>{' '}
          reviewed{' '}
          <Link to={`/book/${bookIsbn}`} className="font-medium hover:underline">
            {bookTitle}
          </Link>
        </p>
        {displayRating && (
          <div className="flex items-center mt-1">
            {Array(5).fill(0).map((_, index) => (
              <Star
                key={index}
                className={`h-4 w-4 ${index < displayRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
              />
            ))}
          </div>
        )}
        {content && (
          <p className="mt-2 text-sm text-muted-foreground">
            {content.length > 150 
              ? `${content.substring(0, 150)}...` 
              : content}
          </p>
        )}
      </div>
    </div>
  );
}
