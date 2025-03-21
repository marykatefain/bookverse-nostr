
import { useState, useEffect } from "react";
import { fetchBookByISBN } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { useLibraryData } from "@/hooks/use-library-data";
import { useQuery } from "@tanstack/react-query";

export const useBookData = (isbn: string | undefined) => {
  const [isRead, setIsRead] = useState(false);
  const { toast } = useToast();
  const { getBookReadingStatus, books } = useLibraryData();

  const { 
    data: book = null, 
    isLoading,
    error
  } = useQuery({
    queryKey: ['book', isbn],
    queryFn: async () => {
      if (!isbn) return null;
      console.log(`Fetching book details for ISBN: ${isbn}`);
      try {
        const result = await fetchBookByISBN(isbn);
        console.log(`Book data loaded successfully for ISBN: ${isbn}`);
        return result;
      } catch (err) {
        console.error(`Error fetching book data for ISBN: ${isbn}:`, err);
        toast({
          title: "Error",
          description: "Could not load book details",
          variant: "destructive"
        });
        throw err;
      }
    },
    enabled: !!isbn,
    staleTime: 60 * 60 * 1000, // 1 hour
    retry: 1
  });

  // Get the reading status from the user's library
  const readingStatus = getBookReadingStatus(isbn);

  // Find the book in user's library to get its rating - Add detailed logging
  const findBookWithRating = () => {
    if (!isbn || !books) return null;
    
    // Check each list for the book with matching ISBN
    const bookInTbr = books.tbr.find(b => b.isbn === isbn);
    if (bookInTbr?.readingStatus?.rating !== undefined) {
      console.log(`Found book with rating in TBR: ${bookInTbr.title}, rating: ${bookInTbr.readingStatus.rating}`);
      return bookInTbr;
    }
    
    const bookInReading = books.reading.find(b => b.isbn === isbn);
    if (bookInReading?.readingStatus?.rating !== undefined) {
      console.log(`Found book with rating in Reading: ${bookInReading.title}, rating: ${bookInReading.readingStatus.rating}`);
      return bookInReading;
    }
    
    const bookInRead = books.read.find(b => b.isbn === isbn);
    if (bookInRead?.readingStatus?.rating !== undefined) {
      console.log(`Found book with rating in Read: ${bookInRead.title}, rating: ${bookInRead.readingStatus.rating}`);
      return bookInRead;
    }
    
    console.log(`No rating found in user library for ISBN: ${isbn}`);
    return null;
  };

  // Get user's rating from their library if available
  const bookWithRating = findBookWithRating();
  const userRating = bookWithRating?.readingStatus?.rating;
  
  console.log(`User rating for ISBN ${isbn}: ${userRating} (from library)`);

  // Update the book object with the reading status and rating
  const enrichedBook = book ? {
    ...book,
    readingStatus: readingStatus ? {
      status: readingStatus,
      dateAdded: Date.now(), // Add the required dateAdded property
      rating: userRating !== undefined ? userRating : book.readingStatus?.rating
    } : book.readingStatus
  } : null;
  
  // Log the enriched book's rating for debugging
  if (enrichedBook) {
    console.log(`Enriched book ${enrichedBook.title} has rating: ${enrichedBook.readingStatus?.rating}`);
  }

  // Set read status when book data is available
  useEffect(() => {
    if (enrichedBook) {
      setIsRead(enrichedBook.readingStatus?.status === 'finished');
    }
  }, [enrichedBook]);

  return {
    book: enrichedBook,
    loading: isLoading,
    isRead,
    setIsRead
  };
};
