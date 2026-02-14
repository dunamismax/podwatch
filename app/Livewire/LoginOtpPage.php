<?php

namespace App\Livewire;

use App\Services\OtpAuthService;
use Illuminate\Support\Facades\Auth;
use Illuminate\View\View;
use Livewire\Component;

class LoginOtpPage extends Component
{
    public string $email = '';

    public function mount(): void
    {
        if (Auth::check()) {
            $this->redirectRoute('dashboard', navigate: true);
        }
    }

    public function sendCode(OtpAuthService $otpAuthService): void
    {
        $validated = $this->validate([
            'email' => ['required', 'email'],
        ], [
            'email.required' => 'Enter a valid email address.',
            'email.email' => 'Enter a valid email address.',
        ]);

        $normalizedEmail = strtolower(trim($validated['email']));
        $otpAuthService->issueCode($normalizedEmail);

        session()->flash('status', 'We sent a 6-digit code to your email.');

        $this->redirectRoute('verify', ['email' => $normalizedEmail], navigate: true);
    }

    public function render(): View
    {
        return view('livewire.login-otp-page')
            ->layout('layouts.pod');
    }
}
