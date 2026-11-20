import type { State, Creator, PortfolioItem } from './types'

const raw: [string, string, string, string, string[], number, number, string][] = [
  ['Priya Mehta', 'priyamehta', 'Beauty', 'Mumbai', ['Instagram', 'YouTube'], 182000, 5.4, 'Skincare routines and honest product reviews.'],
  ['Arjun Rao', 'arjuneats', 'Food', 'Bengaluru', ['Instagram', 'YouTube'], 96000, 6.1, 'Street food trails and quick home recipes.'],
  ['Meera Kapoor', 'meerafit', 'Fitness', 'Delhi', ['Instagram'], 240000, 4.2, 'Strength training for busy people.'],
  ['Kabir Shah', 'kabirtech', 'Tech', 'Pune', ['YouTube'], 310000, 3.8, 'Gadget reviews without the hype.'],
  ['Sana Iqbal', 'sanawanders', 'Travel', 'Hyderabad', ['Instagram', 'TikTok'], 128000, 5.0, 'Slow travel and weekend getaways.'],
  ['Rohan Verma', 'rohanrides', 'Automotive', 'Jaipur', ['YouTube'], 74000, 4.9, 'Bike tours and riding gear tests.'],
  ['Ishita Nair', 'ishitastyles', 'Fashion', 'Kochi', ['Instagram'], 156000, 5.7, 'Sustainable fashion and thrift hauls.'],
  ['Dev Malhotra', 'devplays', 'Gaming', 'Chandigarh', ['YouTube', 'Twitch'], 205000, 4.4, 'Indie game spotlights and live streams.'],
  ['Tara Joshi', 'tarahome', 'Home', 'Ahmedabad', ['Instagram', 'Pinterest'], 88000, 6.3, 'Small-space decor on a budget.'],
  ['Neil Fernandes', 'neilmoney', 'Finance', 'Goa', ['YouTube', 'LinkedIn'], 142000, 4.6, 'Personal finance explained simply.'],
  ['Aditi Sen', 'aditiglow', 'Beauty', 'Kolkata', ['Instagram', 'YouTube'], 67000, 6.8, 'Everyday makeup tutorials.'],
  ['Zoya Khan', 'zoyabakes', 'Food', 'Lucknow', ['Instagram', 'TikTok'], 119000, 5.5, 'Baking, desserts and cafe reviews.'],
]

