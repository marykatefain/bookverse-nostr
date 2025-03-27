
import { type Filter, type Event } from "nostr-tools";
import { NOSTR_KINDS } from "../../../types";
import { getUserRelays } from "../../../relay";
import { cacheQueryResult, getCachedQueryResult, generateCacheKey } from "../../../relay/connection";
import { getSharedPool } from "../../../utils/poolManager";

const MAX_REQUEST_TIME = 15000; // 15 seconds timeout
const SHORT_CACHE_TTL = 60000; // 1 minute for short-term cache
const LONG_CACHE_TTL = 300000; // 5 minutes for long-term cache

/**
 * Fetch events for the global feed with caching and timeout
 */
export async function fetchGlobalEvents(limit: number): Promise<Event[]> {
  const relays = getUserRelays();
  
  // Make sure we have relays to query
  if (!relays || relays.length === 0) {
    console.warn("No relays available for fetching global events");
    return [];
  }
  
  // Create filter for query
  const combinedFilter: Filter = {
    kinds: [
      NOSTR_KINDS.BOOK_TBR,
      NOSTR_KINDS.BOOK_READING, 
      NOSTR_KINDS.BOOK_READ,
      NOSTR_KINDS.BOOK_RATING,
      NOSTR_KINDS.REVIEW,
      NOSTR_KINDS.TEXT_NOTE
    ],
    limit: limit * 2, // Increase limit as we'll filter later
    "#t": ["bookstr"]
  };
  
  // Generate cache key for this query
  const cacheKey = generateCacheKey(combinedFilter);
  
  // Check if we have a recent cached result - first check short-term cache
  const cachedEvents = getCachedQueryResult(cacheKey, SHORT_CACHE_TTL);
  if (cachedEvents) {
    console.log("Using cached events for global feed, count:", cachedEvents.length);
    return cachedEvents;
  }
  
  // Check if we have a long-term cache - if we do, use it while we fetch fresh data
  const longTermCachedEvents = getCachedQueryResult(cacheKey, LONG_CACHE_TTL);
  
  // Start fetching new events - don't await yet so we can possibly return long-term cache
  const fetchPromise = fetchFreshEvents(relays, combinedFilter, cacheKey);
  
  // If we have long-term cache, return it immediately while fresh data loads in background
  if (longTermCachedEvents && longTermCachedEvents.length > 0) {
    console.log("Using long-term cached events while fetching fresh data:", longTermCachedEvents.length);
    // Execute fetch in background
    fetchPromise.catch(error => {
      console.error("Background fetch error:", error);
    });
    return longTermCachedEvents;
  }
  
  // No cache available, wait for fresh data
  return await fetchPromise;
}

/**
 * Fetch fresh events from relays
 */
async function fetchFreshEvents(relays: string[], filter: Filter, cacheKey: string): Promise<Event[]> {
  try {
    console.log(`Querying ${relays.length} relays for global feed events...`);
    
    // Get the pool for querying
    const pool = getSharedPool();
    if (!pool) {
      console.error("Failed to get shared pool for event fetching");
      return [];
    }
    
    // Create a promise that will reject after timeout
    const timeoutPromise = new Promise<Event[]>((_, reject) => {
      setTimeout(() => reject(new Error("Query timed out")), MAX_REQUEST_TIME);
    });
    
    // Execute the query with a timeout
    const queryPromise = pool.querySync(relays, filter);
    const events = await Promise.race([queryPromise, timeoutPromise]);
    
    console.log(`Received ${events.length} raw events from relays`);
    
    // Cache the result for future use
    if (events && events.length > 0) {
      cacheQueryResult(cacheKey, events);
      console.log(`Cached ${events.length} events for future use`);
    }
    
    return events || [];
  } catch (error) {
    console.error("Error fetching global events:", error);
    // Return empty array to allow graceful fallback
    return [];
  }
}
