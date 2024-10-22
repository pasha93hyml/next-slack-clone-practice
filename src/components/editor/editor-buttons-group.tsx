import { RefObject } from "react";
import Quill from "quill";

import { MdSend } from "react-icons/md";
import { PiTextAa } from "react-icons/pi";
import { ImageIcon, Smile } from "lucide-react";

import { cn } from "@/lib/utils";

import { Hint } from "../hint";
import { Button } from "../ui/button";
import { EmojiPopover } from "../emoji-popover";

import { EditorValueType } from "./editor-value-type";

interface EditorButtonsGroupProps {
  image: File | null;
  variant: "create" | "update";
  disabled: boolean;
  isEmpty: boolean;
  isToolbarVisible: boolean;
  imageElementRef: RefObject<HTMLInputElement>;
  quillRef: RefObject<Quill | null>;
  toggleToolbar: () => void;
  onEmojiSelect: (emoji: string) => void;
  onCancel?: () => void;
  onSubmit: ({ image, body }: EditorValueType) => void;
}

export const EditorButtonsGroup = ({
  image,
  variant,
  disabled,
  isEmpty,
  isToolbarVisible,
  imageElementRef,
  quillRef,
  toggleToolbar,
  onEmojiSelect,
  onCancel,
  onSubmit,
}: EditorButtonsGroupProps) => {
  return (
    <div className="flex px-2 pb-2 z-[5]">
      <Hint label={isToolbarVisible ? "Hide formating" : "Show formatting"}>
        <Button
          disabled={disabled}
          size="iconSm"
          variant="ghost"
          onClick={toggleToolbar}
        >
          <PiTextAa className="size-4" />
        </Button>
      </Hint>
      <EmojiPopover onEmojiSelect={onEmojiSelect}>
        <Button disabled={disabled} size="iconSm" variant="ghost">
          <Smile className="size-4" />
        </Button>
      </EmojiPopover>
      {variant === "create" && (
        <Hint label="Image">
          <Button
            disabled={disabled}
            size="iconSm"
            variant="ghost"
            onClick={() => imageElementRef.current?.click()}
          >
            <ImageIcon className="size-4" />
          </Button>
        </Hint>
      )}
      {variant === "update" && (
        <div className="ml-auto flex items-center gap-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={disabled}
          >
            Cancel
          </Button>
          <Button
            disabled={disabled || isEmpty}
            onClick={() => {
              onSubmit({
                body: JSON.stringify(quillRef.current?.getContents()),
                image,
              });
            }}
            size="sm"
            className="bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
          >
            Save
          </Button>
        </div>
      )}
      {variant === "create" && (
        <Button
          disabled={disabled || isEmpty}
          onClick={() => {
            onSubmit({
              body: JSON.stringify(quillRef.current?.getContents()),
              image,
            });
          }}
          size="iconSm"
          className={cn(
            "ml-auto",
            isEmpty
              ? "bg-white hover:bg-white/80 text-muted-foreground"
              : "bg-[#007a5a] hover:bg-[#007a5a]/80 text-white"
          )}
        >
          <MdSend className="size-4" />
        </Button>
      )}
    </div>
  );
};
