<?php

namespace App\Livewire;

use App\Services\OtpAuthService;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;
use Livewire\Component;

class VerifyOtpPage extends Component
{
    public string $email = '';

    public string $code = '';

    public function mount(?string $email = null): void
    {
        if (Auth::check()) {
            $this->redirectRoute('dashboard', navigate: true);

            return;
        }

        if (is_string($email)) {
            $this->email = strtolower(trim($email));
        }
    }

    public function verify(OtpAuthService $otpAuthService): void
    {
        $validated = $this->validate([
            'email' => ['required', 'email'],
            'code' => ['required', 'regex:/^\d{6}$/'],
        ], [
            'email.required' => 'Enter a valid email address.',
            'email.email' => 'Enter a valid email address.',
            'code.required' => 'Enter the 6-digit code from your email.',
            'code.regex' => 'Enter the 6-digit code from your email.',
        ]);

        $didAuthenticate = $otpAuthService->verifyCodeAndLogin(
            strtolower(trim($validated['email'])),
            trim($validated['code']),
        );

        if (! $didAuthenticate) {
            $this->addError('code', 'Invalid or expired code.');

            return;
        }

        session()->regenerate();
        $this->redirectRoute('dashboard', navigate: true);
    }

    public function render(): View
    {
        return view('livewire.verify-otp-page')
            ->layout('layouts.pod');
    }
}
