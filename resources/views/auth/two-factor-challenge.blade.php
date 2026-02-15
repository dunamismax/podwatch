@extends('layouts.pod')

@section('content')
    <section class="mx-auto w-full max-w-xl">
        <div class="auth-panel" x-data="{ challenge: 'code' }">
            <p class="ui-kicker">Authentication</p>
            <flux:heading size="xl" class="mt-2 text-zinc-100">Two-factor challenge</flux:heading>
            <flux:subheading class="mt-2 text-zinc-400">
                Enter a code from your authenticator app or use a recovery code.
            </flux:subheading>

            <div class="mt-6 flex flex-wrap gap-2">
                <flux:button type="button" variant="ghost" x-on:click="challenge = 'code'" class="cursor-pointer">
                    Authenticator code
                </flux:button>
                <flux:button type="button" variant="ghost" x-on:click="challenge = 'recovery'" class="cursor-pointer">
                    Recovery code
                </flux:button>
            </div>

            <form method="POST" action="{{ url('/two-factor-challenge') }}" class="mt-4 space-y-4">
                @csrf

                <div x-cloak x-show="challenge === 'code'" x-transition>
                    <flux:input
                        name="code"
                        :label="__('Code')"
                        inputmode="numeric"
                        autocomplete="one-time-code"
                        placeholder="123456"
                    />
                    <flux:error name="code" />
                </div>

                <div x-cloak x-show="challenge === 'recovery'" x-transition>
                    <flux:input
                        name="recovery_code"
                        :label="__('Recovery code')"
                        autocomplete="one-time-code"
                        placeholder="xxxx-xxxx"
                    />
                    <flux:error name="recovery_code" />
                </div>

                <flux:button type="submit" variant="primary" class="w-full cursor-pointer">
                    Continue
                </flux:button>
            </form>

            <p class="mt-5 text-sm text-zinc-400">
                Need to sign in with a different account?
                <flux:link href="{{ route('login') }}" class="text-cyan-200">Back to login</flux:link>.
            </p>
        </div>
    </section>
@endsection
