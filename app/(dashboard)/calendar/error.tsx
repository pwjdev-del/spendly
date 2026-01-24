'use client'

import { useEffect } from 'react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an analytics service
        console.error('Calendar Error:', error)
    }, [error])

    return (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8 text-center bg-background text-foreground">
            <div className="rounded-full bg-destructive/10 p-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-destructive"
                >
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <path d="M21 17V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11" />
                    <path d="M3 10h18" />
                </svg>
            </div>
            <h2 className="text-2xl font-bold">Calendar Unavailable</h2>
            <p className="max-w-md text-muted-foreground">
                We encountered an error loading your calendar.
            </p>
            {process.env.NODE_ENV === 'development' && (
                <pre className="mt-4 p-4 rounded bg-muted text-left text-xs overflow-auto max-w-lg">
                    {error.message}
                    {error.digest && `\nDigest: ${error.digest}`}
                </pre>
            )}
            <div className="flex gap-4 mt-6">
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-colors"
                >
                    Reload Page
                </button>
                <button
                    onClick={() => reset()}
                    className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    Try Again
                </button>
            </div>
        </div>
    )
}
