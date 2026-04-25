import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ErrorWalkthrough, messageFor } from './ErrorWalkthrough';
import { ERROR_LINES, sameLangError } from '@/lib/snarkLines';
import type { ValidationError } from '@/lib/validation';

afterEach(() => cleanup());

describe('messageFor', () => {
  const cases: Array<[ValidationError, { rawSrc?: string; rawTgt?: string }, string]> = [
    ['invalid_src', {}, ERROR_LINES.invalidLang],
    ['invalid_tgt', {}, ERROR_LINES.invalidLang],
    ['empty_text', {}, ERROR_LINES.emptyText],
    ['text_too_long', {}, ERROR_LINES.textTooLong],
    ['same_lang', { rawSrc: 'en', rawTgt: 'en' }, sameLangError('English')],
    ['same_lang', {}, sameLangError('that language')],
  ];

  it.each(cases)('messageFor(%s) returns the right copy', (error, ctx, expected) => {
    expect(messageFor({ error, ...ctx })).toBe(expected);
  });
});

describe('<ErrorWalkthrough />', () => {
  it('renders the chrome and the error message in the source panel', () => {
    render(<ErrorWalkthrough error="invalid_src" rawSrc="xx" rawTgt="pt" />);
    expect(screen.getByText(ERROR_LINES.invalidLang)).toBeInTheDocument();
    expect(screen.getByText(/start over on lmgttfy\.com/)).toBeInTheDocument();
  });

  it('shows the localized same-lang message', () => {
    render(<ErrorWalkthrough error="same_lang" rawSrc="pt" rawTgt="pt" />);
    expect(screen.getByText(sameLangError('Portuguese'))).toBeInTheDocument();
  });

  it('toggles the body.walkthrough class while mounted', () => {
    const { unmount } = render(<ErrorWalkthrough error="empty_text" />);
    expect(document.body.classList.contains('walkthrough')).toBe(true);
    unmount();
    expect(document.body.classList.contains('walkthrough')).toBe(false);
  });
});
