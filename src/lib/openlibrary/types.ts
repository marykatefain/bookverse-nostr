
import { Book } from "@/lib/nostr/types";

export const BASE_URL = "https://openlibrary.org";

export interface OpenLibrarySearchResult {
  numFound: number;
  start: number;
  docs: OpenLibraryDoc[];
}

export interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  author_key?: string[];
  isbn?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  publish_date?: string[];
  first_publish_year?: number;
  number_of_pages_median?: number;
  subject?: string[];
  language?: string[];
  description?: string;
  edition_count?: number;
  has_fulltext?: boolean;
  ia?: string[];
  subtitle?: string;
}
