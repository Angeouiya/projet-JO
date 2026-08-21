import { cn } from '@/lib/utils';

type BrandLogoSize = 'xs' | 'sm' | 'md' | 'lg';

const logoSizes: Record<BrandLogoSize, string> = {
  xs: 'size-7',
  sm: 'size-8',
  md: 'size-9',
  lg: 'size-10',
};

export function BrandMark({
  size = 'sm',
  className,
}: {
  size?: BrandLogoSize;
  className?: string;
}) {
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg', logoSizes[size], className)}>
      <img
        src="/icons/buildify-logo.png"
        alt="Buildify"
        className="h-full w-full object-contain"
        draggable={false}
      />
    </span>
  );
}

export function BrandLogo({
  size = 'sm',
  subtitle,
  className,
  nameClassName,
  subtitleClassName,
}: {
  size?: BrandLogoSize;
  subtitle?: string;
  className?: string;
  nameClassName?: string;
  subtitleClassName?: string;
}) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <BrandMark size={size} />
      <span className="min-w-0">
        <span className={cn('block truncate text-sm font-bold leading-tight', nameClassName)}>Buildify</span>
        {subtitle && (
          <span className={cn('block truncate text-xs leading-tight text-muted-foreground', subtitleClassName)}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}
