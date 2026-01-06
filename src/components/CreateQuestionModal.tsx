import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { CalendarIcon, Plus, HelpCircle, X, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  question_type: z.enum(['binary', 'multi']),
  yes_percentage: z.number().min(1).max(99),
  options: z.array(z.object({
    name: z.string().min(1, "Option name required"),
    percentage: z.number().min(0).max(100),
  })).optional(),
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
      question_type: 'binary',
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
    const validOptions = data.question_type === 'multi' && data.options
      ? data.options.filter(opt => opt.name && opt.name.trim() !== '')
      : undefined;

    await createQuestion.mutateAsync({
      title: data.title,
      description: data.description,
      category_id: data.category_id ? parseInt(data.category_id) : null,
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
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Plus className="h-5 w-5 text-primary" />
            Create New Prediction
          </DialogTitle>
          <DialogDescription>
            Create a prediction market for others to bet on.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Question Type Tabs */}
            <FormField
              control={form.control}
              name="question_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer Type</FormLabel>
                  <Tabs value={field.value} onValueChange={field.onChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="binary" className="gap-2">
                        <span className="text-success">Yes</span>/<span className="text-destructive">No</span>
                      </TabsTrigger>
                      <TabsTrigger value="multi" className="gap-2">
                        Multiple Choice
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <FormDescription>
                    {field.value === 'binary' 
                      ? "Simple yes or no question" 
                      : "Multiple options, each with its own Yes/No betting"}
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Question Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={questionType === 'binary' 
                        ? "Will Bitcoin reach $100k by end of 2025?" 
                        : "What will be the top AI model this month?"}
                      {...field}
                      className="bg-secondary/50"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Multi-choice Options */}
            {questionType === 'multi' && (
              <div className="space-y-3">
                <Label>Options</Label>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        {...form.register(`options.${index}.name`)}
                        className="bg-secondary/50 flex-1"
                      />
                      <Input
                        type="number"
                        placeholder="%"
                        {...form.register(`options.${index}.percentage`, { valueAsNumber: true })}
                        className="bg-secondary/50 w-20"
                      />
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {fields.length < 10 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: "", percentage: 0 })}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                )}
              </div>
            )}

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add context, resolution criteria, or sources..."
                      className="bg-secondary/50 min-h-[80px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-secondary/50">
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

            {/* End Date */}
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
                            "w-full pl-3 text-left font-normal bg-secondary/50",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
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
                    When should this prediction resolve?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Initial Odds - Only for Binary */}
            {questionType === 'binary' && (
              <FormField
                control={form.control}
                name="yes_percentage"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>Initial Odds</FormLabel>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[250px]">
                            <p>Set the starting probability for "Yes". This affects the initial payout odds.</p>
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
                          onValueChange={(v) => field.onChange(v[0])}
                          className="py-2"
                        />
                        <div className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full bg-success" />
                            <span className="text-success font-medium">Yes: {yesPercentage}%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-destructive font-medium">No: {100 - yesPercentage}%</span>
                            <div className="h-3 w-3 rounded-full bg-destructive" />
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Button */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createQuestion.isPending}
              >
                {createQuestion.isPending ? "Creating..." : "Create Prediction"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}