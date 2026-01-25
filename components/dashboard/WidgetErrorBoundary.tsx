"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
    children: ReactNode
    title?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

export class WidgetErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error(`[Widget Error] ${this.props.title}:`, error, errorInfo)
    }

    private handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-center space-y-2">
                    <div className="p-2 bg-destructive/10 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">Widget Failed</h3>
                    <p className="text-xs text-muted-foreground max-w-[200px] line-clamp-2">
                        {this.props.title || "This widget"} encountered an error.
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={this.handleRetry}
                        className="h-7 text-xs gap-1.5 mt-2"
                    >
                        <RefreshCw className="h-3 w-3" /> Retry
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
