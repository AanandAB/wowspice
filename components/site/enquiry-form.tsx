"use client";

import { useId, useState } from "react";
import { Check, Warning } from "@phosphor-icons/react";

/**
 * Wholesale and gifting enquiry form.
 *
 * Labels sit above inputs, errors below them, and no field uses a placeholder as
 * its label. Validation runs on submit and then live per field, so a user is not
 * scolded while they are still typing the first time.
 */

type Status = "idle" | "submitting" | "success" | "error";

interface Fields {
  name: string;
  business: string;
  email: string;
  phone: string;
  enquiryType: string;
  quantity: string;
  message: string;
}

const EMPTY: Fields = {
  name: "",
  business: "",
  email: "",
  phone: "",
  enquiryType: "wholesale",
  quantity: "",
  message: "",
};

const ENQUIRY_TYPES = [
  { value: "wholesale", label: "Wholesale or bulk" },
  { value: "gifting", label: "Gift boxes and wedding favours" },
  { value: "export", label: "Export enquiry" },
  { value: "support", label: "Problem with an order" },
];

/** Demo reference, mirroring the shape the old /api/enquiry route returned. */
function makeReference(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  return `WS-ENQ-${stamp}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function validate(fields: Fields): Partial<Record<keyof Fields, string>> {
  const errors: Partial<Record<keyof Fields, string>> = {};
  if (!fields.name.trim()) errors.name = "Tell us who we are speaking to.";
  if (!fields.email.trim()) errors.email = "We need an email address to reply to.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "That does not look like a valid email address.";
  }
  if (fields.phone.trim() && !/^[+\d][\d\s-]{7,}$/.test(fields.phone.trim())) {
    errors.phone = "Use digits, spaces and an optional leading +.";
  }
  if (!fields.business.trim()) {
    errors.business = "The business or kitchen name helps us route your enquiry.";
  }
  if (fields.message.trim().length < 12) {
    errors.message = "A sentence or two about what you need, so we can answer properly.";
  }
  return errors;
}

export function EnquiryForm() {
  const baseId = useId();
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<Status>("idle");
  const [reference, setReference] = useState<string | null>(null);

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const field = (
    key: keyof Fields,
    label: string,
    options: {
      type?: string;
      required?: boolean;
      help?: string;
      textarea?: boolean;
      select?: boolean;
    } = {}
  ) => {
    const id = `${baseId}-${key}`;
    const errorId = `${id}-error`;
    const helpId = `${id}-help`;
    const describedBy = [options.help ? helpId : null, errors[key] ? errorId : null]
      .filter(Boolean)
      .join(" ");

    const common = {
      id,
      name: key,
      value: fields[key],
      "aria-invalid": errors[key] ? true : undefined,
      "aria-describedby": describedBy || undefined,
      className: "ws-input",
      required: options.required,
    };

    return (
      <div>
        <label className="ws-label" htmlFor={id}>
          {label}
          {options.required ? <span aria-hidden> *</span> : null}
        </label>

        {options.select ? (
          <select
            {...common}
            onChange={(event) => set(key, event.target.value)}
            className="ws-input appearance-none"
          >
            {ENQUIRY_TYPES.map((option) => (
              <option key={option.value} value={option.value} className="bg-[#141111]">
                {option.label}
              </option>
            ))}
          </select>
        ) : options.textarea ? (
          <textarea
            {...common}
            rows={5}
            onChange={(event) => set(key, event.target.value)}
            className="ws-input resize-y"
          />
        ) : (
          <input {...common} type={options.type ?? "text"} onChange={(event) => set(key, event.target.value)} />
        )}

        {options.help ? (
          <p id={helpId} className="ws-meta mt-1.5">
            {options.help}
          </p>
        ) : null}
        {errors[key] ? (
          <span id={errorId} className="ws-error" role="alert">
            {errors[key]}
          </span>
        ) : null}
      </div>
    );
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const found = validate(fields);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      setStatus("idle");
      return;
    }

    setStatus("submitting");
    // A static host has no API route, so "sending" is simulated. The success
    // panel is honest about it: nothing reaches a real inbox yet.
    window.setTimeout(() => {
      setReference(makeReference());
      setStatus("success");
    }, 450);
  };

  if (status === "success") {
    return (
      <div className="ws-surface p-8 text-center" role="status">
        <span
          aria-hidden
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-full"
          style={{ background: "rgb(var(--ws-accent) / 0.18)" }}
        >
          <Check size={20} weight="bold" />
        </span>
        <h3 className="font-display mt-5 text-[1.25rem] font-semibold">Enquiry received</h3>
        <p className="ws-meta mx-auto mt-3 max-w-[44ch] leading-relaxed">
          We answer wholesale enquiries within one working day. Nothing has been sent to a real
          inbox yet — this is a demonstration storefront.
        </p>
        {reference ? (
          <p className="ws-meta mt-4 font-mono">Reference {reference}</p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setFields(EMPTY);
            setErrors({});
            setStatus("idle");
          }}
          className="ws-btn ws-btn-ghost ws-btn-sm mt-6"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {field("name", "Your name", { required: true, type: "text" })}
        {field("business", "Business or kitchen", { required: true })}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {field("email", "Email", { required: true, type: "email" })}
        {field("phone", "Phone", { help: "Optional, but it speeds things up." })}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {field("enquiryType", "What is this about", { select: true })}
        {field("quantity", "Rough quantity", {
          help: "For example, 25 kg a month, or 60 gift boxes.",
        })}
      </div>

      {field("message", "What do you need", {
        required: true,
        textarea: true,
        help: "Spices, volumes, timings and any certification you need us to meet.",
      })}

      {status === "error" ? (
        <p className="flex items-center gap-2 text-[0.84rem] text-[#f08a72]" role="alert">
          <Warning size={15} weight="bold" />
          Something went wrong sending that. Try again, or email hello@wowspice.example.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="ws-btn ws-btn-accent"
        >
          {status === "submitting" ? "Sending…" : "Send enquiry"}
        </button>
        <p className="ws-meta">We reply within one working day.</p>
      </div>
    </form>
  );
}