export const seed = (): State => ({
  session: null,
  creators: raw.map(([name, handle, niche, location, platforms, followers, engagement, bio], i): Creator => ({
    id: `c${i + 1}`, name, handle, niche, location: `${location}, India`, platforms, followers, engagement, bio, verified: i % 3 === 0, status: 'active',
  })),
  brands: [
    { id: 'b1', name: 'Nova Beauty', industry: 'Beauty', status: 'active' },
    { id: 'b2', name: 'Trailmark Outdoors', industry: 'Outdoor', status: 'active' },
    { id: 'b3', name: 'FreshBowl', industry: 'Food', status: 'active' },
    { id: 'b4', name: 'Pixel Forge', industry: 'Tech', status: 'active' },
  ],
  campaigns: [
    { id: 'k1', brandId: 'b1', name: 'Summer Glow', description: 'Launch of our SPF 50 sunscreen range, built on authentic daily-use content.', budget: 250000, deadline: '2026-12-15', status: 'in_review', deliverables: ['Instagram Reel', 'Story Set', 'Campaign Report'] },
    { id: 'k2', brandId: 'b1', name: 'Winter Skin Reset', description: 'Seasonal moisturiser campaign built around honest long-form reviews.', budget: 150000, deadline: '2027-01-31', status: 'draft', deliverables: ['YouTube Review'] },
    { id: 'k3', brandId: 'b2', name: 'Trail Season', description: 'Showcase our new trekking range on real weekend trails.', budget: 400000, deadline: '2026-12-01', status: 'active', deliverables: ['Vlog', 'Gear Review'] },
    { id: 'k4', brandId: 'b3', name: 'FreshBowl Launch', description: 'Recipe content featuring the FreshBowl meal kit.', budget: 180000, deadline: '2026-10-15', status: 'completed', deliverables: ['Recipe Reel'] },
    { id: 'k5', brandId: 'b4', name: 'Pixel Forge Beta', description: 'Hands-on review of the Pixel Forge creator laptop.', budget: 300000, deadline: '2026-09-30', status: 'completed', deliverables: ['Review Video'] },
  ],
  collabs: [
    { id: 'l1', campaignId: 'k1', creatorId: 'c1', status: 'pending', invitedAt: '2026-10-24T10:00:00Z' },
    { id: 'l2', campaignId: 'k1', creatorId: 'c11', status: 'active', invitedAt: '2026-10-10T09:00:00Z' },
    { id: 'l3', campaignId: 'k3', creatorId: 'c1', status: 'active', invitedAt: '2026-10-05T09:00:00Z' },
    { id: 'l4', campaignId: 'k4', creatorId: 'c2', status: 'completed', invitedAt: '2026-09-01T09:00:00Z' },
    { id: 'l5', campaignId: 'k1', creatorId: 'c5', status: 'rejected', invitedAt: '2026-10-12T09:00:00Z' },
    { id: 'l6', campaignId: 'k5', creatorId: 'c4', status: 'completed', invitedAt: '2026-08-20T09:00:00Z' },
  ],
  deliverables: [
    { id: 'd1', collabId: 'l2', title: 'Instagram Reel', status: 'submitted', url: 'https://example.com/reel-aditi', notes: 'First cut with captions.' },
    { id: 'd2', collabId: 'l2', title: 'Story Set', status: 'pending' },
    { id: 'd3', collabId: 'l2', title: 'Campaign Report', status: 'pending' },
    { id: 'd4', collabId: 'l3', title: 'Vlog', status: 'revision_requested', url: 'https://example.com/trail-vlog', feedback: 'Show the product close-up within the first 10 seconds.' },
    { id: 'd5', collabId: 'l3', title: 'Gear Review', status: 'pending' },
    { id: 'd6', collabId: 'l4', title: 'Recipe Reel', status: 'approved', url: 'https://example.com/recipe-reel' },
    { id: 'd7', collabId: 'l6', title: 'Review Video', status: 'approved', url: 'https://example.com/pixel-review' },
  ],
  messages: [
    { id: 'm1', collabId: 'l2', from: 'brand', text: 'Loved the first cut. Can we try a tighter intro?', at: '2026-10-25T09:30:00Z' },
    { id: 'm2', collabId: 'l2', from: 'creator', text: 'Sure, I will send a revised version tomorrow.', at: '2026-10-25T10:10:00Z' },
    { id: 'm3', collabId: 'l3', from: 'brand', text: 'Thanks for the vlog. Our notes are in the review.', at: '2026-10-26T12:00:00Z' },
  ],
  notifications: [
    { id: 'n1', to: 'c1', text: 'Nova Beauty invited you to Summer Glow', link: '/creator/collaborations/l1', read: false, at: '2026-10-24T10:00:00Z' },
    { id: 'n2', to: 'c1', text: 'Trailmark Outdoors requested changes on “Vlog”', link: '/creator/collaborations/l3', read: false, at: '2026-10-26T12:00:00Z' },
    { id: 'n3', to: 'b1', text: 'Aditi Sen submitted “Instagram Reel”', link: '/brand/campaigns/k1', read: false, at: '2026-10-25T09:00:00Z' },
    { id: 'n4', to: 'admin', text: '3 reports need review', link: '/admin/reports', read: false, at: '2026-10-26T08:00:00Z' },
  ],
  reports: [
    { id: 'r1', target: 'Creator: Dev Malhotra', reason: 'Missing sponsorship disclosure', priority: 'high', status: 'open' },
    { id: 'r2', target: 'Campaign: Trail Season', reason: 'Repeated unsolicited invitations', priority: 'medium', status: 'open' },
    { id: 'r3', target: 'Brand: FreshBowl', reason: 'Slow replies to creators', priority: 'low', status: 'open' },
  ],
  portfolio: raw.flatMap(([, , niche, , platforms], i) =>
    ['Launch highlights', 'Behind the scenes', 'Audience favourite'].map((t, j): PortfolioItem => ({
      id: `p${i}-${j}`, creatorId: `c${i + 1}`, title: `${niche}: ${t}`, description: `A ${niche.toLowerCase()} piece made for an earlier brand partner.`,
      category: niche, platform: platforms[j % platforms.length], url: 'https://example.com/portfolio', views: (i + 3) * (j + 2) * 4100,
    }))),
  saved: ['c11'],
})
