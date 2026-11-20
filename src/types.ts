export type Role = 'brand' | 'creator' | 'admin'
export type AccountStatus = 'active' | 'suspended'
export type CampaignStatus = 'draft' | 'active' | 'in_review' | 'completed'
export type CollabStatus = 'pending' | 'accepted' | 'rejected' | 'active' | 'completed'
export type DeliverableStatus = 'pending' | 'submitted' | 'in_review' | 'revision_requested' | 'approved'

export interface Creator { id: string; name: string; handle: string; niche: string; location: string; platforms: string[]; followers: number; engagement: number; bio: string; verified: boolean; status: AccountStatus; rateMin?: number; rateMax?: number; profileCompleted?: boolean; metricsSelfReported?: boolean }
export interface Brand { id: string; name: string; industry: string; status: AccountStatus }
export interface Campaign { id: string; brandId: string; name: string; description: string; budget: number; deadline: string; status: CampaignStatus; deliverables: string[] }
export interface Collab { id: string; campaignId: string; creatorId: string; status: CollabStatus; invitedAt: string }
export interface Deliverable { id: string; collabId: string; title: string; status: DeliverableStatus; url?: string; notes?: string; feedback?: string }
export interface Message { id: string; collabId: string; from: 'brand' | 'creator'; text: string; at: string }
export interface Notice { id: string; to: string; text: string; link: string; read: boolean; at: string }
export interface Report { id: string; target: string; reason: string; priority: 'low' | 'medium' | 'high'; status: 'open' | 'resolved' | 'dismissed' }
export interface PortfolioItem { id: string; creatorId: string; title: string; description: string; category: string; platform: string; url: string; views: number }
export interface Session { role: Role; userId: string }
export interface State {
  session: Session | null
  creators: Creator[]; brands: Brand[]; campaigns: Campaign[]; collabs: Collab[]
  deliverables: Deliverable[]; messages: Message[]; notifications: Notice[]; reports: Report[]
  saved: string[]
  portfolio: PortfolioItem[]
}
