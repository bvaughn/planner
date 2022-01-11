import Link from "next/link";

export default function Test() {
  return (
    <>
      <h1>App</h1>
      <ul>
        <li>
          <Link href="/">App</Link>
        </li>
      </ul>
      <h1>Pages</h1>
      <ul>
        {Object.entries(URLS).map(([name, query]) => (
          <li key={name}>
            <Link href={`/headless?data=${query}`}>{name}</Link>
          </li>
        ))}
      </ul>
      <h1>Images</h1>
      <ul>
        {Object.entries(URLS).map(([name, query]) => (
          <li key={name}>
            <Link href={`/api/ogimage/?data=${query}`}>{name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

const URLS = {
  default: `eyJ0YXNrcyI6W3siaWQiOjEsInN0YXJ0IjoiMjAyMi0wMS0wMSIsInN0b3AiOiIyMDIyLTAzLTE1IiwibmFtZSI6IlBsYW5uZXIgSlMiLCJvd25lciI6InBsYW5uZXIifSx7InN0YXJ0IjoiMjAyMi0wMS0xNSIsInN0b3AiOiIyMDIyLTA1LTMwIiwibmFtZSI6IlBsYW4gYW5kIHNoYXJlIHlvdXIgbmV4dCBwcm9qZWN0IGluIG1pbnV0ZXMiLCJpc09uZ29pbmciOnRydWUsIm93bmVyIjoidGVhbSJ9LHsic3RhcnQiOiIyMDIyLTAyLTAxIiwic3RvcCI6IjIwMjItMDUtMDEiLCJuYW1lIjoiTGlnaHR3ZWlnaHQgaWdodHdlaWdodCBwbGFubmluZyB0b29sIiwiZGVwZW5kZW5jeSI6MSwib3duZXIiOiJwbGFubmVyIn1dLCJ0ZWFtIjp7InBsYW5uZXIiOnsibmFtZSI6IlBsYW5uZXIgSlMiLCJjb2xvciI6IiM1NDNlNWIiLCJhdmF0YXIiOiIvc3RhdGljL2F2YXRhci5wbmcifSwidGVhbSI6eyJuYW1lIjoiWW91ciB0ZWFtIiwiY29sb3IiOiIjMjIyMjNCIn19fQ`,
  days: `eyJ0YXNrcyI6W3sic3RhcnQiOiIyMDIyLTAyLTEyIiwic3RvcCI6IjIwMjItMDItMTMiLCJuYW1lIjoiU3ByaW5nIGNsZWFuaW5nIiwib3duZXIiOiJ0aW1lb2ZmIn0seyJzdGFydCI6IjIwMjItMDItMTQiLCJzdG9wIjoiMjAyMi0wMi0xNyIsIm5hbWUiOiJXb3JrIiwib3duZXIiOiJwcm8ifV0sInRlYW0iOnsicHJvIjp7Im5hbWUiOiJQcm9mZXNzaW9uYWwgQnJpYW4ifSwidGltZW9mZiI6eyJuYW1lIjoiVGltZSBvZmYgQnJpYW4ifX19`,
  weeks: `eyJ0YXNrcyI6W3sibmFtZSI6IldlZWsgQSIsInN0YXJ0IjoiMjAyMi0wMS0wMyIsInN0b3AiOiIyMDIyLTAxLTA5Iiwib3duZXIiOiJFcmluIn0seyJuYW1lIjoiV2VlayBCIiwic3RhcnQiOiIyMDIyLTAxLTEwIiwic3RvcCI6IjIwMjItMDEtMjMiLCJvd25lciI6IkVyaW4ifSx7Im5hbWUiOiJXZWVrIEMiLCJzdGFydCI6IjIwMjItMDEtMTciLCJzdG9wIjoiMjAyMi0wMS0yMyIsIm93bmVyIjoiQ2hyaXMifV0sInRlYW0iOnt9fQ`,
  months: `eyJ0YXNrcyI6W3siaWQiOiJleGFtcGxlIiwibmFtZSI6IkRlc2lnbiBBUEkiLCJvd25lciI6ImJ2YXVnaG4iLCJzdGFydCI6IjIwMjItMDEtMDEiLCJzdG9wIjoiMjAyMi0wMy0xNSJ9LHsiaWQiOjIsIm5hbWUiOiJGaW5pc2ggcHJvamVjdCBjYXJyeW92ZXIiLCJvd25lciI6InN1c2FuIiwic3RhcnQiOiIyMDIyLTAxLTAxIiwic3RvcCI6IjIwMjItMDMtMDEifSx7ImlkIjowLCJuYW1lIjoiV3JpdGUgQVBJIGRvY3VtZW50YXRpb24iLCJvd25lciI6InN1c2FuIiwic3RhcnQiOiIyMDIyLTAzLTAxIiwic3RvcCI6IjIwMjItMDUtMDEiLCJkZXBlbmRlbmN5IjoiZXhhbXBsZSJ9LHsiaWQiOjMsIm5hbWUiOiJHaXRIdWIgaXNzdWUgc3VwcG9ydCIsIm93bmVyIjoidGVhbSIsInN0YXJ0IjoiMjAyMi0wMy0wMSIsInN0b3AiOiIyMDIyLTA0LTAxIiwiaXNPbmdvaW5nIjp0cnVlfSx7ImlkIjoxLCJuYW1lIjoiU3VwcG9ydCBwcm9kdWN0IHRlYW0gaW50ZWdyYXRpb24iLCJvd25lciI6ImJ2YXVnaG4iLCJzdGFydCI6IjIwMjItMDMtMTUiLCJzdG9wIjoiMjAyMi0wNS0xNSIsImlzT25nb2luZyI6dHJ1ZSwiZGVwZW5kZW5jeSI6ImV4YW1wbGUifV0sInRlYW0iOnsiYnZhdWdobiI6eyJhdmF0YXIiOm51bGwsIm5hbWUiOiJCcmlhbiJ9LCJ0ZWFtIjp7ImF2YXRhciI6bnVsbCwibmFtZSI6IlVuY2xhaW1lZCJ9fX0`,
  years: `eyJ0YXNrcyI6W3sic3RhcnQiOiIyMDIyLTAxLTAxIiwic3RvcCI6IjIwMjItMTItMzEiLCJuYW1lIjoiMjAyMiIsIm93bmVyIjoiT3RoZXIgdGVhbSJ9LHsic3RhcnQiOiIyMDIyLTAxLTAxIiwic3RvcCI6IjIwMjItMDYtMzAiLCJuYW1lIjoiSDEgMjAyMiJ9LHsic3RhcnQiOiIyMDIyLTA3LTAxIiwic3RvcCI6IjIwMjItMTItMzEiLCJuYW1lIjoiSDIgMjAyMiJ9LHsic3RhcnQiOiIyMDIzLTAxLTAxIiwic3RvcCI6IjIwMjMtMDYtMzAiLCJuYW1lIjoiSDEgMjAyMyJ9XSwidGVhbSI6e319`,
};
