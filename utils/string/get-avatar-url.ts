import { env } from "@/lib/env";

function getAvatarUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${env.NEXT_PUBLIC_R2_PUBLIC_URL}/${image}`;
}

export { getAvatarUrl };
