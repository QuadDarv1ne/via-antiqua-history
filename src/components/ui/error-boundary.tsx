'use client'

import * as React from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-[200px] flex items-center justify-center p-6 sm:p-8 rounded-xl border border-border bg-card">
          <div className="text-center max-w-md">
            <div className="flex justify-center mb-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </span>
            </div>
            <h3 className="font-display text-lg font-semibold mb-2">
              Что-то пошло не так
            </h3>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Произошла ошибка при загрузке этого раздела. Попробуйте обновить страницу.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Попробовать снова
              </button>
              <Link
                href="/"
                className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-border bg-card text-sm font-medium hover:bg-accent/10 transition-colors"
              >
                На главную
              </Link>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-muted-foreground cursor-pointer">
                  Детали ошибки (dev)
                </summary>
                <pre className="mt-2 p-3 bg-muted/50 rounded-lg text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
