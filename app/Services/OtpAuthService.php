<?php

namespace App\Services;

use App\Mail\OtpCodeMail;
use App\Models\OtpCode;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class OtpAuthService
{
    public function issueCode(string $email): string
    {
        $normalizedEmail = $this->normalizeEmail($email);
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $codeHash = $this->hashCode($normalizedEmail, $code);

        OtpCode::query()
            ->where('email', $normalizedEmail)
            ->orWhere('expires_at', '<', now())
            ->orWhereNotNull('consumed_at')
            ->delete();

        OtpCode::query()->create([
            'email' => $normalizedEmail,
            'code_hash' => $codeHash,
            'expires_at' => now()->addMinutes(10),
        ]);

        Mail::to($normalizedEmail)->send(new OtpCodeMail($code));

        return $code;
    }

    public function verifyCodeAndLogin(string $email, string $code): bool
    {
        $normalizedEmail = $this->normalizeEmail($email);
        $codeHash = $this->hashCode($normalizedEmail, trim($code));

        return (bool) DB::transaction(function () use ($normalizedEmail, $codeHash): bool {
            $otpCode = OtpCode::query()
                ->where('email', $normalizedEmail)
                ->where('code_hash', $codeHash)
                ->active()
                ->latest('created_at')
                ->lockForUpdate()
                ->first();

            if (! $otpCode instanceof OtpCode) {
                return false;
            }

            $otpCode->forceFill([
                'consumed_at' => now(),
            ])->save();

            $user = User::query()->firstOrCreate(
                ['email' => $normalizedEmail],
                [
                    'name' => null,
                    'password' => null,
                ],
            );

            Auth::login($user);

            return true;
        });
    }

    public function hashCode(string $email, string $code): string
    {
        return hash('sha256', $this->normalizeEmail($email).':'.trim($code).':'.config('app.key'));
    }

    private function normalizeEmail(string $email): string
    {
        return strtolower(trim($email));
    }
}
