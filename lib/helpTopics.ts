export interface HelpTopic {
  slug: string;
  title: string;
  description: string;
  icon: string;
  platforms: ('web' | 'ios' | 'android')[];
  group: string;
}

export const HELP_GROUPS = [
  'Getting started',
  'Managing your apiary',
  'Inspections & data',
  'Statistics',
  'Community & hornets',
  'Account & settings',
];

export const HELP_TOPICS: HelpTopic[] = [
  {
    slug: 'getting-started',
    title: 'Getting started with HivePulse',
    description: 'An overview of HivePulse — what it does, who it is for, and how the web app, iOS app, and Android app work together.',
    icon: 'fa-rocket',
    platforms: ['web', 'ios', 'android'],
    group: 'Getting started',
  },
  {
    slug: 'apiaries',
    title: 'Apiaries',
    description: 'Create and manage apiaries — named locations that group your hives. Set a GPS location to appear on the community map.',
    icon: 'fa-map-location-dot',
    platforms: ['web', 'ios', 'android'],
    group: 'Managing your apiary',
  },
  {
    slug: 'hives',
    title: 'Hives',
    description: 'Add hives to an apiary, choose a hive type (Langstroth, Dadant, Top Bar, Warré), and link a QR code for fast field access.',
    icon: 'fa-hexagon',
    platforms: ['web', 'ios', 'android'],
    group: 'Managing your apiary',
  },
  {
    slug: 'qr-codes',
    title: 'QR Codes',
    description: 'Generate printable QR code batches, attach them to hive boxes, and scan them to open the correct hive instantly.',
    icon: 'fa-qrcode',
    platforms: ['web', 'ios', 'android'],
    group: 'Managing your apiary',
  },
  {
    slug: 'custom-fields',
    title: 'Custom inspection fields',
    description: 'Extend the built-in inspection form with your own fields — text, numbers, checkboxes, dropdowns — scoped to your account or a specific apiary.',
    icon: 'fa-sliders',
    platforms: ['web'],
    group: 'Managing your apiary',
  },
  {
    slug: 'inspections',
    title: 'Logging an inspection',
    description: 'Record every visit to a hive: varroa count, colony mood, queen sighting, brood frames, honey frames, weight, treatments, and more.',
    icon: 'fa-clipboard-list',
    platforms: ['web', 'ios', 'android'],
    group: 'Inspections & data',
  },
  {
    slug: 'data-export',
    title: 'Exporting your data',
    description: 'Download all inspection records for an apiary as JSON or CSV to share with your veterinarian, researcher, or national beekeeping authority.',
    icon: 'fa-file-export',
    platforms: ['web', 'ios', 'android'],
    group: 'Inspections & data',
  },
  {
    slug: 'hive-stats',
    title: 'Hive statistics',
    description: 'Understand your hive health over time with varroa trend charts, mood distribution, queen-seen rate, brood frame counts, and inspection intervals.',
    icon: 'fa-chart-line',
    platforms: ['web', 'ios', 'android'],
    group: 'Statistics',
  },
  {
    slug: 'community-stats',
    title: 'Community stats (Members)',
    description: 'Compare your apiary against the HivePulse community — average varroa counts, good-mood rates, brood frame counts, and inspection intervals across all public apiaries.',
    icon: 'fa-users',
    platforms: ['web', 'ios', 'android'],
    group: 'Statistics',
  },
  {
    slug: 'hornet-tracker',
    title: 'Hornet Tracker',
    description: 'Report Asian hornet catches and nest sightings, vote on community photo submissions, and view the live nest map.',
    icon: 'fa-bug',
    platforms: ['web'],
    group: 'Community & hornets',
  },
  {
    slug: 'hornet-traps',
    title: 'Hornet Traps',
    description: 'Register a named physical trap, log daily catch counts using its 8-character access code, and search for traps near your location.',
    icon: 'fa-location-crosshairs',
    platforms: ['web', 'ios', 'android'],
    group: 'Community & hornets',
  },
  {
    slug: 'reminders',
    title: 'Inspection reminders',
    description: 'Set a reminder interval and season window so HivePulse can notify you when a hive is overdue for an inspection.',
    icon: 'fa-bell',
    platforms: ['ios', 'android'],
    group: 'Account & settings',
  },
  {
    slug: 'account',
    title: 'Account & profile',
    description: 'Update your display name and language, change your password, and permanently delete your account and all associated data.',
    icon: 'fa-circle-user',
    platforms: ['web', 'ios', 'android'],
    group: 'Account & settings',
  },
];

export function getTopicBySlug(slug: string): HelpTopic | undefined {
  return HELP_TOPICS.find(t => t.slug === slug);
}
