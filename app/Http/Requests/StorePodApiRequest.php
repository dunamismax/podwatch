<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Exceptions\HttpResponseException;
use JsonException;

class StorePodApiRequest extends FormRequest
{
    protected ?array $decodedJsonPayload = null;

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (! $this->isJson()) {
            return;
        }

        $content = trim((string) $this->getContent());
        if ($content === '') {
            $this->decodedJsonPayload = [];

            return;
        }

        try {
            $decoded = json_decode($content, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            $this->decodedJsonPayload = null;

            return;
        }

        if (! is_array($decoded)) {
            $this->decodedJsonPayload = null;

            return;
        }

        $this->decodedJsonPayload = $decoded;
        $this->merge($decoded);
    }

    public function decodedJsonPayload(): ?array
    {
        return $this->decodedJsonPayload;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Pod name must be at least 2 characters.',
            'name.min' => 'Pod name must be at least 2 characters.',
            'name.max' => 'Pod name must be 120 characters or fewer.',
            'description.max' => 'Description must be 500 characters or fewer.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        throw new HttpResponseException(response()->json([
            'error' => $validator->errors()->first(),
        ], 400));
    }
}
