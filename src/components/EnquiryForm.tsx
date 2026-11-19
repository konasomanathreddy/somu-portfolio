import { useState, type FormEvent, type RefObject } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Mail, Send } from 'lucide-react';
import type {
  EnquiryApiResponse,
  EnquiryReceipt,
  EnquirySubmissionPayload,
} from '../types/portfolio';

interface EnquiryFormProps {
  recipientEmail: string;
  nameInputRef: RefObject<HTMLInputElement | null>;
}

const SUBJECT_PRESETS = [
  'Internship Opportunity',
  'Project Collaboration',
  'General Enquiry',
];

const EMAIL_PATTERN =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;

export function EnquiryForm({
  recipientEmail,
  nameInputRef,
}: EnquiryFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<{
    enquiry: EnquiryReceipt;
    message: string;
    emailSent: boolean;
    deliveryDetail: string;
    submittedPayload: EnquirySubmissionPayload;
  } | null>(null);

  const validateClient = (): Record<string, string> => {
    const errors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (trimmedName.length < 2) {
      errors.name = 'Please enter your full name (at least 2 characters).';
    }
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address so I can reply.';
    }
    if (trimmedMessage.length < 15) {
      errors.message =
        'Please include a detailed message (at least 15 characters).';
    } else if (trimmedMessage.length > 4000) {
      errors.message = 'Message must be 4,000 characters or fewer.';
    }
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const payload: EnquirySubmissionPayload = {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      website,
    };

    try {
      const response = await fetch('/api/enquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as EnquiryApiResponse;

      if (!response.ok || !data.ok) {
        if (data.fieldErrors) {
          setFieldErrors(data.fieldErrors);
        }
        setFormError(
          data.error || 'Could not submit your enquiry. Please check your input.'
        );
        return;
      }

      if (data.enquiry) {
        setReceipt({
          enquiry: data.enquiry,
          message:
            data.message ||
            'Your enquiry has been received by the Python backend.',
          emailSent: Boolean(data.emailSent),
          deliveryDetail: data.deliveryDetail || '',
          submittedPayload: payload,
        });
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setWebsite('');
      }
    } catch {
      setFormError(
        'Network error while reaching the enquiry server. Please try again or email directly.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receipt) {
    const mailtoHref = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(
      receipt.enquiry.subject
    )}&body=${encodeURIComponent(
      `Hi Somanath,\n\n${receipt.submittedPayload.message}\n\nBest,\n${receipt.enquiry.name}\n(${receipt.enquiry.email})`
    )}`;

    return (
      <div className="rounded-2xl border border-white/10 bg-[#10131C] p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-3">
          <CheckCircle2
            className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-white">
              Enquiry Received
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {receipt.message}
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-white/10 bg-[#090B10] p-4 text-sm">
          <div>
            <dt className="text-xs text-zinc-500">Reference Code</dt>
            <dd className="mt-1 font-mono text-zinc-100 tabular-nums">
              {receipt.enquiry.referenceCode}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Sender</dt>
            <dd className="mt-1 text-zinc-100 truncate">
              {receipt.enquiry.name} ({receipt.enquiry.email})
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Subject</dt>
            <dd className="mt-1 text-zinc-200 truncate">
              {receipt.enquiry.subject}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500">Recorded At (UTC)</dt>
            <dd className="mt-1 font-mono text-xs text-zinc-300 tabular-nums">
              {new Date(receipt.enquiry.createdAt).toLocaleString()}
            </dd>
          </div>
        </dl>

        {receipt.deliveryDetail && !receipt.emailSent && (
          <p className="text-xs text-zinc-400 leading-relaxed">
            {receipt.deliveryDetail}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => setReceipt(null)}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 whitespace-nowrap shrink-0"
          >
            Send Another Enquiry
          </button>

          <a
            href={mailtoHref}
            className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/5 hover:text-white whitespace-nowrap shrink-0"
          >
            <Mail className="h-4 w-4" aria-hidden="true" />
            <span>Open in Email App</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-white/10 bg-[#10131C] p-6 sm:p-8 space-y-5"
    >
      <div className="space-y-1">
        <h3 className="text-xl font-semibold text-white">Send an Enquiry</h3>
        <p className="text-sm text-zinc-400">
          Share your name, email address, and project or internship details for
          direct contact.
        </p>
      </div>

      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200"
        >
          <AlertCircle
            className="h-4 w-4 text-rose-400 shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span>{formError}</span>
        </div>
      )}

      <div className="hidden" aria-hidden="true">
        <label htmlFor="enquiry-website">Website</label>
        <input
          id="enquiry-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label
            htmlFor="enquiry-name"
            className="block text-sm font-medium text-zinc-200"
          >
            Full Name <span className="text-blue-400">*</span>
          </label>
          <input
            ref={nameInputRef}
            id="enquiry-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="Your full name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: '' }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.name)}
            className="w-full rounded-lg border border-white/15 bg-[#090B10] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-blue-500 focus:outline-none"
          />
          {fieldErrors.name && (
            <p className="flex items-center gap-1.5 text-xs text-rose-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{fieldErrors.name}</span>
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="enquiry-email"
            className="block text-sm font-medium text-zinc-200"
          >
            Email Address <span className="text-blue-400">*</span>
          </label>
          <input
            id="enquiry-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: '' }));
              }
            }}
            aria-invalid={Boolean(fieldErrors.email)}
            className="w-full rounded-lg border border-white/15 bg-[#090B10] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-blue-500 focus:outline-none"
          />
          {fieldErrors.email && (
            <p className="flex items-center gap-1.5 text-xs text-rose-300">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="enquiry-subject"
            className="block text-sm font-medium text-zinc-200"
          >
            Subject
          </label>
          <div className="flex flex-wrap items-center gap-1.5">
            {SUBJECT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSubject(preset)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  subject === preset
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:text-zinc-200'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
        <input
          id="enquiry-subject"
          name="subject"
          type="text"
          placeholder="What is your enquiry about? (optional)"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-white/15 bg-[#090B10] px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor="enquiry-message"
            className="block text-sm font-medium text-zinc-200"
          >
            Detailed Message <span className="text-blue-400">*</span>
          </label>
          <span className="font-mono text-xs text-zinc-500 tabular-nums">
            {message.length} / 4000
          </span>
        </div>
        <textarea
          id="enquiry-message"
          name="message"
          required
          rows={5}
          placeholder="Tell me about the role, project scope, timeline, or how we can collaborate..."
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (fieldErrors.message) {
              setFieldErrors((prev) => ({ ...prev, message: '' }));
            }
          }}
          aria-invalid={Boolean(fieldErrors.message)}
          className="w-full resize-y rounded-lg border border-white/15 bg-[#090B10] px-3.5 py-2.5 text-sm leading-relaxed text-white placeholder:text-zinc-500 transition-colors focus:border-blue-500 focus:outline-none"
        />
        {fieldErrors.message && (
          <p className="flex items-center gap-1.5 text-xs text-rose-300">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{fieldErrors.message}</span>
          </p>
        )}
      </div>

      <div className="pt-1 flex flex-wrap items-center justify-between gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 whitespace-nowrap shrink-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span>Sending Enquiry...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" aria-hidden="true" />
              <span>Send Enquiry</span>
            </>
          )}
        </button>

        <span className="text-xs text-zinc-500">
          Direct destination:{' '}
          <a
            href={`mailto:${recipientEmail}`}
            className="text-zinc-300 underline decoration-white/20 underline-offset-4 hover:text-white"
          >
            {recipientEmail}
          </a>
        </span>
      </div>
    </form>
  );
}
