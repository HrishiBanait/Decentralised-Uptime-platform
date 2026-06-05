"use client";
import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

// 🟢 Main Card Container
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden transition-transform duration-300 hover:shadow-md hover:-translate-y-1",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

// 🟢 Card Header (now supports optional image)
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, image, children, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-2 p-6", className)} {...props}>
      {image && (
        <div className="relative w-full h-40 mb-3 rounded-lg overflow-hidden">
          <Image
            src={image}
            alt="Card header image"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

// 🟢 Card Title
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold text-lg leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

// 🟢 Card Description
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

// 🟢 Card Content (also supports optional image)
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  image?: string;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, image, children, ...props }, ref) => (
    <div ref={ref} className={cn("p-6 pt-0 relative", className)} {...props}>
      {image && (
        <div className="relative w-full h-48 rounded-xl overflow-hidden mb-3">
          <Image
            src={image}
            alt="Card content image"
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

// 🟢 Card Footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
));
CardFooter.displayName = "CardFooter";

// 🟢 Exports
export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
