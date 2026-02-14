<?php

use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\PodController;
use App\Livewire\DashboardPage;
use App\Livewire\LoginOtpPage;
use App\Livewire\VerifyOtpPage;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/dashboard')->name('home');

Route::middleware('guest')->group(function (): void {
    Route::get('login', LoginOtpPage::class)->name('login');
    Route::get('verify', VerifyOtpPage::class)->name('verify');
});

Route::middleware('auth')->group(function (): void {
    Route::get('dashboard', DashboardPage::class)
        ->name('dashboard');

    Route::post('logout', function () {
        Auth::guard('web')->logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();

        return redirect()->route('login');
    })->name('logout');
});

Route::prefix('api')->group(function (): void {
    Route::get('pods', [PodController::class, 'index'])->name('api.pods.index');
    Route::post('pods', [PodController::class, 'store'])->name('api.pods.store');
    Route::get('events', [EventController::class, 'index'])->name('api.events.index');
});
