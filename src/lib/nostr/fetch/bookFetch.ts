
import { SimplePool, type Filter, type Event } from "nostr-tools";
import { Book, NOSTR_KINDS } from "../types";
import { getUserRelays } from "../relay";
import { getBookByISBN, getBooksByISBN } from "@/lib/openlibrary";
import { getReadingStatusFromEventKind } from "../utils/eventUtils";

/**
 * Extract all ISBNs from the tags of an event
 */
export function extractISBNsFromTags(event: Event): string[] {
  const isbnTags = event.tags.filter(tag => tag[0] === 'i' && tag[1]?.startsWith('isbn:'));
  return isbnTags.map(tag => tag[1].replace('isbn:', ''));
}

/**
 * Extract a single ISBN from tags (used for backward compatibility)
 */
export function extractISBNFromTags(event: Event): string | null {
  const isbnTag = event.tags.find(tag => tag[0] === 'i' && tag[1]?.startsWith('isbn:'));
  if (isbnTag && isbnTag[1]) {
    return isbnTag[1].replace('isbn:', '');
  }
  return null;
}

/**
 * Convert a Nostr event to a Book object
 */
export function eventToBook(event: Event, isbn: string): Book | null {
  try {
    if (!isbn) {
      console.warn('Missing ISBN for event:', event);
      return null;
    }
    
    // Default book with required fields
    const book: Book = {
      id: `${event.id}-${isbn}`, // Make ID unique for each book-isbn combination
      title: "", // Will be filled in later
      author: "", // Will be filled in later
      isbn,
      coverUrl: `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`,
      description: "",
      pubDate: "",
      pageCount: 0,
      categories: []
    };
    
    // Add event creation date as reading status date
    const readingStatus = {
      status: getReadingStatusFromEventKind(event.kind),
      dateAdded: event.created_at * 1000,
    };
    
    return { ...book, readingStatus };
  } catch (error) {
    console.error('Error parsing book from event:', error);
    return null;
  }
}

/**
 * Fetch user's books from relays
 */
export async function fetchUserBooks(pubkey: string): Promise<{
  tbr: Book[],
  reading: Book[],
  read: Book[]
}> {
  const relays = getUserRelays();
  const pool = new SimplePool();
  
  try {
    // Create a filter for all book event kinds
    const filter: Filter = {
      kinds: [
        NOSTR_KINDS.BOOK_TBR,
        NOSTR_KINDS.BOOK_READING,
        NOSTR_KINDS.BOOK_READ
      ],
      authors: [pubkey],
      limit: 1000 // Increased limit from default to 1000
    };
    
    const events = await pool.querySync(relays, filter);
    console.log(`Found ${events.length} book events`);
    
    // Group books by reading status
    const tbrBooks: Book[] = [];
    const readingBooks: Book[] = [];
    const readBooks: Book[] = [];
    
    // Process all events and extract books for each ISBN in each event
    for (const event of events) {
      console.log(`Processing event: ${event.id}, kind: ${event.kind}, tags:`, event.tags);
      
      // Get all ISBNs from this event's tags
      const isbns = extractISBNsFromTags(event);
      console.log(`Found ${isbns.length} ISBNs in event ${event.id}:`, isbns);
      
      if (isbns.length === 0) {
        console.warn(`No ISBNs found in event ${event.id}`);
        continue;
      }
      
      // Create a book object for each ISBN
      for (const isbn of isbns) {
        const book = eventToBook(event, isbn);
        if (!book || !book.readingStatus) continue;
        
        const status = book.readingStatus.status;
        if (status === 'reading') {
          readingBooks.push(book);
        } else if (status === 'finished') {
          readBooks.push(book);
        } else {
          tbrBooks.push(book);
        }
      }
    }
    
    console.log(`Created book objects: TBR=${tbrBooks.length}, Reading=${readingBooks.length}, Read=${readBooks.length}`);
    
    // Extract all unique ISBNs from all books
    const allBooks = [...tbrBooks, ...readingBooks, ...readBooks];
    const isbns = allBooks.map(book => book.isbn).filter(isbn => isbn && isbn.length > 0) as string[];
    const uniqueIsbns = [...new Set(isbns)];
    
    console.log(`Found ${uniqueIsbns.length} unique ISBNs to fetch details for`);
    
    // Fetch additional book details from OpenLibrary if we have ISBNs
    if (uniqueIsbns.length > 0) {
      try {
        const bookDetails = await getBooksByISBN(uniqueIsbns);
        
        // Create a map for quick lookup
        const bookDetailsMap = new Map<string, Partial<Book>>();
        bookDetails.forEach(book => {
          if (book.isbn) {
            bookDetailsMap.set(book.isbn, book);
          }
        });
        
        // Enhance books with OpenLibrary data
        const enhanceBook = (book: Book) => {
          if (!book.isbn) return book;
          
          const details = bookDetailsMap.get(book.isbn);
          if (details) {
            // Merge the details while preserving the id and reading status
            return {
              ...book,
              ...details,
              id: book.id, // Keep the original ID
              isbn: book.isbn, // Keep the original ISBN
              readingStatus: book.readingStatus // Keep the reading status
            };
          }
          return book;
        };
        
        // Apply enhancements to each list
        const enhancedTbrBooks = tbrBooks.map(enhanceBook);
        const enhancedReadingBooks = readingBooks.map(enhanceBook);
        const enhancedReadBooks = readBooks.map(enhanceBook);
        
        console.log(`Enhanced books: TBR=${enhancedTbrBooks.length}, Reading=${enhancedReadingBooks.length}, Read=${enhancedReadBooks.length}`);
        
        return {
          tbr: enhancedTbrBooks,
          reading: enhancedReadingBooks,
          read: enhancedReadBooks
        };
      } catch (error) {
        console.error('Error enhancing books with OpenLibrary data:', error);
        // Fall back to using basic book data without enhancements
        console.log(`Falling back to unenhanced data: TBR=${tbrBooks.length}, Reading=${readingBooks.length}, Read=${readBooks.length}`);
        
        return {
          tbr: tbrBooks,
          reading: readingBooks,
          read: readBooks
        };
      }
    } else {
      // No ISBNs, just use the basic book data
      console.log(`No ISBNs found, using basic data: TBR=${tbrBooks.length}, Reading=${readingBooks.length}, Read=${readBooks.length}`);
      
      return {
        tbr: tbrBooks,
        reading: readingBooks,
        read: readBooks
      };
    }
  } catch (error) {
    console.error('Error fetching books from relays:', error);
    return { tbr: [], reading: [], read: [] };
  } finally {
    pool.close(relays);
  }
}

/**
 * Fetch multiple books by their ISBNs
 */
export async function fetchBooksByISBN(isbns: string[]): Promise<Book[]> {
  const validIsbns = isbns.filter(isbn => isbn && isbn.length > 0);
  if (validIsbns.length === 0) {
    return [];
  }
  return getBooksByISBN(validIsbns);
}

/**
 * Fetch a single book by ISBN
 */
export async function fetchBookByISBN(isbn: string): Promise<Book | null> {
  if (!isbn || isbn.trim() === '') {
    return null;
  }
  return getBookByISBN(isbn);
}

/**
 * Simple placeholder for backward compatibility
 */
export async function ensureBookMetadata(book: Book): Promise<string | null> {
  console.log("Book metadata is no longer needed in the simplified approach");
  return "placeholder"; // Return a non-null value to avoid errors
}
