"use client";

import {
  type ChangeEvent,
  type DragEvent,
  type SubmitEvent,
  useState,
} from "react";

import Image from "next/image";
import { useRouter } from "next/navigation";

import { useForm } from "@tanstack/react-form";
import { Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { UpdateAvatarSchema } from "@/lib/schemas/avatar.schema";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

import { getInitials } from "@/utils/string/get-initials";

type AvatarFormProps = {
  name: string;
  image: string | null | undefined;
};

function AvatarForm({ name, image }: AvatarFormProps) {
  const router = useRouter();

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const initials = getInitials(name);

  function handleFileChange(file: File | null) {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }

  const form = useForm({
    defaultValues: {
      avatar: undefined as File | undefined,
    },
    validators: {
      onSubmit: UpdateAvatarSchema,
    },
    onSubmit: async ({ value }) => {
      if (!value.avatar) {
        return;
      }

      const formData = new FormData();
      formData.append("avatar", value.avatar);

      const response = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json();
        toast.error(body.message || "Une erreur est survenue");
        return;
      }

      toast.success("Avatar mis à jour avec succès");
      setPreviewUrl(null);
      form.reset();
      router.refresh();
    },
  });

  return (
    <form
      onSubmit={(event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      <div className="flex items-center gap-6">
        <Avatar className="h-20 w-20">
          <AvatarImage
            src={previewUrl || image || undefined}
            alt={name}
          />
          <AvatarFallback className="text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <p className="text-sm font-medium">Photo de profil</p>
          <p className="text-muted-foreground text-xs">
            JPG, PNG ou WebP. Max 5MB.
          </p>
        </div>
      </div>

      <form.Field
        name="avatar"
        children={(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid;

          function handleDragOver(event: DragEvent<HTMLDivElement>) {
            event.preventDefault();
            setIsDragging(true);
          }

          function handleDragLeave(event: DragEvent<HTMLDivElement>) {
            event.preventDefault();
            setIsDragging(false);
          }

          function handleDrop(event: DragEvent<HTMLDivElement>) {
            event.preventDefault();
            setIsDragging(false);

            const droppedFile = event.dataTransfer.files[0];
            if (droppedFile) {
              field.handleChange(droppedFile);
              handleFileChange(droppedFile);
            }
          }

          function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
            const selectedFile = event.target.files?.[0];
            if (selectedFile) {
              field.handleChange(selectedFile);
              handleFileChange(selectedFile);
            }
          }

          function handleRemoveFile() {
            field.handleChange(undefined);
            handleFileChange(null);
          }

          const value = field.state.value;

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor="settings-avatar-input">
                Changer l&apos;avatar
              </FieldLabel>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-muted-foreground/50",
                  value && "border-primary/50 bg-primary/5 border-solid"
                )}
              >
                {value ? (
                  <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-3">
                      {previewUrl && (
                        <div className="relative h-12 w-12 overflow-hidden rounded-md">
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium">{value.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {(value.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveFile}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                      <span className="sr-only">Supprimer le fichier</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload
                      className="text-muted-foreground mb-2 h-8 w-8"
                      aria-hidden="true"
                    />
                    <p className="text-muted-foreground text-sm">
                      Glissez-déposez une image ou{" "}
                      <label className="text-primary cursor-pointer font-medium hover:underline">
                        parcourir
                        <input
                          id="settings-avatar-input"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                      </label>
                    </p>
                  </>
                )}
              </div>
              <p className="text-muted-foreground mt-2 text-xs">
                JPG, PNG ou WebP. Maximum 5 MB.
              </p>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />

      <form.Subscribe
        selector={(state) => [state.canSubmit, state.isSubmitting]}
      >
        {([canSubmit, isSubmitting]) => {
          const hasAvatar = !!form.getFieldValue("avatar");

          return (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting || !hasAvatar}
            >
              {isSubmitting ? (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {isSubmitting ? "Téléchargement..." : "Mettre à jour l'avatar"}
            </Button>
          );
        }}
      </form.Subscribe>
    </form>
  );
}

export { AvatarForm };
