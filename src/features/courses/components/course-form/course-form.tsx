"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Save, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useRouter } from "@/i18n/navigation";

import {
  courseFormSchema,
  type CourseFormValues,
} from "@/validations/course-schema";
import { makeDefaultCourseValues } from "@/validations/course-defaults";
import { dal } from "@/lib/dal";
import { cn } from "@/lib/utils";
import type { CategoryLookup, InstructorLookup, LookupItem } from "@/types";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Stepper, type Step } from "./stepper";
import { toCoursePayload } from "../../lib/to-course-payload";
import { BasicInfoStep } from "./steps/basic-info-step";
import { StructureStep } from "./steps/structure-step";
import { MediaReviewsStep } from "./steps/media-reviews-step";
import { InstructorProfileSection } from "./instructor-profile-section";
import { FormTips } from "./form-tips";

interface CourseFormProps {
  categories: CategoryLookup[];
  instructors: InstructorLookup[];
  tags: LookupItem[];
  /** Program-type select options sourced from live course variables. */
  programTypes?: { value: string; label: string }[];
  /** When editing, the existing course id and prefilled values. */
  courseId?: string;
  initial?: Partial<CourseFormValues>;
}

export function CourseForm({
  categories,
  instructors,
  tags,
  programTypes,
  courseId,
  initial,
}: CourseFormProps) {
  const router = useRouter();
  const t = useTranslations("CourseForm");
  const tc = useTranslations("Common");
  const [step, setStep] = React.useState(0);
  const isEdit = Boolean(courseId);

  const STEPS: Step[] = [
    { title: t("stepBasicTitle"), description: t("stepBasicDesc") },
    { title: t("stepStructureTitle"), description: t("stepStructureDesc") },
    { title: t("stepMediaTitle"), description: t("stepMediaShortDesc") },
  ];

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema) as Resolver<CourseFormValues>,
    defaultValues: { ...makeDefaultCourseValues(), ...initial },
    mode: "onTouched",
  });

  const goNext = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const submit = (status: "draft" | "published") =>
    form.handleSubmit(
      async (values) => {
        if (isEdit && courseId) {
          const res = await dal.courses.updateCourseForm(
            courseId,
            toCoursePayload({ ...values, status }),
          );
          if (res.ok) {
            toast.success(
              status === "published"
                ? t("published", { title: values.titleEn })
                : t("draftSaved", { title: values.titleEn }),
            );
            router.push("/admin/courses");
          } else {
            toast.error(res.error);
          }
          return;
        }

        const payload = toCoursePayload({ ...values, status });
        const res = await dal.courses.createCourse(payload);
        if (res.ok) {
          toast.success(
            status === "published"
              ? t("published", { title: res.data.titleEn })
              : t("draftSaved", { title: res.data.titleEn }),
          );
          router.push("/admin/courses");
        } else {
          toast.error(res.error);
        }
      },
    )();

  const isLast = step === STEPS.length - 1;
  const submitting = form.formState.isSubmitting;
  const twoColumn = step === 0;

  const nextLabel =
    step === 0
      ? t("nextStructure")
      : step === 1
        ? t("nextMedia")
        : tc("continue");

  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <div className="rounded-xl border bg-card p-5">
          <Stepper steps={STEPS} current={step} onStepClick={setStep} />
        </div>

        <div
          className={cn(
            "grid gap-6 lg:items-start",
            twoColumn ? "lg:grid-cols-[2fr_1fr]" : "grid-cols-1",
          )}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`main-${step}`}
              className="min-w-0 space-y-6"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <BasicInfoStep
                  column="main"
                  categories={categories}
                  instructors={instructors}
                  tags={tags}
                  programTypes={programTypes}
                />
              )}
              {step === 1 && <StructureStep column="main" />}
              {step === 2 && (
                <>
                  <MediaReviewsStep column="main" />
                  {/* Who teaches this — sits with the other credibility content. */}
                  <InstructorProfileSection />
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {twoColumn && (
            <aside className="min-w-0 space-y-6 lg:sticky lg:top-24">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`sidebar-${step}`}
                  className="space-y-6"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.2 }}
                >
                  <BasicInfoStep
                    column="sidebar"
                    categories={categories}
                    instructors={instructors}
                    tags={tags}
                  />
                </motion.div>
              </AnimatePresence>
            </aside>
          )}
        </div>

        <FormTips />

        <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card/90 p-3 shadow-lg backdrop-blur">
          <Button
            type="button"
            variant="ghost"
            onClick={goBack}
            disabled={step === 0 || submitting}
            className="gap-1.5"
          >
            <ArrowLeft className="size-4 rtl:rotate-180" />
            {tc("back")}
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => submit("draft")}
              disabled={submitting}
              className="gap-1.5"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {t("saveDraft")}
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/admin/courses")}
              disabled={submitting}
            >
              {tc("cancel")}
            </Button>

            {isLast ? (
              <Button
                type="button"
                onClick={() => submit("published")}
                disabled={submitting}
                className="gap-1.5"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
                {t("publishCourse")}
              </Button>
            ) : (
              <Button type="button" onClick={goNext} className="gap-1.5">
                {nextLabel}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </Form>
  );
}
