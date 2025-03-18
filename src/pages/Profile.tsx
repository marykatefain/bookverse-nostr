
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Book, BookOpen, BookMarked, Share2, Link, Settings, MessageCircle, FileText, BookmarkIcon } from "lucide-react";
import { 
  getCurrentUser, 
  isLoggedIn, 
  fetchProfileData,
  fetchUserBooks,
  fetchUserReviews
} from "@/lib/nostr";
import { useToast } from "@/hooks/use-toast";
import { RelaySettings } from "@/components/RelaySettings";
import { Book as BookType, BookReview, Post } from "@/lib/nostr/types";
import { BookCard } from "@/components/BookCard";
import { ReviewCard } from "@/components/ReviewCard";
import { PostCard } from "@/components/post/PostCard";
import { fetchUserPosts } from "@/lib/nostr/posts";

const Profile = () => {
  const { toast } = useToast();
  const [user, setUser] = useState(getCurrentUser());
  const [activeTab, setActiveTab] = useState("reading");
  const [showRelaySettings, setShowRelaySettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<{
    tbr: BookType[],
    reading: BookType[],
    read: BookType[]
  }>({
    tbr: [],
    reading: [],
    read: []
  });
  const [reviews, setReviews] = useState<BookReview[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  
  const fetchBooks = async () => {
    if (user?.pubkey) {
      setLoading(true);
      try {
        const userBooks = await fetchUserBooks(user.pubkey);
        setBooks(userBooks);
      } catch (error) {
        console.error("Error fetching user books:", error);
        toast({
          title: "Error fetching books",
          description: "Could not retrieve your books. Please try again later."
        });
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user?.pubkey) {
      fetchProfileData(user.pubkey)
        .then(profileData => {
          if (profileData) {
            setUser(prev => prev ? { ...prev, ...profileData } : prev);
          }
        })
        .catch(error => {
          console.error("Error fetching profile data:", error);
        });
      
      fetchBooks();
      
      setLoading(true);
      
      // Fetch reviews
      fetchUserReviews(user.pubkey)
        .then(userReviews => {
          setReviews(userReviews);
        })
        .catch(error => {
          console.error("Error fetching user reviews:", error);
        });
        
      // Fetch posts
      fetchUserPosts(user.pubkey)
        .then(userPosts => {
          setPosts(userPosts);
        })
        .catch(error => {
          console.error("Error fetching user posts:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [user?.pubkey]);
  
  if (!isLoggedIn()) {
    return <Navigate to="/" />;
  }

  const copyProfileLink = () => {
    navigator.clipboard.writeText(`https://bookverse.app/profile/${user?.npub}`);
    toast({
      title: "Link copied!",
      description: "Your profile link has been copied to clipboard"
    });
  };

  const toggleRelaySettings = () => {
    setShowRelaySettings(!showRelaySettings);
  };

  return (
    <Layout>
      <div className="container px-4 md:px-6 py-8">
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-muted flex-shrink-0">
              <img
                src={user?.picture || "https://i.pravatar.cc/300"}
                alt={user?.name || "User"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-3xl font-bold font-serif text-bookverse-ink">{user?.name || user?.display_name || "Nostr User"}</h1>
                <p className="text-muted-foreground">{user?.npub}</p>
                <p className="mt-2">{user?.about || "No bio yet"}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm" onClick={copyProfileLink}>
                  <Link className="h-4 w-4 mr-2" />
                  Copy Profile Link
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Profile
                </Button>
                <Button size="sm" className="bg-bookverse-accent hover:bg-bookverse-highlight">
                  <Book className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button variant="outline" size="sm" onClick={toggleRelaySettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  Relays
                </Button>
              </div>
            </div>
          </div>

          {showRelaySettings && (
            <div className="animate-in fade-in slide-in-from-top-5 duration-300">
              <RelaySettings />
            </div>
          )}

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BookOpen className="h-8 w-8 text-bookverse-accent mb-2" />
                  <div className="text-2xl font-bold">{books.reading.length}</div>
                  <p className="text-muted-foreground">Currently Reading</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Book className="h-8 w-8 text-bookverse-accent mb-2" />
                  <div className="text-2xl font-bold">{books.read.length}</div>
                  <p className="text-muted-foreground">Books Read</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <BookMarked className="h-8 w-8 text-bookverse-accent mb-2" />
                  <div className="text-2xl font-bold">{books.tbr.length}</div>
                  <p className="text-muted-foreground">To Be Read</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <FileText className="h-8 w-8 text-bookverse-accent mb-2" />
                  <div className="text-2xl font-bold">{posts.length}</div>
                  <p className="text-muted-foreground">Posts</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="posts" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-transparent border-b rounded-none justify-start space-x-8">
              <TabsTrigger value="posts" className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Posts
                <div className={`${activeTab === "posts" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
              </TabsTrigger>
              <TabsTrigger value="reviews" className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Reviews
                <div className={`${activeTab === "reviews" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
              </TabsTrigger>
              <TabsTrigger value="want-to-read" className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                To Be Read (TBR)
                <div className={`${activeTab === "want-to-read" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
              </TabsTrigger>
              <TabsTrigger value="reading" className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Currently Reading
                <div className={`${activeTab === "reading" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
              </TabsTrigger>
              <TabsTrigger value="read" className="relative px-0 py-2 h-auto rounded-none data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Read
                <div className={`${activeTab === "read" ? "bg-bookverse-accent" : "bg-transparent"} absolute bottom-0 left-0 right-0 h-0.5 transition-colors duration-200`}></div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="pt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-bookverse-accent border-t-transparent rounded-full"></div>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <PostCard 
                      key={post.id} 
                      post={post}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    You haven't shared any posts yet
                  </p>
                  <Button className="bg-bookverse-accent hover:bg-bookverse-highlight">
                    <Book className="mr-2 h-4 w-4" />
                    Share What You're Reading
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reviews" className="pt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-bookverse-accent border-t-transparent rounded-full"></div>
                </div>
              ) : reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reviews.map((review) => (
                    <ReviewCard 
                      key={review.id} 
                      review={review}
                      bookTitle={review.bookTitle}
                      showBookInfo={true}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-md">
                    You haven't written any book reviews yet
                  </p>
                  <Button className="bg-bookverse-accent hover:bg-bookverse-highlight">
                    <Book className="mr-2 h-4 w-4" />
                    Discover Books to Review
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="reading" className="pt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-bookverse-accent border-t-transparent rounded-full"></div>
                </div>
              ) : books.reading.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.reading.map((book) => (
                    <BookCard 
                      key={book.id} 
                      book={book} 
                      size="medium"
                      onUpdate={fetchBooks}
                    />
                  ))}
                </div>
              ) : (
                <EmptyBookshelf type="reading" />
              )}
            </TabsContent>

            <TabsContent value="read" className="pt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-bookverse-accent border-t-transparent rounded-full"></div>
                </div>
              ) : books.read.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.read.map((book) => (
                    <BookCard 
                      key={book.id} 
                      book={book}
                      size="medium"
                      onUpdate={fetchBooks}
                    />
                  ))}
                </div>
              ) : (
                <EmptyBookshelf type="read" />
              )}
            </TabsContent>

            <TabsContent value="want-to-read" className="pt-6">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin h-8 w-8 border-4 border-bookverse-accent border-t-transparent rounded-full"></div>
                </div>
              ) : books.tbr.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {books.tbr.map((book) => (
                    <BookCard 
                      key={book.id} 
                      book={book}
                      size="medium"
                      onUpdate={fetchBooks}
                    />
                  ))}
                </div>
              ) : (
                <EmptyBookshelf type="want-to-read" />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

const EmptyBookshelf = ({ type }: { type: string }) => {
  const messages = {
    reading: {
      title: "No books currently reading",
      description: "Books you start reading will appear here",
      icon: BookOpen
    },
    read: {
      title: "No books read yet",
      description: "Books you've finished will appear here",
      icon: Book
    },
    "want-to-read": {
      title: "No books in your want to read list",
      description: "Books you want to read in the future will appear here",
      icon: BookMarked
    }
  };

  const message = messages[type as keyof typeof messages];

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <message.icon className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-medium mb-2">{message.title}</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        {message.description}
      </p>
      <Button className="bg-bookverse-accent hover:bg-bookverse-highlight">
        <Book className="mr-2 h-4 w-4" />
        Discover Books
      </Button>
    </div>
  );
};

export default Profile;
