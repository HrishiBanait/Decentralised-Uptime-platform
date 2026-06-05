"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Context for managing tab state
interface TabsContextValue {
    activeTab: string;
    setActiveTab: (id: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined);

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultValue: string;
    onValueChange?: (value: string) => void;
}

export function Tabs({ defaultValue, onValueChange, children, className, ...props }: TabsProps) {
    const [activeTab, setActiveTab] = React.useState(defaultValue);

    const handleTabChange = (id: string) => {
        setActiveTab(id);
        onValueChange?.(id);
    };

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
            <div className={cn("w-full", className)} {...props}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;

export function TabsList({ children, className, ...props }: TabsListProps) {
    return (
        <div
            className={cn(
                "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    value: string;
}

export function TabsTrigger({ value, children, className, ...props }: TabsTriggerProps) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");

    const isActive = context.activeTab === value;

    return (
        <button
            className={cn(
                "relative inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground",
                className
            )}
            onClick={() => context.setActiveTab(value)}
            {...props}
        >
            {isActive && (
                <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 z-0 bg-background rounded-sm shadow-sm"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
            )}
            <span className="relative z-10">{children}</span>
        </button>
    );
}

interface TabsContentProps extends React.ComponentPropsWithoutRef<typeof motion.div> {
    value: string;
}

export function TabsContent({ value, children, className, ...props }: TabsContentProps) {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.activeTab !== value) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }} // subtle slide up
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
                "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            {...props}
        >
            {children}
        </motion.div>
    );
}
