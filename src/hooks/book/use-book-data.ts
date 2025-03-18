
import { useState, useEffect } from "react";
import { Book } from "@/lib/nostr/types";
import { fetchBookByISBN } from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

export const useBookData = (isbn: string | undefined) => {
  const [isRead, setIsRead] = useState(false);
  const { toast } = useToast();

  const { 
    data: book = null, 
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['book', isbn],
    queryFn: async () => {
      if (!isbn) return null;
      console.log(`Fetching book details for ISBN: ${isbn}`);
      return await fetchBookByISBN(isbn);
    },
    enabled: !!isbn,
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
    retry: 2,
    retryDelay: attempt => Math.min(attempt > 1 ? 2000 : 1000, 30 * 1000)
  });

  // Set read status when book data is available
  useEffect(() => {
    if (book) {
      console.log(`Book data loaded successfully for ISBN: ${isbn}`, book);
      setIsRead(book.readingStatus?.status === 'finished');
    }
  }, [book, isbn]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error(`Error fetching book data for ISBN: ${isbn}:`, error);
      toast({
        title: "Error",
        description: "Could not load book details",
        variant: "destructive"
      });
    }
  }, [error, toast, isbn]);

  return {
    book,
    loading,
    isRead,
    setIsRead
  };
};
