import Quill, { type QuillOptions } from "quill";
import { RefObject } from "react";

interface EditorOptions {
  quillRef: RefObject<Quill | null>;
  placeholderRef: RefObject<string>;
  imageElementRef: RefObject<HTMLInputElement>;
  submitRef: RefObject<({ body, image }: { body: string; image: File | null }) => void>;
}

export const createEditorOptions = (
  { placeholderRef, imageElementRef, submitRef, quillRef }: EditorOptions
) => {
  const options: QuillOptions = {
    theme: "snow",
    placeholder: placeholderRef.current ?? "",
    modules: {
      toolbar: [
        ["bold", "italic", "underline", "strike"],
        ["link"],
        [{ list: "ordered" }, { list: "bullet" }],
      ],
      keyboard: {
        bindings: {
          enter: {
            key: "Enter",
            handler: () => {
              const text = quillRef?.current?.getText();
              const addedImage = imageElementRef.current?.files?.[0] || null;

              const isEmpty =
                !addedImage &&
                text?.replace(/<(.|\n)*?>/g, "").trim().length === 0;

              if (isEmpty) return;

              const body = JSON.stringify(quillRef?.current?.getContents());
              submitRef.current?.({
                body,
                image: addedImage,
              });

              return;
            },
          },
          shift_enter: {
            key: "Enter",
            shiftKey: true,
            handler: () => {
              quillRef?.current?.insertText(quillRef?.current?.getSelection()?.index || 0, "\n");
            },
          },
        },
      },
    },
  }

  return options;
}