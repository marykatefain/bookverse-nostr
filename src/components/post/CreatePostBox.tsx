
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isLoggedIn } from "@/lib/nostr";
import { PostMediaPreview } from "./create/PostMediaPreview";
import { BookSelector } from "./create/BookSelector";
import { PostToolbar } from "./create/PostToolbar";
import { usePostBox } from "./create/usePostBox";

interface CreatePostBoxProps {
  onPostSuccess?: () => void;
}

export function CreatePostBox({ onPostSuccess }: CreatePostBoxProps) {
  const {
    content,
    setContent,
    selectedBook,
    setSelectedBook,
    searchQuery,
    setSearchQuery,
    searchResults,
    searching,
    mediaPreview,
    mediaType,
    isSpoiler,
    setIsSpoiler,
    posting,
    open,
    setOpen,
    userBooks,
    loadingUserBooks,
    fileInputRef,
    handleSelectBook,
    handleMediaUpload,
    clearMedia,
    handleSubmit,
    user,
    pendingBook,
    showISBNModal,
    setShowISBNModal
  } = usePostBox({ onPostSuccess });

  if (!isLoggedIn()) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            Please sign in to create posts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.picture} />
            <AvatarFallback>{user?.name?.[0] || user?.display_name?.[0] || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-4">
            <Textarea
              placeholder="What are you reading?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="resize-none"
              rows={3}
            />
            
            <BookSelector
              open={open}
              setOpen={setOpen}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searching={searching}
              searchResults={searchResults}
              selectedBook={selectedBook}
              setSelectedBook={setSelectedBook}
              userBooks={userBooks}
              loadingUserBooks={loadingUserBooks}
              handleSelectBook={handleSelectBook}
              pendingBook={pendingBook}
              showISBNModal={showISBNModal}
              setShowISBNModal={setShowISBNModal}
            />
            
            <PostMediaPreview
              mediaPreview={mediaPreview}
              mediaType={mediaType}
              clearMedia={clearMedia}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="flex-wrap gap-2 px-6 py-4 border-t">
        <PostToolbar
          mediaType={mediaType}
          fileInputRef={fileInputRef}
          isSpoiler={isSpoiler}
          setIsSpoiler={setIsSpoiler}
          posting={posting}
          content={content}
          selectedBook={selectedBook}
          handleSubmit={handleSubmit}
        />
      </CardFooter>
    </Card>
  );
}
