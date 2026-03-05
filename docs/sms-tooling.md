# SMS Tooling

Automated SMS sending via Twilio, built for the 2026 KCRHA PIT Count bulk send (~3,700 messages).

All commands are run from `server/`:

```bash
npm run sms -- <command> [options]
```

Requires a valid `server/.env` with Twilio credentials (see `.env.example`).

---

## Commands

### `send` — Single message

```bash
# Using a YAML template
npm run sms -- send "(206) 555-1234" --template gift_card --var surveyCode=ABC123

# Using a raw message body
npm run sms -- send "+15551234567" --body "Hello from the PIT Count team!"
```

Sends a single SMS to one recipient. Phone numbers are normalized to E.164 format automatically (e.g. `(206) 555-1234` → `+12065551234`).

---

### `send-bulk` — Bulk send from database

```bash
npm run sms -- send-bulk --template gift_card
npm run sms -- send-bulk --template gift_card --location 507f1f77bcf86cd799439011
npm run sms -- send-bulk --template gift_card --dry-run
```

Sends to all survey respondents who provided a phone number. Template variables (`surveyCode`, etc.) are auto-populated from each respondent's survey record. Use `--location` to scope to a single site. Use `--dry-run` to preview recipients and message text without sending.

**Requires a database connection.**

Rate limit: 1.1 s between messages (Twilio long-code limit: 1 msg/sec).

---

### `send-csv` — Bulk send from external CSV

```bash
npm run sms -- send-csv --file ~/data/gift_cards.csv --template gift_card_redeem
npm run sms -- send-csv --file ~/data/gift_cards.csv --template gift_card_redeem --dry-run
```

Sends to recipients listed in an external CSV file. Designed for gift card redemption sends where the recipient list comes from an external system (e.g. Tango).

**Does not require a database connection.**

#### CSV format

The CSV must have these columns (header names are **case-sensitive**):

| Column | Required | Notes |
|---|---|---|
| `surveyCode` | Yes | Respondent's survey code (used in template variables) |
| `phone` | Yes | Any US phone format — normalized to E.164 automatically |
| `amount` | Yes | Numeric gift card value (e.g. `25`, `50.00`) |
| `Reward Code` | Yes | Gift card redemption code. Also accepts `RewardCode` or `rewardCode` |

Example:

```csv
surveyCode,phone,amount,Reward Code
ABC123,(206) 555-1234,25,TANGO-XYZ-001
DEF456,2065559012,50,TANGO-XYZ-002
```

Preprocessing:

- Strips UTF-8 BOM (common in Excel exports)
- Deduplicates exact duplicate rows
- Filters out rows where `amount` is zero, empty, or non-numeric (`Number(amount) > 0`)
- Filters out rows with an empty Reward Code
- Formats `amount` as `$N` in the message (e.g. `25` → `$25`)

Rate limit: 1.1 s between messages.

---

### `list-recipients` — Preview recipients

```bash
npm run sms -- list-recipients
npm run sms -- list-recipients --location 507f1f77bcf86cd799439011
```

Lists all survey respondents with a phone number. Useful for verifying the recipient list before a bulk send.

**Requires a database connection.**

---

### `logs` — List send logs

```bash
npm run sms -- logs
```

Lists all CSV log files in `sms-logs/` with row counts.

---

### `fetch-logs` — Recover a send log from Twilio

```bash
npm run sms -- fetch-logs
npm run sms -- fetch-logs --date 2026-02-19
```

Fetches all outbound messages from the Twilio API and writes a recovery CSV to `sms-logs/sms-log-recovered-DATE.csv`. Filters `direction === outbound-api` to exclude inbound replies. Use `--date YYYY-MM-DD` to scope to a single day (UTC).

Useful when a send log was lost or the send was done from another machine.

---

### `check-status` — Enrich logs with delivery status

```bash
npm run sms -- check-status
npm run sms -- check-status --log-file sms-log-2026-02-19-gift_card_notice.csv
```

Fetches the latest delivery status from Twilio for every message SID in the log files. Writes a new enriched CSV alongside each source file (original is never modified):

```
sms-log-2026-02-19-gift_card_notice.csv          ← original, untouched
sms-log-2026-02-19-gift_card_notice-updated-2026-02-19.csv  ← enriched
```

Enriched columns added: `dateSent`, `price`, `priceUnit`, `errorCode`, `errorMessage`.

Prints a delivery stats summary per file:

```
=== Delivery Statistics ===
File: sms-log-2026-02-19-gift_card_notice.csv (3708 messages)
  delivered        3200  (86.3%)
  undelivered       358   (9.7%)
  failed            150   (4.0%)
Updated log: sms-log-2026-02-19-gift_card_notice-updated-2026-02-19.csv
```

Progress is printed every 100 records. Use `--log-file` to limit to a single file.

---

## SMS Templates

Templates are YAML files in `server/src/scripts/sms-templates/`. Variables are written as `{variableName}`.

### `gift_card.yaml`
Sent to respondents after completing the survey. Variable: `{surveyCode}`.

### `gift_card_redeem.yaml`
Sent with gift card redemption codes. Variables: `{surveyCode}`, `{amount}`, `{rewardCode}`.

---

## Logging

All sends are logged to `server/src/scripts/sms-logs/` (gitignored — never committed).

Log columns:

| Column | Description |
|---|---|
| `surveyCode` | Respondent's survey code |
| `phone` | Normalized E.164 phone number |
| `templateName` | Template used (or `(raw)`) |
| `smsText` | Full message text sent |
| `datetime` | ISO timestamp of send |
| `status` | Twilio status at send time (e.g. `queued`) |
| `twilioSid` | Twilio message SID for later lookup |
| `numSegments` | Billing segments (160 chars = 1 segment) |

---

## Environment Variables

Add these to `server/.env` (see `server/.env.example`):

```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+12065550000
```

---

## Design Decisions

**Why a CLI script instead of an API endpoint?**
Bulk SMS sends are operational, one-off tasks run by staff — not triggered by app users. A CLI keeps it out of the web app's attack surface and avoids accidental triggers.

**Why 1.1 s rate limiting?**
Twilio long-code numbers are limited to 1 message/second. Staying at 1.1 s gives a small buffer to avoid rate-limit errors under jitter.

**Why `csv-parse` instead of a hand-rolled parser?**
The gift card redemption CSVs contain multi-line message bodies (embedded `\n`). The previous `split('\n')` approach silently dropped those records. `csv-parse` handles RFC 4180 quoted multi-line fields correctly.

**Why capture `numSegments` at send time?**
Twilio billing is per segment (160 chars). Capturing it immediately from the send response makes cost analysis possible without a separate Twilio API call later.

**Why never modify original log files?**
Log files are the audit trail. `check-status` writes a new `*-updated-DATE.csv` instead of overwriting, so the original send record is always preserved.

**Why does `send-csv` not require a database connection?**
The gift card recipient list requires deduplication, removal of test entries, and an external list of Tango reward links — processing that happens outside the RDS database. In the future, this process should be automated for prompt delivery of gift cards. Keeping `send-csv` DB-free means it can be run from any machine with Twilio credentials, without needing a MongoDB connection.
