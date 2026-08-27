// constants/links.ts
// EXTERNAL URLs the app sends people to. One file, because a link that leaves
// the app is the kind of constant that gets pasted into two places and then
// only updated in one.
//
// Social handles are NOT here — they live in data/socials.ts, which builds
// both a web URL and a native deep link per account. This file is for the
// church's own web properties.

/** The church's website. Verified live. */
export const CHURCH_WEBSITE = 'https://theolivebrookchurch.org';

/**
 * GIVING. Verified against the live site rather than guessed: the page exists,
 * is titled "Give - The OliveBrook Church", and carries the church's real
 * Flutterwave links and two bank accounts (Unity 0044367730, GTB 0479082775,
 * both "olivebrook church").
 *
 * DELIBERATELY THE WEB PAGE, not a Flutterwave link and not the account
 * numbers rendered in-app. Three reasons, in order of how much they matter:
 *
 *   1. Payment details must have exactly one source of truth, and it must be
 *      one the church can change without shipping an app update. An account
 *      number frozen into a binary is a number that keeps collecting money
 *      after the account closes.
 *   2. Reproducing bank details inside the app makes the APP the thing people
 *      trust for them. That is the shape of every payment-redirection scam,
 *      and a church app is a soft target for a lookalike build.
 *   3. App-store rules treat in-app collection of donations differently from
 *      linking out to a charity's own site. Linking out is the settled path.
 */
export const GIVE_URL = 'https://theolivebrookchurch.org/give/';

/**
 * WHAT "SHARE THIS APP" SHARES.
 *
 * >>> UPDATE ON PUBLISH <<<
 * The app is not on either store yet — app.json declares the package name
 * com.kazu_m.tobca but nothing has been submitted, so
 * play.google.com/store/apps/details?id=com.kazu_m.tobca is a 404 today.
 * Sharing it would send everyone who receives the message to an error page,
 * which is worse than sharing nothing.
 *
 * So until launch this shares the CHURCH'S SITE — a real page that tells a
 * stranger what OliveBrook is, which is the actual intent behind sharing the
 * app. On publish, change this one constant to the store listing.
 */
export const SHARE_URL = CHURCH_WEBSITE;

/** The message the share sheet is seeded with. */
export const SHARE_MESSAGE =
  `The OliveBrook Church — messages, prayer resources and the daily reading plan.\n${SHARE_URL}`;
