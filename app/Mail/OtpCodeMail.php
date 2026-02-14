<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OtpCodeMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public string $code) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Magic Pod Dashboard sign-in code',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.otp-code-html',
            text: 'emails.otp-code-text',
            with: [
                'code' => $this->code,
            ],
        );
    }
}
