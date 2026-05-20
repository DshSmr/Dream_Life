"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formFieldClassName } from "@/lib/form-control";

export type SelectOption = {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
};

type PanelPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

type SelectContextValue = {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  size: "sm" | "default";
  placeholder?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  popupRef: React.RefObject<HTMLUListElement | null>;
  panelPosition: PanelPosition | null;
  updatePanelPosition: () => void;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select components must be used within <Select>");
  return ctx;
}

const selectPopupClassName = cn(
  "fixed z-[200] overflow-hidden rounded-ds-input border border-lifeos-border-subtle/25",
  "bg-lifeos-elevated/98 text-lifeos-fg shadow-ds-md backdrop-blur-sm",
  "outline-none ring-1 ring-lifeos-border-subtle/10",
  "motion-safe:animate-lifeos-soft-in"
);

const selectItemClassName = cn(
  "grid w-full min-h-10 cursor-pointer select-none grid-cols-[1fr_auto] items-center gap-2 rounded-ds-input px-ds-3 py-2 text-left text-sm text-lifeos-fg outline-none",
  "transition-[background-color,color] duration-lifeos-normal ease-lifeos",
  "hover:bg-lifeos-accent-soft/55 hover:text-lifeos-accent",
  "focus-visible:bg-lifeos-accent-soft/55 focus-visible:text-lifeos-accent",
  "disabled:pointer-events-none disabled:opacity-40",
  "aria-selected:font-medium aria-selected:text-lifeos-accent"
);

function normalizeItems(
  items: Record<string, React.ReactNode> | ReadonlyArray<{ label: React.ReactNode; value: string }>
): SelectOption[] {
  if (Array.isArray(items)) {
    return items.map((item) => ({
      value: String(item.value),
      label: item.label,
      disabled: "disabled" in item ? Boolean((item as { disabled?: boolean }).disabled) : false
    }));
  }
  return Object.entries(items).map(([value, label]) => ({ value, label }));
}

function walkSelectChildren(
  node: React.ReactNode,
  visit: (child: React.ReactElement) => void
) {
  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;
    visit(child);
    if (child.props && typeof child.props === "object" && "children" in child.props) {
      walkSelectChildren(child.props.children as React.ReactNode, visit);
    }
  });
}

function extractOptionsFromChildren(children: React.ReactNode): SelectOption[] {
  const out: SelectOption[] = [];
  walkSelectChildren(children, (child) => {
    if ((child.type as { displayName?: string })?.displayName !== "SelectItem" && child.type !== SelectItem) return;
    const { value, disabled, children: label } = child.props as {
      value: string;
      disabled?: boolean;
      children?: React.ReactNode;
    };
    if (value != null && value !== "") {
      out.push({ value: String(value), label: label ?? value, disabled });
    }
  });
  return out;
}

function extractPlaceholder(children: React.ReactNode): string | undefined {
  let placeholder: string | undefined;
  walkSelectChildren(children, (child) => {
    if (child.type !== SelectValue) return;
    const p = (child.props as { placeholder?: string }).placeholder;
    if (p) placeholder = p;
  });
  return placeholder;
}

function isInsideSelect(target: Node, trigger: HTMLButtonElement | null, popup: HTMLUListElement | null): boolean {
  if (trigger?.contains(target)) return true;
  if (popup?.contains(target)) return true;
  return false;
}

export type SelectProps = {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
  items?: Record<string, React.ReactNode> | ReadonlyArray<{ label: React.ReactNode; value: string }>;
};

function Select({ value, defaultValue, onValueChange, disabled, children, items }: SelectProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultValue ?? "");
  const [open, setOpen] = React.useState(false);
  const [panelPosition, setPanelPosition] = React.useState<PanelPosition | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const popupRef = React.useRef<HTMLUListElement>(null);
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : uncontrolled;

  const extracted = React.useMemo(() => extractOptionsFromChildren(children), [children]);
  const placeholder = React.useMemo(() => extractPlaceholder(children), [children]);
  const options = React.useMemo(() => {
    if (items) {
      const fromItems = normalizeItems(items);
      if (extracted.length === 0) return fromItems;
      const labelByValue = new Map(fromItems.map((o) => [o.value, o.label]));
      return extracted.map((o) => ({
        ...o,
        label: labelByValue.get(o.value) ?? o.label
      }));
    }
    return extracted;
  }, [items, extracted]);

  const updatePanelPosition = React.useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const gap = 4;
    const preferredMax = 240;
    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;

    let maxHeight = preferredMax;
    let top = rect.bottom + gap;

    if (spaceBelow < preferredMax && spaceAbove > spaceBelow) {
      maxHeight = Math.min(preferredMax, Math.max(120, spaceAbove));
      top = Math.max(gap, rect.top - gap - maxHeight);
    } else {
      maxHeight = Math.min(preferredMax, Math.max(120, spaceBelow));
    }

    setPanelPosition({
      top,
      left: rect.left,
      width: rect.width,
      maxHeight
    });
  }, []);

  const handleChange = React.useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolled(next);
      onValueChange?.(next);
      setOpen(false);
    },
    [isControlled, onValueChange]
  );

  React.useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
  }, [open, updatePanelPosition, options.length]);

  React.useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (isInsideSelect(target, triggerRef.current, popupRef.current)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onReposition() {
      updatePanelPosition();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    };
  }, [open, updatePanelPosition]);

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleChange,
        options,
        disabled,
        size: "default",
        placeholder,
        open,
        setOpen,
        triggerRef,
        popupRef,
        panelPosition,
        updatePanelPosition
      }}
    >
      <div className="relative w-full">{children}</div>
    </SelectContext.Provider>
  );
}

