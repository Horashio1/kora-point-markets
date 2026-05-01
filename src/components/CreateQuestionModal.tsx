'use client'

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addDays, format } from "date-fns";
import { CalendarIcon, HelpCircle, Minus, Plus, ShieldCheck, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories } from "@/hooks/useCategories";
import { useCreateQuestion } from "@/hooks/useCreateQuestion";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string()
    .trim()
    .min(10, "Question must be at least 10 characters")
    .max(200, "Question must be less than 200 characters"),
  description: z.string()
    .trim()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  category_id: z.string().optional(),
  ends_at: z.date({
    required_error: "Please select an end date",
  }).refine((date) => date > new Date(), {
    message: "End date must be in the future",
  }),
  question_type: z.enum(["binary", "multi"]),
  yes_percentage: z.number().min(1).max(99),
  options: z.array(z.object({
    name: z.string(),
    percentage: z.number().min(0).max(100),
  })).optional(),
}).superRefine((data, ctx) => {
  if (data.question_type === "multi") {
    const validOptions = data.options?.filter((opt) => opt.name && opt.name.trim() !== "") || [];
    if (validOptions.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least 2 options are required for multiple choice",
        path: ["options"],
      });
    }
  }
});

type FormData = z.infer<typeof formSchema>;

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateQuestionModal({ isOpen, onClose }: CreateQuestionModalProps) {
  const { data: categories = [] } = useCategories();
  const createQuestion = useCreateQuestion();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category_id: undefined,
      ends_at: addDays(new Date(), 7),
      question_type: "binary",
      yes_percentage: 50,
      options: [
        { name: "", percentage: 50 },
        { name: "", percentage: 50 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const questionType = form.watch("question_type");
  const yesPercentage = form.watch("yes_percentage");

  const onSubmit = async (data: FormData) => {
    const validOptions = data.question_type === "multi" && data.options
      ? data.options.filter((opt) => opt.name && opt.name.trim() !== "")
      : undefined;

    await createQuestion.mutateAsync({
      title: data.title,
      description: data.description,
      category_id: data.category_id ? parseInt(data.category_id, 10) : null,
      ends_at: data.ends_at.toISOString(),
      yes_percentage: data.yes_percentage,
      question_type: data.question_type,
      options: validOptions as { name: string; percentage: number }[] | undefined,
    });

    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-0 sm:max-w-[760px] shadow-[0_24px_80px_rgba(15,23,42,0.2)]">
        <div className="border-b border-slate-200 bg-slate-50 px-6 pb-6 pt-6">
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="flex items-center gap-3 text-2xl font-display font-bold">
              <div className="rounded-xl border border-slate-200 bg-white p-2">
                <Plus className="h-6 w-6 text-slate-900" />
              </div>
              Create Market
            </DialogTitle>
            <DialogDescription className="max-w-2xl text-sm text-slate-600">
              Build a clean event contract proposal. Like a Kalshi ticket, this should be crisp, specific, and easy to resolve.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Precision
              </div>
              <p className="text-sm text-slate-600">
                Phrase the market so the outcome can be judged without debate.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Liquidity
              </div>
              <p className="text-sm text-slate-600">
                Better markets are simple enough that lots of people want to take a side.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                Review
              </div>
              <p className="text-sm text-slate-600">
                Approved profiles review pending markets before they appear publicly.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <FormField
                  control={form.control}
                  name="question_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900">Market Type</FormLabel>
                      <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 rounded-2xl bg-white p-1 border border-slate-200">
                          <TabsTrigger value="binary" className="gap-2 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                            <span className="text-success">Yes</span>/<span className="text-destructive">No</span>
                          </TabsTrigger>
                          <TabsTrigger value="multi" className="gap-2 rounded-xl data-[state=active]:bg-slate-900 data-[state=active]:text-white">
                            Multiple Choice
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                      <FormDescription className="text-slate-500">
                        {field.value === "binary"
                          ? "Use a single question with YES and NO contracts."
                          : "Use a parent question with a set of candidate outcomes."}
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={questionType === "binary"
                            ? "Will Bitcoin reach $100k by end of 2025?"
                            : "What will be the top AI model this month?"}
                          {...field}
                          className="border-slate-300 bg-white py-6 text-lg text-slate-950 transition-all hover:border-slate-400 focus:border-slate-900 focus:ring-0"
                        />
                      </FormControl>
                      <FormDescription className="text-slate-500">
                        Example: "Will the Fed cut rates by September 2026?"
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description and Resolution Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add context, trusted sources, what counts as a win, and any important edge cases..."
                          className="min-h-[110px] resize-none border-slate-300 bg-white text-slate-950 transition-all hover:border-slate-400 focus:border-slate-900 focus:ring-0"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {questionType === "multi" && (
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div>
                    <Label className="text-slate-900">Options</Label>
                    <p className="mt-1 text-sm text-slate-500">
                      Keep options mutually exclusive and easy to scan.
                    </p>
                  </div>
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_88px_auto] gap-2">
                        <Input
                          placeholder={`Option ${index + 1}`}
                          {...form.register(`options.${index}.name`)}
                          className="border-slate-300 bg-white transition-all hover:border-slate-400 focus:border-slate-900 focus:ring-0"
                        />
                        <Input
                          type="number"
                          placeholder="%"
                          {...form.register(`options.${index}.percentage`, { valueAsNumber: true })}
                          className="border-slate-300 bg-white transition-all hover:border-slate-400 focus:border-slate-900 focus:ring-0"
                        />
                        {fields.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-slate-500 hover:text-destructive"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {form.formState.errors.options?.message ? (
                    <p className="text-sm font-medium text-destructive">
                      {String(form.formState.errors.options.message)}
                    </p>
                  ) : null}
                  {fields.length < 10 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ name: "", percentage: 0 })}
                      className="gap-1 rounded-xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                    >
                      <Plus className="h-4 w-4" />
                      Add Option
                    </Button>
                  )}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="border-slate-300 bg-white text-slate-950 transition-all hover:border-slate-400 focus:border-slate-900 focus:ring-0">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              <span className="flex items-center gap-2">
                                <span>{category.icon}</span>
                                <span>{category.name}</span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ends_at"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full border-slate-300 bg-white pl-3 text-left font-normal transition-all hover:border-slate-400 focus:border-slate-900 focus:ring-0",
                                !field.value && "text-slate-500",
                                field.value && "text-slate-950"
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        Choose a closing date that gives the market enough time to be fun.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {questionType === "binary" && (
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <FormField
                    control={form.control}
                    name="yes_percentage"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center gap-2">
                          <FormLabel>Starting Odds</FormLabel>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <HelpCircle className="h-4 w-4 cursor-help text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-[250px]">
                                <p>Set the opening crowd probability for "Yes". This shapes the first impression of the market.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        <FormControl>
                          <div className="space-y-4">
                            <Slider
                              min={1}
                              max={99}
                              step={1}
                              value={[field.value]}
                              onValueChange={(value) => field.onChange(value[0])}
                              className="py-2"
                            />
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Yes price</div>
                                <div className="mt-1 font-display text-2xl font-bold text-emerald-600">{yesPercentage}¢</div>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">No price</div>
                                <div className="mt-1 font-display text-2xl font-bold text-rose-600">{100 - yesPercentage}¢</div>
                              </div>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Every market now lands in <span className="font-semibold text-foreground">pending review</span> first. An approved profile can check it, approve it, and then it becomes visible to everyone as a live bet.
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="h-12 flex-1 rounded-2xl border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-12 flex-1 rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
                  disabled={createQuestion.isPending}
                >
                  {createQuestion.isPending ? "Submitting..." : "Submit Market"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
