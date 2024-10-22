import dynamic from "next/dynamic";

import { useRef, useState } from "react";
import { AlertTriangle, Loader, XIcon } from "lucide-react";
import { toast } from "sonner";
import { differenceInMinutes, format, isToday, isYesterday } from "date-fns";
import Quill from "quill";

import { Id } from "../../../../convex/_generated/dataModel";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Message } from "@/components/message";

import { useGetMessage } from "@/features/messages/api/use-get-message";
import { useGetMessages } from "@/features/messages/api/use-get-messages";
import { useCurrentMember } from "@/features/members/api/use-current-member";
import { useCreateMessage } from "@/features/messages/api/use-create-message";
import { useGenerateUploadUrl } from "@/features/upload/api/use-generate-upload-url";

import { useWorkspaceId } from "@/hooks/use-workpace-id";
import { useChannelId } from "@/hooks/use-channel-id";

const Editor = dynamic(() => import("@/components/editor/editor"), { ssr: false });

const TIME_THRESHOLD = 5;

interface ThreadProps {
  messageId: Id<"messages">;
  onClose: () => void;
}

type CreateMessageValues = {
  channelId: Id<"channels">;
  workspaceId: Id<"workspaces">;
  parentMessageId: Id<"messages">;
  body: string;
  image?: Id<"_storage"> | undefined;
};

const formatDateLabel = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }
  return format(date, "EEEE, MMMM d");
};

export const Thread = ({ messageId, onClose }: ThreadProps) => {
  const channelId = useChannelId();
  const workspaceId = useWorkspaceId();

  const [editingId, setEditingId] = useState<Id<"messages"> | null>(null);

  const [editorKey, setEditorKey] = useState(0);
  const [isPending, setIsPending] = useState(false);

  const editorRef = useRef<Quill | null>(null);

  const { mutate: generateUploadUrl } = useGenerateUploadUrl();
  const { mutate: createMessage } = useCreateMessage();

  const { data: currentMember } = useCurrentMember({ workspaceId });
  const { data: message, isLoading: loadingMessage } = useGetMessage({
    id: messageId,
  });
  const { results, status, loadMore } = useGetMessages({
    channelId,
    parentMessageId: messageId,
  });

  const canLoadMore = status === "CanLoadMore";
  const isLoadingMore = status === "LoadingMore";

  const groupMessages = results?.reduce(
    (groups, message) => {
      const date = new Date(message._creationTime);
      const dateKey = format(date, "yyyy-MM-dd");
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].unshift(message);
      return groups;
    },
    {} as Record<string, typeof results>
  );

  const handleSubmit = async ({
    body,
    image,
  }: {
    body: string;
    image: File | null;
  }) => {
    try {
      setIsPending(true);
      editorRef?.current?.enable(false);

      const values: CreateMessageValues = {
        channelId,
        workspaceId,
        parentMessageId: messageId,
        body,
        image: undefined,
      };

      if (image) {
        const url = await generateUploadUrl({}, { throwError: true });

        if (!url) {
          throw new Error("Failed to generate upload url");
        }

        const result = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": image.type,
          },
          body: image,
        });

        if (!result.ok) {
          throw new Error("Failed to upload image");
        }

        const { storageId } = await result.json();

        values.image = storageId;
      }

      await createMessage(values, { throwError: true });

      setEditorKey((prev) => prev + 1);
    } catch (error) {
      toast.error("Failed to send message");
    } finally {
      setIsPending(false);
      editorRef?.current?.enable(true);
    }
  };

  const dividerMarkup = (isLoadMore: boolean, dateStr: string = "") => {
    return (
      <div className="text-center my-2 relative">
        <hr className="absolute top-1/2 left-0 right-0 border-t border-gray-300" />
        <span className="relative inline-block bg-white px-4 py-1 rounded-full text-xs border border-gray-300 shadow-sm">
          {isLoadMore ? <Loader /> : formatDateLabel(dateStr)}
        </span>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      <div className="h-[49px] flex justify-between items-center px-4 border-b">
        <p className="text-lg font-bold">Thread</p>
        <Button onClick={onClose} size="iconSm" variant="ghost">
          <XIcon className="size-5 stroke-[1.5]" />
        </Button>
      </div>
      <div
        className={cn(
          "",
          (loadingMessage || status === "LoadingFirstPage") &&
            "flex h-full items-center justify-center",
          !message &&
            "flex flex-col gap-y-2 h-full items-center justify-center",
          !loadingMessage &&
            message &&
            "flex-1 flex flex-col-reverse pb-4 overflow-y-auto messages-scrollbar"
        )}
      >
        {loadingMessage || status === "LoadingFirstPage" ? (
          <Loader className="size-5 animate-spin text-muted-foreground" />
        ) : !message ? (
          <>
            <AlertTriangle className="size-5 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Message not found</p>
          </>
        ) : (
          <>
            {Object.entries(groupMessages || {}).map(([dateKey, messages]) => (
              <div key={dateKey}>
                {dividerMarkup(false, dateKey)}
                {messages.map((message, index) => {
                  const previousMessage = messages[index - 1];
                  const isCompact =
                    previousMessage &&
                    previousMessage.user?._id === message.user?._id &&
                    differenceInMinutes(
                      new Date(message._creationTime),
                      new Date(previousMessage._creationTime)
                    ) < TIME_THRESHOLD;

                  return (
                    <Message
                      key={message._id}
                      id={message._id}
                      memberId={message.memberId}
                      authorImage={message.user.image}
                      authorName={message.user.name}
                      isAuthor={message.memberId === currentMember?._id}
                      reactions={message.reactions}
                      body={message.body}
                      image={message.image}
                      updatedAt={message.updatedAt}
                      createdAt={message._creationTime}
                      isEditing={editingId === message._id}
                      setEditingId={setEditingId}
                      isCompact={isCompact}
                      hideThreadButton
                      threadCount={message.threadCount}
                      threadImage={message.threadImage}
                      threadName={message.threadName}
                      threadTimestamp={message.threadTimeStamp}
                    />
                  );
                })}
              </div>
            ))}
            <div
              className="h-1"
              ref={(el) => {
                if (el) {
                  const observer = new IntersectionObserver(
                    ([etrine]) => {
                      if (etrine.isIntersecting && canLoadMore) {
                        loadMore();
                      }
                    },
                    { threshold: 1.0 }
                  );

                  observer.observe(el);

                  return () => observer.disconnect();
                }
              }}
            />
            {isLoadingMore && dividerMarkup(true)}
            <Message
              hideThreadButton
              memberId={message.memberId}
              authorImage={message.user.image}
              authorName={message.user.name}
              isAuthor={message.memberId === currentMember?._id}
              body={message.body}
              image={message.image}
              createdAt={message._creationTime}
              updatedAt={message.updatedAt}
              id={message._id}
              reactions={message.reactions}
              isEditing={editingId === message._id}
              setEditingId={setEditingId}
            />
          </>
        )}
      </div>
      {!loadingMessage && message && (
        <div className="px-4">
          <Editor
            key={editorKey}
            onSubmit={handleSubmit}
            innerRef={editorRef}
            disabled={isPending}
            placeholder="Reply to this message..."
          />
        </div>
      )}
    </div>
  );
};
