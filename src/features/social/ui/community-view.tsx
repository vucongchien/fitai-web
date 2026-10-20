import type { ActivityFeedVM } from "../model/social.types";
import { FeedList } from "./feed-list";

interface Props {
  data: ActivityFeedVM;
  currentUserId?: string;
}

export function CommunityView({ data, currentUserId }: Props) {
  return (
    <FeedList
      initialItems={data.items}
      initialNextCursor={data.nextCursor}
      currentUserId={currentUserId}
    />
  );
}
