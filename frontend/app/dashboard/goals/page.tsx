"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { describeFetchFailure } from "@/lib/api";
import {
  createGoal,
  deleteGoal,
  explainGoalStatus,
  fetchGoalsForPeriod,
  formatGoalProgress,
  goalCategoryLabel,
  goalProgressRatio,
  type Goal,
  type GoalCategory,
  type GoalPeriod,
  type GoalUnit
} from "@/lib/goals";
import { resolveDreamFromPreferences } from "@/lib/dream";
import { CurrentDreamStrip } from "@/components/dream/CurrentDreamStrip";
import { getLocalMonthRangeIso, getLocalWeekRangeIso } from "@/lib/datetime";
import { CalmEmptyState } from "@/components/ui/CalmEmptyState";
import { ui } from "@/lib/ui";
import { ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { PageSectionSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useSelectStringHandler
} from "@/components/ui/select";
import { WhyMuted } from "@/components/explainability/WhyLine";
import { useTranslations } from "@/lib/i18n";
import { getResolvedUserPreferences } from "@/services/preferences";
import { toast } from "sonner";

type ProductivityTrack = "tasks" | "minutes";

function defaultUnitForCategory(cat: GoalCategory, track: ProductivityTrack): GoalUnit {
  if (cat === "finance") return "eur";
  if (cat === "home") return "percent";
  return track === "minutes" ? "minutes" : "tasks";
}

function defaultTargetFor(category: GoalCategory, track: ProductivityTrack): string {
  if (category === "finance") return "300";
  if (category === "home") return "80";
  if (track === "minutes") return "300";
  return "12";
}

function titlePlaceholderKey(category: GoalCategory): string {
  if (category === "finance") return "titlePlaceholderFinance";
  if (category === "home") return "titlePlaceholderHome";
  if (category === "productivity") return "titlePlaceholderWork";
  return "titlePlaceholder";
}

function aimHintKey(category: GoalCategory, track: ProductivityTrack): string {
  if (category === "finance") return "aimFinanceHint";
  if (category === "home") return "aimHomeHint";
  if (track === "minutes") return "aimFocusHint";
  return "aimTasksHint";
}

function aimLabelKey(category: GoalCategory, track: ProductivityTrack): string {
  if (category === "finance") return "aimLabelFinance";
  if (category === "home") return "aimLabelHome";
  if (track === "minutes") return "aimLabelFocus";
  return "aimLabelTasks";
}

function aimPlaceholderKey(category: GoalCategory, track: ProductivityTrack): string {
  if (category === "finance") return "aimPlaceholderFinance";
  if (category === "home") return "aimPlaceholderHome";
  if (track === "minutes") return "aimPlaceholderFocus";
  return "aimPlaceholderTasks";
}

function statusLabel(s: Goal["status"], t: (key: string) => string): string {
  if (s === "completed") return t("statusCompleted");
  if (s === "at_risk") return t("statusAtRisk");
  return t("statusOnTrack");
}

function statusClass(s: Goal["status"]): string {
  if (s === "completed") return "text-lifeos-success";
  if (s === "at_risk") return "text-lifeos-danger";
  return "text-lifeos-warning";
}

export default function DashboardGoalsPage() {
  const { t } = useTranslations("dashboard.goals");
  const [goals, setGoals] = useState<Goal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentDream = useMemo(() => resolveDreamFromPreferences(getResolvedUserPreferences()), []);

  const monthRange = useMemo(() => getLocalMonthRangeIso(new Date()), []);
  const weekRange = useMemo(() => getLocalWeekRangeIso(new Date()), []);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const [monthly, weekly] = await Promise.all([
        fetchGoalsForPeriod("monthly", monthRange.from, monthRange.to),
        fetchGoalsForPeriod("weekly", weekRange.from, weekRange.to)
      ]);
      setGoals([...monthly, ...weekly]);
    } catch (e: unknown) {
      setError(describeFetchFailure(e));
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [monthRange.from, monthRange.to, weekRange.from, weekRange.to]);

  useEffect(() => {
    void load();
  }, [load]);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<GoalCategory>("productivity");
  const [productivityTrack, setProductivityTrack] = useState<ProductivityTrack>("tasks");
  const [targetValue, setTargetValue] = useState("12");
  const [period, setPeriod] = useState<GoalPeriod>("monthly");
  const onCategoryChange = useSelectStringHandler((v) => setCategory(v as GoalCategory));
  const onTrackChange = useSelectStringHandler((v) => setProductivityTrack(v as ProductivityTrack));
  const onPeriodChange = useSelectStringHandler((v) => setPeriod(v as GoalPeriod));

  const unit = useMemo(
    () => defaultUnitForCategory(category, productivityTrack),
    [category, productivityTrack]
  );

  useEffect(() => {
    setTargetValue(defaultTargetFor(category, productivityTrack));
  }, [category, productivityTrack]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const target = parseFloat(targetValue);
    if (!title.trim()) {
      toast.error(t("enterTitle"));
      return;
    }
    if (Number.isNaN(target) || target <= 0) {
      toast.error(t("targetPositive"));
      return;
    }
    const range = period === "monthly" ? monthRange : weekRange;
    setSaving(true);
    setError(null);
    try {
      await createGoal(
        { title: title.trim(), category, targetValue: target, unit, period },
        range.from,
        range.to
      );
      setTitle("");
      setTargetValue(defaultTargetFor(category, productivityTrack));
      await load();
    } catch (err: unknown) {
      setError(describeFetchFailure(err));
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    try {
      await deleteGoal(id);
      await load();
    } catch (err: unknown) {
      setError(describeFetchFailure(err));
    }
  }

  const monthlyGoals = goals.filter((g) => g.period === "monthly");
  const weeklyGoals = goals.filter((g) => g.period === "weekly");

  return (
    <div className={ui.contentClass}>
      <section className={ui.panelClass}>
        <h1 className="text-lifeos-display font-bold tracking-tight text-lifeos-fg">{t("pageTitle")}</h1>
        <p className={cn(ui.pageHint, "mt-ds-2")}>{t("pageDescription")}</p>

        {currentDream.isSet ? (
          <div className="mt-ds-4 max-w-xl space-y-ds-2">
            <p className={`text-sm ${ui.mutedText}`}>{t("dreamHintWarm")}</p>
            <CurrentDreamStrip dream={currentDream} showEdit />
          </div>
        ) : (
          <p className={`mt-ds-3 max-w-xl text-sm leading-snug ${ui.mutedText}`}>
            {t("dreamHint")}{" "}
            <Link href="/settings" className="text-lifeos-accent underline-offset-2 hover:underline">
              {t("settingsLink")}
            </Link>
          </p>
        )}

        {error && <p className="mt-3 text-sm text-lifeos-danger">{error}</p>}

        <form onSubmit={onCreate} className={cn(ds.card.secondary, "mt-ds-4 px-ds-5 py-ds-4 md:px-ds-5 md:py-ds-4")}>
          <h2 className="text-lifeos-card-title font-semibold tracking-tight text-lifeos-accent">{t("newGoal")}</h2>
          <div className={cn("mt-ds-3", ui.formGrid, "lg:grid-cols-2")}>
            <FormField id="goal-title" label={t("goalName")} className="lg:col-span-2">
              <Input
                id="goal-title"
                value={title}
                onChange={(ev) => setTitle(ev.target.value)}
                placeholder={t(titlePlaceholderKey(category))}
                autoComplete="off"
                required
              />
            </FormField>

            <FormField id="goal-category" label={t("whatToTrack")}>
              <Select
                value={category}
                onValueChange={onCategoryChange}
                items={{
                  productivity: t("categoryWork"),
                  finance: t("categoryFinance"),
                  home: t("categoryHome")
                }}
              >
                <SelectTrigger id="goal-category" className="w-full">
                  <SelectValue placeholder={t("whatToTrack")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="productivity">{t("categoryWork")}</SelectItem>
                  <SelectItem value="finance">{t("categoryFinance")}</SelectItem>
                  <SelectItem value="home">{t("categoryHome")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {category === "productivity" ? (
              <FormField id="goal-track" label={t("trackAs")}>
                <Select
                  value={productivityTrack}
                  onValueChange={onTrackChange}
                  items={{ tasks: t("trackTasks"), minutes: t("trackFocus") }}
                >
                  <SelectTrigger id="goal-track" className="w-full">
                    <SelectValue placeholder={t("trackAs")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tasks">{t("trackTasks")}</SelectItem>
                    <SelectItem value="minutes">{t("trackFocus")}</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            ) : null}

            <FormField
              id="goal-target"
              label={t(aimLabelKey(category, productivityTrack))}
              hint={t(aimHintKey(category, productivityTrack))}
            >
              <Input
                id="goal-target"
                type="number"
                min={0.01}
                step={category === "home" ? 1 : 0.01}
                className="tabular-nums"
                value={targetValue}
                onChange={(ev) => setTargetValue(ev.target.value)}
                placeholder={t(aimPlaceholderKey(category, productivityTrack))}
                required
              />
            </FormField>

            <FormField id="goal-period" label={t("timeFrame")}>
              <Select
                value={period}
                onValueChange={onPeriodChange}
                items={{ weekly: t("periodWeekly"), monthly: t("periodMonthly") }}
              >
                <SelectTrigger id="goal-period" className="w-full">
                  <SelectValue placeholder={t("timeFrame")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{t("periodWeekly")}</SelectItem>
                  <SelectItem value="monthly">{t("periodMonthly")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
          <Button type="submit" variant="primary" size="md" disabled={saving} className="mt-ds-3">
            {saving ? t("saving") : t("create")}
          </Button>
        </form>

        {loading && (
          <div className="mt-6">
            <PageSectionSkeleton />
          </div>
        )}

        {!loading && (
          <div className="mt-6 space-y-6">
            <GoalsSection label={t("monthlyGoals")} hint={t("monthlyHint")} items={monthlyGoals} onDelete={onDelete} t={t} />
            <GoalsSection label={t("weeklyGoals")} hint={t("weeklyHint")} items={weeklyGoals} onDelete={onDelete} t={t} />
          </div>
        )}
      </section>
    </div>
  );
}

function GoalsSection({
  label,
  hint,
  items,
  onDelete,
  t
}: {
  label: string;
  hint: string;
  items: Goal[];
  onDelete: (id: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-lg font-semibold text-lifeos-fg">{label}</h2>
        {items.length > 0 ? <p className={`text-sm ${ui.mutedText}`}>{hint}</p> : null}
      </div>
      {items.length === 0 ? (
        <CalmEmptyState
          tone="goals"
          size="inline"
          className="mt-3"
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {items.map((g) => {
            const ratio = goalProgressRatio(g);
            const pct = Math.round(ratio * 100);
            return (
              <li key={g.id}>
                <Card className={cn(ui.card, "bg-lifeos-muted/25 p-4")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-lifeos-caption font-medium text-lifeos-fg-muted">
                        {goalCategoryLabel(g.category, t)}
                      </p>
                      <p className="mt-1 text-lg font-medium text-lifeos-fg">{g.title}</p>
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="shrink-0"
                      onClick={() => void onDelete(g.id)}
                    >
                      {t("remove")}
                    </Button>
                  </div>
                  <p className="mt-2 text-sm font-medium leading-snug text-lifeos-fg">{formatGoalProgress(g, t)}</p>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-lifeos-muted">
                    <div
                      className="h-full rounded-full bg-lifeos-accent transition-[width] duration-300"
                      style={{ width: `${pct}%` }}
                      aria-hidden
                    />
                  </div>
                  <p className={`mt-2 text-sm font-medium ${statusClass(g.status)}`}>{statusLabel(g.status, t)}</p>
                  <WhyMuted text={explainGoalStatus(g, t)} prefix={false} />
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
