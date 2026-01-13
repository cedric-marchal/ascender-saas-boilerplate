"use client";

import { useCallback, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";

import { useRouter } from "next/navigation";

import { Loader2, Upload, User, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type AvatarFormProps = {
  user: {
    name: string;
    image: string | null;
  };
  avatarUrl: string | null;
};

const MAX_FILE_SIZE = Number(
  process.env.NEXT_PUBLIC_VERCEL_MAX_UPLOAD_SIZE ?? 4718592
);
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function AvatarForm({ user, avatarUrl }: AvatarFormProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Format accepté : JPEG, PNG, WebP, GIF";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "L'image ne doit pas dépasser 4.5MB";
    }

    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);

      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);
      setIsLoading(true);
      setPreview(URL.createObjectURL(file));

      const formData = new FormData();
      formData.append("image", file);

      try {
        const response = await fetch("/api/user/avatar", {
          method: "PATCH",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.message ?? "Une erreur est survenue");
          setPreview(null);
          setIsLoading(false);
          return;
        }

        router.refresh();
      } catch (error: unknown) {
        setError("Une erreur est survenue");
        setPreview(null);
      } finally {
        setIsLoading(false);
      }
    },
    [router, validateFile]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      const file = event.dataTransfer.files[0];

      if (file) {
        uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (file) {
        uploadFile(file);
      }

      event.target.value = "";
    },
    [uploadFile]
  );

  async function handleDelete() {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/user/avatar", {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message ?? "Une erreur est survenue");
        setIsDeleting(false);
        return;
      }

      setPreview(null);
      router.refresh();
    } catch (error: unknown) {
      setError("Une erreur est survenue");
    } finally {
      setIsDeleting(false);
    }
  }

  const displayImage = preview ?? avatarUrl;
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo de profil</CardTitle>
        <CardDescription>JPEG, PNG, WebP ou GIF. 4.5MB max.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-destructive/10 text-destructive rounded-md p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={displayImage ?? undefined} alt={user.name} />
            <AvatarFallback className="text-lg">
              {initials || <User className="h-8 w-8" />}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col gap-2">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="absolute inset-0 cursor-pointer opacity-0"
                disabled={isLoading}
              />
              {isLoading ? (
                <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
              ) : (
                <>
                  <Upload className="text-muted-foreground h-8 w-8" />
                  <span className="text-muted-foreground mt-2 text-sm">
                    Glissez une image ou cliquez
                  </span>
                </>
              )}
            </div>

            {displayImage && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export { AvatarForm };
