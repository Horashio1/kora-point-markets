'use client'

import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, addHours, endOfDay, format } from "date-fns";
import { CalendarIcon, Clock, Minus, Plus, ShieldCheck, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useCategories } from "@/hooks/useCategories";
import { useCreateQuestion } from "@/hooks/useCreateQuestion";
import { cn } from "@/lib/utils";
import { URGENT_HOURS } from "@/lib/config";

/* ─────────────────────── responsive hook ───────────────────────── */

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    setIsDesktop(media.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

/* ─────────────────────────── schema ────────────────────────────── */

const formSchema = z.object({
  title: z.string()
    .trim()
    .min(10, "Question must be at least 10 characters")
    .max(200, "Must be under 200 characters"),
  description: z.string().trim().max(1000, "Keep it under 1000 characters").optional(),
  category_id: z.string().optional(),
  ends_at: z.date({ required_error: "Pick a closing time" }).refine(
    (d) => d > new Date(),
    { message: "Must be in the future" }
  ),
  ends_time: z.string().default("23:59"),
  question_type: z.enum(["binary", "multi"]),
  yes_percentage: z.number().min(1).max(99),
  options: z.array(z.object({
    name: z.string(),
    percentage: z.number().min(0).max(100),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.question_type === "multi") {
    const valid = data.options?.filter((o) => o.name?.trim() !== "") ?? [];
    if (valid.length < 2) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Add at least 2 options", path: ["options"] });
    }
  }
});

type FormData = z.infer<typeof formSchema>;

/* ─────────────────────── close presets ─────────────────────────── */

type ClosePreset = "3h" | "6h" | "eod" | "custom";

const CLOSE_PRESETS: { id: ClosePreset; label: string }[] = [
  { id: "3h",     label: "3 hrs"      },
  { id: "6h",     label: "6 hrs"      },
  { id: "eod",    label: "End of day" },
  { id: "custom", label: "Custom"     },
];

/* ─────────── inner fields component (no Form/form wrapper) ─────── */

function BetFields({
  form,
  closePreset,
  applyClosePreset,
  isPickedTimeUrgent,
  categories,
}: {
  form: UseFormReturn<FormData>;
  closePreset: ClosePreset;
  applyClosePreset: (p: ClosePreset) => void;
  isPickedTimeUrgent: boolean;
  categories: { id: number; name: string; icon: string }[];
}) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "options" });
  const questionType = form.watch("question_type");
  const titleValue   = form.watch("title") ?? "";

  return (
    <div className="space-y-5">

      {/* 1. The question */}
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55 mb-2">
              What&apos;s the question?
            </div>
            <FormControl>
              <div className="relative">
                <Textarea
                  placeholder={
                    questionType === "binary"
                      ? "Will this happen before the end of the year?"
                      : "Who will win the match this weekend?"
                  }
                  rows={2}
                  {...field}
                  className="resize-none border-border/70 bg-background/50 py-3 pr-14 text-[15px] leading-snug text-foreground placeholder:text-muted-foreground/30 transition-all hover:border-border focus:border-[hsl(var(--neon-blue)/0.55)] focus:ring-0 focus:shadow-[0_0_0_3px_hsl(var(--neon-blue)/0.08)]"
                />
                <span className={cn(
                  "pointer-events-none absolute bottom-2.5 right-3 text-[10px] tabular-nums",
                  titleValue.length > 180 ? "text-destructive" : "text-muted-foreground/30"
                )}>
                  {titleValue.length}/200
                </span>
              </div>
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* 2. Answer type */}
      <FormField
        control={form.control}
        name="question_type"
        render={({ field }) => (
          <FormItem>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55 mb-2">
              How do people answer?
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "binary", label: "YES / NO",   sub: "It happens or it doesn't" },
                { value: "multi",  label: "Pick one",   sub: "Choose from a list"        },
              ].map(({ value, label, sub }) => {
                const active = field.value === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => field.onChange(value)}
                    className={cn(
                      "relative rounded-xl border px-4 py-4 text-left transition-all duration-200 outline-none",
                      active
                        ? "border-[hsl(var(--neon-blue)/0.5)] bg-[hsl(var(--neon-blue)/0.1)]"
                        : "border-border bg-background/40 hover:border-[hsl(var(--neon-blue)/0.3)] hover:bg-[hsl(var(--neon-blue)/0.05)]"
                    )}
                    style={active ? {
                      boxShadow: "0 0 36px -12px hsl(var(--neon-blue)/0.5), inset 0 0 0 1px hsl(var(--neon-blue)/0.12)"
                    } : undefined}
                  >
                    <div className={cn("font-display text-base font-bold tracking-tight",
                      active ? "text-[hsl(var(--neon-blue))]" : "text-foreground")}>
                      {label}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground/60">{sub}</div>
                  </button>
                );
              })}
            </div>
          </FormItem>
        )}
      />

      {/* 3a. Options (multi only) */}
      {questionType === "multi" && (
        <div className="rounded-xl border border-border bg-background/40 p-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55 mb-3">
            The options
          </div>
          {fields.map((fieldItem, index) => (
            <div key={fieldItem.id} className="flex items-center gap-2">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-border/50 font-mono text-[10px] font-bold text-muted-foreground/50">
                {index + 1}
              </span>
              <Input
                placeholder={`Option ${index + 1}`}
                {...form.register(`options.${index}.name`)}
                className="h-9 border-border/60 bg-background/60 text-sm text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-[hsl(var(--neon-blue)/0.3)] focus-visible:border-[hsl(var(--neon-blue)/0.5)]"
              />
              {fields.length > 2 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground/30 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
          {form.formState.errors.options?.message && (
            <p className="text-xs text-destructive pt-1">{String(form.formState.errors.options.message)}</p>
          )}
          {fields.length < 10 && (
            <button
              type="button"
              onClick={() => append({ name: "", percentage: 0 })}
              className="mt-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground/45 transition-colors hover:text-[hsl(var(--neon-blue))]"
            >
              <Plus className="h-3.5 w-3.5" />
              Add option
            </button>
          )}
        </div>
      )}

      {/* 3b. Starting odds (binary only) */}
      {questionType === "binary" && (
        <FormField
          control={form.control}
          name="yes_percentage"
          render={({ field }) => (
            <FormItem>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55 mb-2">
                Where do you think this lands?
              </div>
              <FormControl>
                <div className="space-y-3">
                  <div className="relative h-14 overflow-hidden rounded-xl">
                    <div
                      className="absolute inset-y-0 left-0 flex flex-col items-center justify-center transition-all duration-300"
                      style={{
                        width: `${field.value}%`,
                        background: "linear-gradient(135deg, hsl(var(--neon-blue)/0.85), hsl(var(--neon-indigo)/0.75))",
                      }}
                    >
                      {field.value > 13 && (
                        <>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/60">YES</span>
                          <span className="font-display text-lg font-bold leading-tight text-white">{field.value}%</span>
                        </>
                      )}
                    </div>
                    <div
                      className="absolute inset-y-0 right-0 flex flex-col items-center justify-center transition-all duration-300"
                      style={{
                        width: `${100 - field.value}%`,
                        background: "linear-gradient(135deg, hsl(var(--neon-indigo)/0.65), hsl(var(--neon-purple)/0.85))",
                      }}
                    >
                      {(100 - field.value) > 13 && (
                        <>
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-white/60">NO</span>
                          <span className="font-display text-lg font-bold leading-tight text-white">{100 - field.value}%</span>
                        </>
                      )}
                    </div>
                    <div
                      className="pointer-events-none absolute inset-y-0 z-10 w-px bg-black/30 transition-all duration-300"
                      style={{ left: `${field.value}%` }}
                    />
                  </div>
                  <Slider
                    min={1} max={99} step={1}
                    value={[field.value]}
                    onValueChange={(v) => field.onChange(v[0])}
                    className="py-0.5"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground/30">
                    <span>Very unlikely</span>
                    <span>Very likely</span>
                  </div>
                </div>
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
      )}

      {/* 4. When does it close? */}
      <FormField
        control={form.control}
        name="ends_at"
        render={({ field }) => (
          <FormItem>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55 mb-2">
              When does betting close?
            </div>

            <div className="flex gap-2 flex-wrap">
              {CLOSE_PRESETS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => applyClosePreset(id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-150 outline-none",
                    closePreset === id
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-transparent text-muted-foreground hover:border-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {closePreset === "custom" && (
              <div className="flex gap-2 mt-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "min-w-0 flex-1 border-border/70 bg-background/50 pl-3 text-left font-normal transition-all hover:border-border",
                          !field.value ? "text-muted-foreground/35" : "text-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "MMM d, yyyy") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 flex-shrink-0 opacity-35" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-border bg-card p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <input
                  type="time"
                  {...form.register("ends_time")}
                  className="w-[88px] flex-shrink-0 rounded-md border border-border/70 bg-background/50 px-2 text-sm text-foreground transition-all hover:border-border focus:border-[hsl(var(--neon-blue)/0.55)] focus:outline-none [color-scheme:dark]"
                />
              </div>
            )}

            {closePreset !== "custom" && field.value && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>Closes {format(field.value, "MMM d 'at' h:mm a")}</span>
              </div>
            )}

            {isPickedTimeUrgent && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-amber-400/80">
                <Zap className="h-3 w-3 flex-shrink-0" />
                <span>Shows as &quot;closing soon&quot; to everyone</span>
              </div>
            )}

            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* 5. Category (optional) */}
      <FormField
        control={form.control}
        name="category_id"
        render={({ field }) => (
          <FormItem>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55 mb-2">
              Category{" "}
              <span className="normal-case font-normal text-muted-foreground/35">(optional)</span>
            </div>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger className="border-border/70 bg-background/50 text-foreground transition-all hover:border-border data-[placeholder]:text-muted-foreground/35">
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent className="border-border bg-card">
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id.toString()}
                    className="text-foreground focus:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />

      {/* 6. Extra details (optional) */}
      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/55 mb-2">
              More details{" "}
              <span className="normal-case font-normal text-muted-foreground/35">(optional)</span>
            </div>
            <FormControl>
              <Textarea
                placeholder="What counts as a win? Link a source, explain edge cases, keep it clear."
                rows={2}
                className="resize-none border-border/70 bg-background/50 text-foreground placeholder:text-muted-foreground/30 transition-all hover:border-border focus:border-[hsl(var(--neon-blue)/0.55)] focus:ring-0"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )}
      />

      {/* Review notice */}
      <div className="flex items-start gap-3 rounded-xl border border-border/30 bg-background/10 px-4 py-3">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground/30" />
        <p className="text-xs leading-relaxed text-muted-foreground/50">
          Your bet is{" "}
          <span className="font-semibold text-foreground/60">reviewed before going live</span>
          {" "}— usually within minutes.
        </p>
      </div>

    </div>
  );
}

/* ─────────────────────────── main component ────────────────────── */

export function CreateQuestionModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const isDesktop = useIsDesktop();
  const { data: categories = [] } = useCategories();
  const createQuestion = useCreateQuestion();
  const [closePreset, setClosePreset] = useState<ClosePreset>("custom");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: undefined,
      ends_at: addDays(new Date(), 7),
      ends_time: "23:59",
      question_type: "binary",
      yes_percentage: 50,
      options: [{ name: "", percentage: 50 }, { name: "", percentage: 50 }],
    },
  });

  const endsAtDate = form.watch("ends_at");
  const endsTime   = form.watch("ends_time");

  const applyClosePreset = (preset: ClosePreset) => {
    setClosePreset(preset);
    if (preset === "3h") {
      const t = addHours(new Date(), 3);
      form.setValue("ends_at", t);
      form.setValue("ends_time", `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
    } else if (preset === "6h") {
      const t = addHours(new Date(), 6);
      form.setValue("ends_at", t);
      form.setValue("ends_time", `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`);
    } else if (preset === "eod") {
      form.setValue("ends_at", endOfDay(new Date()));
      form.setValue("ends_time", "23:59");
    }
  };

  const isPickedTimeUrgent = useMemo(() => {
    if (!endsAtDate) return false;
    const combined = new Date(endsAtDate);
    const [h, m] = (endsTime || "23:59").split(":").map(Number);
    combined.setHours(h, m, 0, 0);
    return (combined.getTime() - Date.now()) / 3_600_000 <= URGENT_HOURS && combined > new Date();
  }, [endsAtDate, endsTime]);

  const onSubmit = async (data: FormData) => {
    const [h, m] = (data.ends_time || "23:59").split(":").map(Number);
    const endsAt = new Date(data.ends_at);
    endsAt.setHours(h, m, 0, 0);

    let validOptions: { name: string; percentage: number }[] | undefined;
    if (data.question_type === "multi" && data.options) {
      const filtered = data.options.filter((o) => o.name?.trim() !== "");
      const pct = Math.round(100 / filtered.length);
      validOptions = filtered.map((o) => ({ name: o.name, percentage: pct }));
    }

    await createQuestion.mutateAsync({
      title: data.title,
      description: data.description,
      category_id: data.category_id ? parseInt(data.category_id, 10) : null,
      ends_at: endsAt.toISOString(),
      yes_percentage: data.yes_percentage,
      question_type: data.question_type,
      options: validOptions,
    });

    form.reset();
    setClosePreset("custom");
    onClose();
  };

  /* ── Shared: footer buttons ─────────────────────────────────────── */

  const FooterButtons = ({ formId }: { formId: string }) => (
    <div className="flex gap-3">
      <Button
        type="button"
        variant="outline"
        onClick={onClose}
        className="h-11 flex-1 rounded-xl border-border bg-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        Cancel
      </Button>
      <button
        type="submit"
        form={formId}
        disabled={createQuestion.isPending}
        className={cn(
          "h-11 flex-[2] rounded-xl text-sm font-semibold text-white transition-all duration-200",
          "disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        )}
        style={{
          background: "linear-gradient(135deg, hsl(var(--neon-blue)), hsl(var(--neon-indigo)), hsl(var(--neon-purple)))",
          boxShadow: "0 0 24px -8px hsl(var(--neon-blue)/0.5)",
        }}
      >
        {createQuestion.isPending ? (
          <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />Posting...</>
        ) : (
          <>Post Bet <span className="opacity-60">→</span></>
        )}
      </button>
    </div>
  );

  const fieldProps = { form, closePreset, applyClosePreset, isPickedTimeUrgent, categories };

  /* ── Mobile: bottom sheet ───────────────────────────────────────── */
  if (!isDesktop) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DrawerContent className="bg-card border-border flex flex-col max-h-[92dvh]">
          <DrawerTitle className="sr-only">Post a Bet</DrawerTitle>
          <DrawerDescription className="sr-only">Create a new prediction</DrawerDescription>

          <div className="flex-shrink-0 border-b border-border px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">New Bet</p>
            <div className="font-display text-2xl font-bold text-foreground">Post a Bet</div>
          </div>

          <div className="overflow-y-auto flex-1 px-5 py-5">
            <Form {...form}>
              <form id="create-bet-mobile" onSubmit={form.handleSubmit(onSubmit)}>
                <BetFields {...fieldProps} />
              </form>
            </Form>
          </div>

          <div className="flex-shrink-0 border-t border-border px-5 pb-8 pt-4">
            <FooterButtons formId="create-bet-mobile" />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  /* ── Desktop: centered dialog ───────────────────────────────────── */
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex flex-col max-h-[92vh] gap-0 overflow-hidden rounded-2xl border border-border bg-card p-0 sm:max-w-[520px] shadow-[0_40px_100px_rgba(0,0,0,0.8),0_0_80px_-30px_hsl(var(--neon-blue)/0.15)]">
        <DialogTitle className="sr-only">Post a Bet</DialogTitle>
        <DialogDescription className="sr-only">Create a new prediction</DialogDescription>

        <div className="flex-shrink-0 border-b border-border bg-accent px-6 py-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">New Bet</p>
          <div className="font-display text-2xl font-bold text-foreground">Post a Bet</div>
          <p className="mt-1 text-sm text-muted-foreground/60">Keep it clear — everyone should understand it instantly.</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          <Form {...form}>
            <form id="create-bet-desktop" onSubmit={form.handleSubmit(onSubmit)}>
              <BetFields {...fieldProps} />
            </form>
          </Form>
        </div>

        <div className="flex-shrink-0 border-t border-border px-6 pb-6 pt-4">
          <FooterButtons formId="create-bet-desktop" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
