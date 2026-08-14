// Fixed reviewer identities for the MOU module. Brenda and Mitch already have separate
// admin logins (same pattern as the rest of the app), so this map is what drives both
// notification routing and stage-based email content — mirrored in src/mouConfig.js for
// the client side. Keep both in sync if either address ever changes.
export const MOU_REVIEWERS = {
  brenda: { email: 'bdemers@franklinnh.gov', name: 'Brenda Demers' },
  cityManager: { email: 'citymgr@franklinnh.gov', name: 'Mitch Kloewer' },
}
