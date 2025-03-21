
import React from "react";
import { Button } from "@/components/ui/button";
import { Book, Link, Settings, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProfileHeaderProps {
  user: {
    picture?: string;
    name?: string;
    display_name?: string;
    npub?: string;
    about?: string;
  } | null;
  toggleRelaySettings: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ user, toggleRelaySettings }) => {
  const { toast } = useToast();

  const copyProfileLink = () => {
    navigator.clipboard.writeText(`https://bookverse.app/profile/${user?.npub}`);
    toast({
      title: "Link copied!",
      description: "Your profile link has been copied to clipboard"
    });
  };

  return (
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
          <h1 className="text-3xl font-bold font-serif text-bookverse-ink">
            {user?.name || user?.display_name || "Nostr User"}
          </h1>
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
  );
};
