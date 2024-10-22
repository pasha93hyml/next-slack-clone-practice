import Image from "next/image";
import { RefObject } from "react";

import { XIcon } from "lucide-react";

import { Hint } from "../hint";


interface UploadImageProps {
  image: File;
  setImage: (image: File | null) => void;
  imageElementRef: RefObject<HTMLInputElement>;
}

export const UploadedImage = ({
  image,
  setImage,
  imageElementRef,
}: UploadImageProps) => {
  return (
    <div className="p-2">
      <div className="relative size-[62px] flex items-center justify-center group/image">
        <Hint label="remove image">
          <button
            onClick={() => {
              setImage(null);
              imageElementRef.current!.value = "";
            }}
            className="hidden group-hover/image:flex rounded-full bg-black/70 hover:bg-black absolute -top-2.5 -right-2.5 text-white size-6 z-[4] border-2 border-white items-center justify-center"
          >
            <XIcon className="size-3.5" />
          </button>
        </Hint>
        <Image
          src={URL.createObjectURL(image)}
          alt="uploaded"
          fill
          className="rounded-xl overflow-hidden border object-cover"
        />
      </div>
    </div>
  );
};
