import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ds } from "@/styles/design-system";

type WithAs<E extends ElementType> = {
  as?: E;
  className?: string;
  children?: ReactNode;
};

/** Polymorphic typography — `as` changes the rendered element and its allowed props. */
type TypographyPolymorphicProps<T extends ElementType> = {
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

export function PageTitle({
  as,
  className,
  children,
  ...rest
}: WithAs<"h1"> & ComponentPropsWithoutRef<"h1">) {
  const Tag = (as ?? "h1") as ElementType;
  return (
    <Tag className={cn(ds.typography.pageTitle, className)} {...rest}>
      {children}
    </Tag>
  );
}

export function SectionTitle({
  as,
  className,
  children,
  ...rest
}: WithAs<"h2"> & ComponentPropsWithoutRef<"h2">) {
  const Tag = (as ?? "h2") as ElementType;
  return (
    <Tag className={cn(ds.typography.sectionTitle, className)} {...rest}>
      {children}
    </Tag>
  );
}

export function CardTitle<T extends ElementType = "h3">({
  as,
  className,
  children,
  ...rest
}: TypographyPolymorphicProps<T>) {
  const Tag = (as ?? "h3") as ElementType;
  return (
    <Tag className={cn(ds.typography.cardTitle, className)} {...rest}>
      {children}
    </Tag>
  );
}

export function BodyText({
  as,
  className,
  children,
  ...rest
}: WithAs<"p"> & ComponentPropsWithoutRef<"p">) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag className={cn(ds.typography.body, className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Readable secondary tone — hero leads, section descriptions */
export function MutedText({
  as,
  className,
  children,
  ...rest
}: WithAs<"p"> & ComponentPropsWithoutRef<"p">) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag className={cn(ds.typography.sectionLead, className)} {...rest}>
      {children}
    </Tag>
  );
}

/** Tight labels for forms and dense UI */
export function LabelText<T extends ElementType = "span">({
  as,
  className,
  children,
  ...rest
}: TypographyPolymorphicProps<T>) {
  const Tag = (as ?? "span") as ElementType;
  return (
    <Tag className={cn(ds.typography.uiLabel, className)} {...rest}>
      {children}
    </Tag>
  );
}

export function MetricValue<T extends ElementType = "p">({
  as,
  className,
  children,
  ...rest
}: TypographyPolymorphicProps<T>) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag className={cn(ds.typography.metricValue, className)} {...rest}>
      {children}
    </Tag>
  );
}

export function MetricLabel<T extends ElementType = "p">({
  as,
  className,
  children,
  ...rest
}: TypographyPolymorphicProps<T>) {
  const Tag = (as ?? "p") as ElementType;
  return (
    <Tag className={cn(ds.typography.metricLabel, className)} {...rest}>
      {children}
    </Tag>
  );
}
