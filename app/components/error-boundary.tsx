import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardBody } from '~/components/ui/card';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center">
          <Card className="w-full max-w-md shadow-2xl shadow-rose-950/30">
            <CardBody className="space-y-4 p-8 text-center">
              <h1 className="text-2xl font-semibold text-white">Something went wrong</h1>
              <p className="text-sm text-slate-300">
                An unexpected error occurred. Try refreshing the page.
              </p>
              {import.meta.env.DEV && (
                <pre className="overflow-auto rounded-xl bg-slate-950/50 p-4 text-left text-xs text-rose-300">
                  {this.state.error.message}
                </pre>
              )}
              <Button
                className="w-full justify-center"
                size="lg"
                onClick={() => {
                  this.setState({ error: null });
                  window.location.reload();
                }}
              >
                Reload page
              </Button>
            </CardBody>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}
