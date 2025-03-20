import React, { useEffect } from "react";
import { isLoggedIn } from "@/lib/nostr";
import { useSocialFeed } from "@/hooks/use-social-feed";
import { useFeedReactions } from "@/hooks/use-feed-reactions";
import { FeedContent } from "./social/FeedContent";
import { EmptyFeedState } from "./social/EmptyFeedState";
import { FeedLoadingState } from "./social/FeedLoadingState";
import { FeedLoginState } from "./social/FeedLoginState";
import { FeedErrorState } from "./social/FeedErrorState";
import { SocialActivity } from "@/lib/nostr/types";
import { getConnectionStatus } from "@/lib/nostr/relay";
import { RefreshCw, WifiOff } from "lucide-react";
import { Button } from "./ui/button";

interface SocialFeedProps {
  activities?: SocialActivity[];
  type?: "followers" | "global";
  useMockData?: boolean;
  maxItems?: number;
  refreshTrigger?: number;
  isBackgroundRefresh?: boolean;
  onRefreshComplete?: () => void;
}

export function SocialFeed({ 
  activities: providedActivities, 
  type = "followers", 
  useMockData = false, 
  maxItems,
  refreshTrigger = 0,
  isBackgroundRefresh = false,
  onRefreshComplete
}: SocialFeedProps) {
  const { 
    activities, 
    loading, 
    backgroundLoading, 
    error,
    refreshFeed
  } = useSocialFeed({
    type,
    useMockData,
    maxItems,
    refreshTrigger,
    providedActivities,
    isBackgroundRefresh
  });

  const { activities: reactiveActivities, handleReact } = useFeedReactions(activities);
  
  useEffect(() => {
    if ((!loading && !backgroundLoading) && onRefreshComplete) {
      onRefreshComplete();
    }
  }, [loading, backgroundLoading, onRefreshComplete]);

  const handleFindFriends = () => {
    const findFriendsTab = document.querySelector('[value="find-friends"]');
    if (findFriendsTab && findFriendsTab instanceof HTMLElement) {
      findFriendsTab.click();
    }
  };

  const connectionStatus = getConnectionStatus();
  const isDisconnected = connectionStatus === 'disconnected';
  
  if (loading && reactiveActivities.length === 0) {
    return <FeedLoadingState />;
  }

  if (error && reactiveActivities.length === 0) {
    return <FeedErrorState error={error} onRetry={refreshFeed} />;
  }

  if (isDisconnected && reactiveActivities.length === 0 && !loading) {
    return <FeedErrorState 
      error={new Error("Not connected to any relays")} 
      onRetry={refreshFeed} 
      isConnectionIssue={true}
    />;
  }

  if (!isLoggedIn() && type === "followers") {
    return <FeedLoginState feedType={type} />;
  }

  if (activities.length === 0) {
    return <EmptyFeedState type={type} onFindFriends={handleFindFriends} />;
  }

  return (
    <div>
      {isDisconnected && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/30 rounded-md border border-amber-200 dark:border-amber-800 flex items-center justify-between">
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 text-amber-600 dark:text-amber-500 mr-2" />
            <span className="text-sm text-amber-800 dark:text-amber-400">Connection to Nostr relays lost</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={refreshFeed}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Reconnect
          </Button>
        </div>
      )}
      <FeedContent 
        activities={activities}
        onReaction={handleReact} 
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
}