function SelectTrigger({
  id,
  className,
  size = "default",
  invalid,
  children,
  "aria-invalid": ariaInvalid,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "size" | "value" | "defaultValue" | "onChange"> & {
  size?: "sm" | "default";
  invalid?: boolean;
  children?: React.ReactNode;
}) {
  const ctx = useSelectContext();
  const isInvalid = Boolean(invalid) || ariaInvalid === true || ariaInvalid === "true";

  return (
    <button
      {...props}
      ref={ctx.triggerRef}
      type="button"
      id={id}
      disabled={ctx.disabled}
      aria-invalid={isInvalid || undefined}
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
      onClick={(e) => {
        props.onClick?.(e);
        if (ctx.disabled) return;
        const next = !ctx.open;
        ctx.setOpen(next);
        if (next) ctx.updatePanelPosition();
      }}
      className={cn(
        formFieldClassName(isInvalid ? "invalid" : "default"),
        "relative w-full cursor-pointer justify-between gap-2 pr-10 text-left",
        size === "sm" && "h-10 min-h-10 text-xs",
        ctx.open && "ring-2 ring-focus ring-offset-2 ring-offset-lifeos-page",
        className
      )}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronDownIcon
        className={cn(
          "pointer-events-none absolute top-1/2 right-3 size-4 shrink-0 -translate-y-1/2 text-lifeos-fg-muted transition-transform duration-200 ease-lifeos",
          ctx.open && "rotate-180"
        )}
        aria-hidden
      />
    </button>
  );
}

function SelectValue({ placeholder, className }: { placeholder?: string; className?: string }) {
  const ctx = useSelectContext();
  const selected = ctx.options.find((o) => o.value === ctx.value);
  const text = selected?.label ?? placeholder ?? "";

  return (
    <span className={cn("block truncate text-sm text-lifeos-fg", !selected && placeholder && "text-lifeos-fg-muted", className)}>
      {text}
    </span>
  );
}
SelectValue.displayName = "SelectValue";

function SelectContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  const ctx = useSelectContext();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!ctx.open || !mounted || !ctx.panelPosition) return null;

  const listChildren =
    children ??
    ctx.options.map((option) => (
      <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
        {option.label}
      </SelectItem>
    ));

  const panel = (
    <ul
      ref={ctx.popupRef}
      role="listbox"
      style={{
        top: ctx.panelPosition.top,
        left: ctx.panelPosition.left,
        width: ctx.panelPosition.width,
        maxHeight: ctx.panelPosition.maxHeight
      }}
      className={cn(
        selectPopupClassName,
        "list-none overflow-y-auto overscroll-contain p-1",
        className
      )}
      onWheel={(e) => e.stopPropagation()}
    >
      {listChildren}
    </ul>
  );

  return createPortal(panel, document.body);
}
SelectContent.displayName = "SelectContent";

function SelectItem({
  value,
  disabled,
  children,
  className
}: {
  value: string;
  children?: React.ReactNode;
  disabled?: boolean;
  className?: string;
}) {
  const ctx = useSelectContext();
  const selected = ctx.value === value;

  return (
    <li role="presentation" className="list-none">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        disabled={disabled || ctx.disabled}
        className={cn(selectItemClassName, className)}
        onClick={() => {
          if (disabled || ctx.disabled) return;
          ctx.onValueChange(value);
        }}
      >
        <span className="min-w-0 truncate">{children}</span>
        <span className="flex size-4 shrink-0 items-center justify-center" aria-hidden>
          {selected ? <CheckIcon className="size-3.5 text-lifeos-accent" /> : null}
        </span>
      </button>
    </li>
  );
}
SelectItem.displayName = "SelectItem";

function SelectGroup(_props: { children?: React.ReactNode; className?: string }) {
  return null;
}

function SelectLabel(_props: { children?: React.ReactNode; className?: string }) {
  return null;
}

function SelectSeparator() {
  return null;
}

function SelectScrollUpButton() {
  return null;
}

function SelectScrollDownButton() {
  return null;
}

export function useSelectStringHandler(setValue: (next: string) => void) {
  return React.useCallback(
    (value: unknown) => {
      if (typeof value === "string") setValue(value);
    },
    [setValue]
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue
};
