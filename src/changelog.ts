export interface ChangelogEntry {
    version: string;
    date: string;
    changes: { category: string; items: string[] }[];
}

export const changelog: ChangelogEntry[] = [
   {
    version: '0.1.0',
    date: '2026-03-11',
    changes: [{
        category: 'Added',
        items: [
            'Initial Release'
        ]
   }]
   }
];
