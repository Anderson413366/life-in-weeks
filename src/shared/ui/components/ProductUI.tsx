import React from "react";

type ButtonVariant = "primary" | "secondary" | "quiet" | "danger" | "ai";
type ButtonSize = "sm" | "md" | "lg";
type SurfaceVariant = "panel" | "hero" | "inset" | "callout";
type PillTone = "neutral" | "accent" | "warm" | "success" | "danger";
type Tone = "neutral" | "accent" | "warm" | "success" | "danger";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  icon,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={cx(
        "app-button",
        `app-button--${variant}`,
        `app-button--${size}`,
        fullWidth && "app-button--full",
        className,
      )}
    >
      {icon ? <span className="app-button__icon" aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}

interface LinkButtonProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function LinkButton({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  icon,
  className,
  children,
  ...props
}: LinkButtonProps) {
  return (
    <a
      {...props}
      className={cx(
        "app-button",
        `app-button--${variant}`,
        `app-button--${size}`,
        fullWidth && "app-button--full",
        className,
      )}
    >
      {icon ? <span className="app-button__icon" aria-hidden="true">{icon}</span> : null}
      <span>{children}</span>
    </a>
  );
}

interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SurfaceVariant;
}

export function Surface({ variant = "panel", className, ...props }: SurfaceProps) {
  return <div {...props} className={cx("app-surface", `app-surface--${variant}`, className)} />;
}

export function TextField({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("app-field", className)} />;
}

export function SelectField({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx("app-field", className)} />;
}

export function TextAreaField({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx("app-field app-field--textarea", className)} />;
}

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: PillTone;
}

export function Pill({ tone = "neutral", className, ...props }: PillProps) {
  return <span {...props} className={cx("app-pill", `app-pill--${tone}`, className)} />;
}

interface PageHeroProps {
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}

export function PageHero({ eyebrow, title, description, actions, meta, className }: PageHeroProps) {
  return (
    <Surface variant="hero" className={cx("page-hero", className)}>
      <div className="page-hero__copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="page-hero__title">{title}</h1>
        <div className="page-hero__description">{description}</div>
      </div>
      {(actions || meta) ? (
        <div className="page-hero__aside">
          {meta ? <div className="page-hero__meta">{meta}</div> : null}
          {actions ? <div className="page-hero__actions">{actions}</div> : null}
        </div>
      ) : null}
    </Surface>
  );
}

interface InfoCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  tone?: Tone;
}

export function InfoCard({
  eyebrow,
  title,
  description,
  meta,
  action,
  tone = "neutral",
  className,
  children,
  ...props
}: InfoCardProps) {
  return (
    <div {...props} className={cx("info-card", `info-card--${tone}`, className)}>
      <div className="info-card__body">
        {eyebrow ? <p className="info-card__eyebrow">{eyebrow}</p> : null}
        <h3 className="info-card__title">{title}</h3>
        {description ? <div className="info-card__description">{description}</div> : null}
        {children}
      </div>
      {(meta || action) ? (
        <div className="info-card__aside">
          {meta ? <div className="info-card__meta">{meta}</div> : null}
          {action}
        </div>
      ) : null}
    </div>
  );
}

interface SectionPanelProps extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  tone?: Tone;
}

export function SectionPanel({
  eyebrow,
  title,
  description,
  actions,
  tone = "neutral",
  className,
  children,
  ...props
}: SectionPanelProps) {
  return (
    <section {...props} className={cx("section-panel", `section-panel--${tone}`, className)}>
      <div className="section-panel__header">
        <div className="section-panel__copy">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h2 className="section-panel__title">{title}</h2>
          {description ? <div className="section-panel__description">{description}</div> : null}
        </div>
        {actions ? <div className="section-panel__actions">{actions}</div> : null}
      </div>
      {children ? <div className="section-panel__content">{children}</div> : null}
    </section>
  );
}

interface StatTileProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  label: React.ReactNode;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: Tone;
}

export function StatTile({ label, value, detail, tone = "neutral", className, ...props }: StatTileProps) {
  return (
    <div {...props} className={cx("stat-tile", `stat-tile--${tone}`, className)}>
      <p className="stat-tile__label">{label}</p>
      <p className="stat-tile__value">{value}</p>
      {detail ? <p className="stat-tile__detail">{detail}</p> : null}
    </div>
  );
}

interface SegmentedControlProps<T extends string> {
  value: T;
  items: Array<{ value: T; label: React.ReactNode; description?: string }>;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}

export function SegmentedControl<T extends string>({
  value,
  items,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div className={cx("segmented-control", className)} role="radiogroup" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          className="segmented-control__button"
          aria-checked={value === item.value}
          role="radio"
          title={item.description}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
