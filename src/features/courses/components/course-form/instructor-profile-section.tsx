"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Plus, Trash2, AlertTriangle } from "lucide-react";

import type { CourseFormValues } from "@/validations/course-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/shared/image-upload";
import { FormSection } from "./form-section";

type Profile = CourseFormValues["instructorProfile"];
type ListField = "hospitals" | "certifications";

/**
 * Who teaches this programme.
 *
 * The public course page has rendered this block since it was built, and the
 * Course schema has stored it — but there was no way to enter it, so every
 * course shipped with an empty profile and no page attributed its content to a
 * named expert. On healthcare content that attribution is a genuine quality
 * signal, so this is the form that makes it possible.
 *
 * The credentials entered here are published as claims about a real person and
 * feed the `Person` structured data. Only enter what the instructor actually
 * holds.
 */
export function InstructorProfileSection() {
  const t = useTranslations("CourseForm");
  const { watch, setValue, formState } = useFormContext<CourseFormValues>();
  const profile = watch("instructorProfile");

  const set = (patch: Partial<Profile>) =>
    setValue("instructorProfile", { ...profile, ...patch }, { shouldDirty: true });

  const setItem = (field: ListField, index: number, value: string) => {
    const next = [...(profile?.[field] ?? [])];
    next[index] = value;
    set({ [field]: next } as Partial<Profile>);
  };
  const addItem = (field: ListField) =>
    set({ [field]: [...(profile?.[field] ?? []), ""] } as Partial<Profile>);
  const removeItem = (field: ListField, index: number) =>
    set({ [field]: (profile?.[field] ?? []).filter((_, i) => i !== index) } as Partial<Profile>);

  /* Mirrors the schema's refine, so the reason shows up next to the field. */
  const hasDetails =
    !!profile?.title ||
    !!profile?.bio ||
    Number(profile?.yearsExperience) > 0 ||
    !!profile?.hospitals?.length ||
    !!profile?.certifications?.length ||
    !!profile?.linkedIn;
  const nameMissing = hasDetails && !profile?.name?.trim();

  const list = (field: ListField, label: string, placeholder: string) => (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      <div className="space-y-2">
        {(profile?.[field] ?? []).map((value, i) => (
          <div key={i} className="flex gap-2">
            <Input
              value={value}
              placeholder={placeholder}
              onChange={(e) => setItem(field, i, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("remove")}
              onClick={() => removeItem(field, i)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => addItem(field)}>
          <Plus className="size-4" /> {t("add")}
        </Button>
      </div>
    </div>
  );

  return (
    <FormSection title={t("secInstructor")} description={t("secInstructorDesc")}>
      <div className="space-y-4">
        <p className="flex items-start gap-2 rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t("instructorIntegrityHint")}
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("instructorName")}</label>
            <Input
              value={profile?.name ?? ""}
              onChange={(e) => set({ name: e.target.value })}
              placeholder={t("instructorNamePlaceholder")}
              aria-invalid={nameMissing || undefined}
            />
            {nameMissing && (
              <p className="text-xs text-destructive">{t("instructorNameRequired")}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("instructorTitle")}</label>
            <Input
              value={profile?.title ?? ""}
              onChange={(e) => set({ title: e.target.value })}
              placeholder={t("instructorTitlePlaceholder")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("instructorYears")}</label>
            <Input
              type="number"
              min={0}
              max={70}
              value={profile?.yearsExperience || ""}
              onChange={(e) => set({ yearsExperience: Number(e.target.value) || 0 })}
              placeholder="—"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("instructorLinkedIn")}</label>
            <Input
              value={profile?.linkedIn ?? ""}
              onChange={(e) => set({ linkedIn: e.target.value })}
              placeholder="https://www.linkedin.com/in/…"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("instructorPhoto")}</label>
          <ImageUpload
            value={profile?.image ?? ""}
            onChange={(url) => set({ image: url })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("instructorBio")}</label>
          <Textarea
            rows={4}
            value={profile?.bio ?? ""}
            onChange={(e) => set({ bio: e.target.value })}
            placeholder={t("instructorBioPlaceholder")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {list("certifications", t("instructorCertifications"), "CPHQ, CIC, MD…")}
          {list("hospitals", t("instructorHospitals"), t("instructorHospitalsPlaceholder"))}
        </div>

        {formState.errors.instructorProfile?.name?.message && (
          <p className="text-xs text-destructive">
            {formState.errors.instructorProfile.name.message}
          </p>
        )}
      </div>
    </FormSection>
  );
}
