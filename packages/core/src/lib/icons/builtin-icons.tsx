import { iconRegistry } from "./icon-registry"

// ---------------------------------------------------------------------------
// Shared wrapper — colored rounded-square background + white icon
// ---------------------------------------------------------------------------

type SVGProps = React.SVGProps<SVGSVGElement> & { children: React.ReactNode }

const Icon = ({ bg, children, ...props }: SVGProps & { bg: string }) => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5 flex-shrink-0" {...props}>
    <rect width="24" height="24" rx="6" fill={bg} />
    {children}
  </svg>
)

// ---------------------------------------------------------------------------
// Module icons
// ---------------------------------------------------------------------------

export const HomeIcon = () => (
  <Icon bg="#F59E0B">
    <path d="M4 10.5L12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9.5Z" fill="white" fillOpacity={0.25} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M9 21v-5h6v5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const DashboardIcon = () => (
  <Icon bg="#6366F1">
    {/* Bar chart — matches 📊 */}
    <path d="M3 20h18" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    <rect x="4"  y="14" width="4" height="6" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="10" y="8"  width="4" height="12" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="16" y="4"  width="4" height="16" rx="0.5" fill="white" fillOpacity={0.8} />
  </Icon>
)

export const AccountingIcon = () => (
  <Icon bg="#10B981">
    {/* Knot */}
    <path d="M10 6c0-1.1.9-2 2-2s2 .9 2 2" stroke="white" strokeWidth={1.5} strokeLinecap="round" fill="none" />
    {/* Bag body */}
    <path d="M7 10c-2 1.3-3 3.2-3 5 0 3.3 3.6 6 8 6s8-2.7 8-6c0-1.8-1-3.7-3-5H7Z" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    {/* $ vertical bar */}
    <path d="M12 12v6" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    {/* $ S-curve */}
    <path d="M14 13.5a2 2 0 0 0-2-1.5 2 2 0 0 0 0 4 2 2 0 0 1 0 4 2 2 0 0 1-2-1.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" fill="none" />
  </Icon>
)

export const BuyingIcon = () => (
  <Icon bg="#3B82F6">
    {/* Handle */}
    <path d="M3 4h2" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    {/* Cart basket */}
    <path d="M5 4l1.8 10h11.4l1.8-7H8" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    {/* Wheels */}
    <circle cx="10" cy="19" r="1.5" fill="white" />
    <circle cx="17" cy="19" r="1.5" fill="white" />
  </Icon>
)

export const SellingIcon = () => (
  <Icon bg="#F97316">
    <path d="M12.5 3H19a1 1 0 0 1 1 1v6.5a1 1 0 0 1-.3.71l-8 8a1 1 0 0 1-1.41 0l-6.5-6.5a1 1 0 0 1 0-1.41l8-8A1 1 0 0 1 12.5 3Z" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <circle cx="16.5" cy="7.5" r="1.5" fill="white" />
  </Icon>
)

export const StockIcon = () => (
  <Icon bg="#8B5CF6">
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8Z" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="m3.3 7 8.7 5 8.7-5M12 22V12" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const AssetsIcon = () => (
  <Icon bg="#64748B">
    <path d="M3 21V10l9-7 9 7v11H3Z" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M9 21v-5h6v5" stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <rect x="10" y="10" width="2" height="2" rx="0.5" fill="white" />
    <rect x="13" y="10" width="2" height="2" rx="0.5" fill="white" />
  </Icon>
)

export const HRIcon = () => (
  <Icon bg="#EC4899">
    <circle cx="9" cy="8" r="3.5" fill="white" fillOpacity={0.25} stroke="white" strokeWidth={1.5} />
    <path d="M3 21v-1a6 6 0 0 1 6-6h.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    <path d="M15 21v-1a6 6 0 0 0-6-6H6a6 6 0 0 0-6 6v1" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    <path d="M17 11a3.5 3.5 0 0 0 0-7" stroke="white" strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
    <path d="M23 21v-1a6 6 0 0 0-4-5.66" stroke="white" strokeWidth={1.5} strokeLinecap="round" opacity={0.7} />
  </Icon>
)

export const PayrollIcon = () => (
  <Icon bg="#059669">
    <rect x="2" y="6" width="20" height="13" rx="2" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} />
    <path d="M2 11h20" stroke="white" strokeWidth={1.5} />
    <rect x="5" y="14" width="4" height="2" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="11" y="14" width="6" height="2" rx="0.5" fill="white" fillOpacity={0.4} />
  </Icon>
)

export const CRMIcon = () => (
  <Icon bg="#EF4444">
    {/* Handshake — matches 🤝 */}
    {/* Left arm */}
    <path d="M2 14h4" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
    {/* Right arm */}
    <path d="M22 14h-4" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
    {/* Left hand fingers curling up */}
    <path d="M6 14l2.5-3.5 1.5 1" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Right hand fingers curling up */}
    <path d="M18 14l-2.5-3.5-1.5 1" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Clasped palms */}
    <path d="M8 14h8c0 2-2 4-4 4s-4-2-4-4Z" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
  </Icon>
)

export const ProjectIcon = () => (
  <Icon bg="#7C3AED">
    <rect x="3" y="4" width="18" height="17" rx="2" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} />
    <path d="M8 10l2 2 4-4M8 15l2 2 4-4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" fill="white" fillOpacity={0.5} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
  </Icon>
)

export const SupportIcon = () => (
  <Icon bg="#0EA5E9">
    {/* Headband arc */}
    <path d="M6 13a6 6 0 0 1 12 0" stroke="white" strokeWidth={2} fill="none" strokeLinecap="round" />
    {/* Left ear cup */}
    <rect x="3" y="13" width="4" height="5.5" rx="2" fill="white" fillOpacity={0.35} stroke="white" strokeWidth={1.5} />
    {/* Right ear cup */}
    <rect x="17" y="13" width="4" height="5.5" rx="2" fill="white" fillOpacity={0.35} stroke="white" strokeWidth={1.5} />
  </Icon>
)

export const QualityIcon = () => (
  <Icon bg="#16A34A">
    <path d="M12 3L3 7v5c0 5 4 9 9 10 5-1 9-5 9-10V7l-9-4Z" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M8.5 12l2.5 2.5 5-5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const WebsiteIcon = () => (
  <Icon bg="#06B6D4">
    <circle cx="12" cy="12" r="8" fill="white" fillOpacity={0.15} stroke="white" strokeWidth={1.5} />
    <path d="M2 12h20M12 4a14 14 0 0 1 3.5 8A14 14 0 0 1 12 20a14 14 0 0 1-3.5-8A14 14 0 0 1 12 4Z" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const UsersIcon = () => (
  <Icon bg="#6366F1">
    <circle cx="9" cy="8" r="3.5" fill="white" fillOpacity={0.25} stroke="white" strokeWidth={1.5} />
    <path d="M1 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    <path d="M17 11a3.5 3.5 0 0 0 0-7" stroke="white" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
    <path d="M23 21v-1a6 6 0 0 0-4-5.66" stroke="white" strokeWidth={1.5} strokeLinecap="round" opacity={0.6} />
  </Icon>
)

export const SettingsIcon = () => (
  <Icon bg="#94A3B8">
    <path d="M12.22 3h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V21a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V5a2 2 0 0 0-2-2Z" stroke="white" strokeWidth={1.5} />
    <circle cx="12" cy="12" r="3" fill="white" fillOpacity={0.4} stroke="white" strokeWidth={1.5} />
  </Icon>
)

export const IntegrationIcon = () => (
  <Icon bg="#A855F7">
    <circle cx="5" cy="12" r="2.5" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} />
    <circle cx="19" cy="6" r="2.5" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} />
    <circle cx="19" cy="18" r="2.5" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} />
    <path d="M7.5 12h4M11.5 12l5.5-5M11.5 12l5.5 5" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const FileIcon = () => (
  <Icon bg="#3B82F6">
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9L14 3Z" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M14 3v6h6" stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M8 13h8M8 17h5" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const ToolIcon = () => (
  <Icon bg="#F97316">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" fill="white" fillOpacity={0.25} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
  </Icon>
)

export const ManufacturingIcon = () => (
  <Icon bg="#78716C">
    <path d="M2 21V10l5-4v4l5-4v4l5-4v15H2Z" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M19 21V8h3v13" stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M6 15h2M10 15h2M14 15h2" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const ReportsIcon = () => (
  <Icon bg="#EF4444">
    <path d="M3 4v17h18" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    <path d="M7 16l4-5 4 3 4-6" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="7" cy="16" r="1.5" fill="white" />
    <circle cx="11" cy="11" r="1.5" fill="white" />
    <circle cx="15" cy="14" r="1.5" fill="white" />
    <circle cx="19" cy="8" r="1.5" fill="white" />
  </Icon>
)

export const LogisticsIcon = () => (
  <Icon bg="#0EA5E9">
    <rect x="1" y="4" width="13" height="12" rx="1" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} />
    <path d="M14 8h4l3 3v5h-7V8Z" fill="white" fillOpacity={0.25} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <circle cx="5.5" cy="18.5" r="1.5" fill="white" stroke="white" strokeWidth={1} />
    <circle cx="17.5" cy="18.5" r="1.5" fill="white" stroke="white" strokeWidth={1} />
    <path d="M1 16h13" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const AnalyticsIcon = () => (
  <Icon bg="#8B5CF6">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="white" fillOpacity={0.15} stroke="white" strokeWidth={1.5} />
    <rect x="6" y="13" width="3" height="5" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="10.5" y="9" width="3" height="9" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="15" y="6" width="3" height="12" rx="0.5" fill="white" fillOpacity={0.8} />
  </Icon>
)

export const WorkflowIcon = () => (
  <Icon bg="#A855F7">
    <circle cx="5" cy="5" r="2.5" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} />
    <circle cx="19" cy="5" r="2.5" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} />
    <circle cx="12" cy="19" r="2.5" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} />
    <path d="M7.5 5h9M17 7l-4 10M7 7l4 10" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const InvoiceIcon = () => (
  <Icon bg="#10B981">
    <path d="M4 3h12l4 4v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3Z" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M16 3v4h4" stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M8 11h8M8 14h5M8 17h6" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const SecurityIcon = () => (
  <Icon bg="#EF4444">
    <path d="M12 3L3 7v5c0 5 4 9 9 10 5-1 9-5 9-10V7l-9-4Z" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <rect x="9" y="11" width="6" height="5" rx="1" stroke="white" strokeWidth={1.5} />
    <path d="M10 11V9a2 2 0 0 1 4 0v2" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const BuildIcon = () => (
  <Icon bg="#F59E0B">
    {/* hammer head */}
    <path d="M14.5 9.5l-5 5-3.5-3.5 5-5 3.5 3.5Z" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    {/* handle */}
    <path d="M9.5 14.5L4 20" stroke="white" strokeWidth={2.5} strokeLinecap="round" />
    {/* claw arc */}
    <path d="M11.5 7.5l1.5-1.5a3 3 0 0 1 4.24 4.24L15.5 11.5" stroke="white" strokeWidth={1.5} strokeLinecap="round" fill="none" />
  </Icon>
)

export const BankIcon = () => (
  <Icon bg="#475569">
    {/* pediment */}
    <path d="M12 3L3 9h18L12 3Z" fill="white" fillOpacity={0.35} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    {/* columns */}
    <rect x="5"  y="9" width="2.5" height="9" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="9"  y="9" width="2.5" height="9" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="13" y="9" width="2.5" height="9" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="17" y="9" width="2.5" height="9" rx="0.5" fill="white" fillOpacity={0.8} />
    {/* base */}
    <rect x="3" y="18" width="18" height="2.5" rx="0.5" fill="white" fillOpacity={0.6} />
  </Icon>
)

export const FinanceIcon = () => (
  <Icon bg="#059669">
    {/* stacked coins */}
    <ellipse cx="12" cy="16" rx="6.5" ry="2" fill="white" fillOpacity={0.4} stroke="white" strokeWidth={1.5} />
    <path d="M5.5 16v-2c0-1.1 2.9-2 6.5-2s6.5.9 6.5 2v2" stroke="white" strokeWidth={1.5} />
    <ellipse cx="12" cy="11" rx="6.5" ry="2" fill="white" fillOpacity={0.4} stroke="white" strokeWidth={1.5} />
    <path d="M5.5 11V9c0-1.1 2.9-2 6.5-2s6.5.9 6.5 2v2" stroke="white" strokeWidth={1.5} />
    <ellipse cx="12" cy="7" rx="6.5" ry="2" fill="white" fillOpacity={0.6} stroke="white" strokeWidth={1.5} />
  </Icon>
)

export const CalendarIcon = () => (
  <Icon bg="#3B82F6">
    <rect x="3" y="5" width="18" height="16" rx="2" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} />
    <path d="M3 10h18" stroke="white" strokeWidth={1.5} />
    <path d="M8 3v4M16 3v4" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    <rect x="6"   y="13" width="3" height="3" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="10.5" y="13" width="3" height="3" rx="0.5" fill="white" fillOpacity={0.8} />
    <rect x="15"  y="13" width="3" height="3" rx="0.5" fill="white" fillOpacity={0.4} />
  </Icon>
)

export const EmailIcon = () => (
  <Icon bg="#0EA5E9">
    <rect x="2" y="6" width="20" height="13" rx="2" fill="white" fillOpacity={0.2} stroke="white" strokeWidth={1.5} />
    <path d="M2 9l10 6 10-6" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Icon>
)

export const PhoneIcon = () => (
  <Icon bg="#16A34A">
    <path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.25c1.12.37 2.33.57 3.58.57A1 1 0 0 1 21 16.5V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.23 1.01l-2.22 2.21Z" fill="white" fillOpacity={0.25} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
  </Icon>
)

export const DatabaseIcon = () => (
  <Icon bg="#7C3AED">
    <ellipse cx="12" cy="6" rx="8" ry="2.5" fill="white" fillOpacity={0.4} stroke="white" strokeWidth={1.5} />
    <path d="M4 6v5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5V6" stroke="white" strokeWidth={1.5} />
    <path d="M4 11v6c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-6" stroke="white" strokeWidth={1.5} />
  </Icon>
)

export const CloudIcon = () => (
  <Icon bg="#06B6D4">
    <path d="M17.5 19H7a5 5 0 1 1 .9-9.9 7 7 0 1 1 12.4 4.4A4 4 0 0 1 17.5 19Z" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
  </Icon>
)

export const StoreIcon = () => (
  <Icon bg="#F97316">
    <path d="M3 9l2-5h14l2 5" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 9h20v2a3 3 0 0 1-3 3 3 3 0 0 1-5-1 3 3 0 0 1-4 1A3 3 0 0 1 5 14a3 3 0 0 1-3-3V9Z" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M5 14v7h14v-7" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <rect x="9" y="17" width="6" height="4" rx="0.5" fill="white" fillOpacity={0.5} />
  </Icon>
)

export const HealthIcon = () => (
  <Icon bg="#EF4444">
    <circle cx="12" cy="12" r="8.5" fill="white" fillOpacity={0.15} stroke="white" strokeWidth={1.5} />
    <rect x="10" y="7"  width="4" height="10" rx="1" fill="white" fillOpacity={0.9} />
    <rect x="7"  y="10" width="10" height="4" rx="1" fill="white" fillOpacity={0.9} />
  </Icon>
)

export const EducationIcon = () => (
  <Icon bg="#6366F1">
    {/* mortarboard */}
    <path d="M12 4L2 10l10 6 10-6-10-6Z" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M6 13.5v4c3 2.5 9 2.5 12 0v-4" stroke="white" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 10v5" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
  </Icon>
)

export const MarketingIcon = () => (
  <Icon bg="#EC4899">
    {/* megaphone */}
    <path d="M18 8.5V16a1 1 0 0 1-1.66.75L12 13.5H8a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h4l4.34-3.25A1 1 0 0 1 18 6v2.5Z" fill="white" fillOpacity={0.3} stroke="white" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M9.5 13.5l-1 4" stroke="white" strokeWidth={1.5} strokeLinecap="round" />
    <circle cx="21" cy="10" r="2" fill="white" fillOpacity={0.5} stroke="white" strokeWidth={1.5} />
  </Icon>
)

// ---------------------------------------------------------------------------
// UI / Shell icons  (monochrome — these are chrome, not module icons)
// ---------------------------------------------------------------------------

export const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth={1.5} />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={1.5} />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const HelpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.5} />
    <path d="M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-2.5 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="0.75" fill="currentColor" />
  </svg>
)

export const AppearanceIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M12 3a9 9 0 1 0 4.5 16.8c.7-.4.5-1.5-.3-1.8a2 2 0 0 1 .3-3.8H18a3 3 0 0 0 3-3 9 9 0 0 0-9-8.2Z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="7.5" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="8.5" r="1" fill="currentColor" />
    <circle cx="13" cy="7.5" r="1" fill="currentColor" />
    <circle cx="16" cy="10" r="1" fill="currentColor" />
  </svg>
)

export const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const MenuIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <rect x="3" y="5"  width="18" height="2" rx="1" fill="currentColor" />
    <rect x="3" y="11" width="18" height="2" rx="1" fill="currentColor" />
    <rect x="3" y="17" width="18" height="2" rx="1" fill="currentColor" />
  </svg>
)

export const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth={1.5} />
    <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const BellIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M6 10a6 6 0 1 1 12 0c0 3.5 1.5 5 2 6H4c.5-1 2-2.5 2-6Z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M10 18a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const AppsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-4 h-4">
    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={1.5} />
    <rect x="14" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={1.5} />
    <rect x="3" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={1.5} />
    <rect x="14" y="14" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth={1.5} />
  </svg>
)

export const FallbackIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <rect x="3" y="3" width="18" height="18" rx="2" fill="currentColor" fillOpacity={0.1} stroke="currentColor" strokeWidth={1.5} />
    <path d="M3 9h18M9 21V9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const FilterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3Z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20.49 9a9 9 0 0 0-15.27-3.36L1 10M23 14l-4.22 4.36A9 9 0 0 1 3.51 15" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const LinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ExternalLinkIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 3h6v6M10 14L21 3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={1.5} />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={1.5} />
    <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={1.5} />
  </svg>
)

export const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82Z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
  </svg>
)

export const ChevronDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ChevronUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ArrowUpIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const ArrowDownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const SortIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M8 16V4M4 12l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 8v12M20 12l-4-4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

export const DocsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M4 4h10l6 6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M14 4v6h6" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
  </svg>
)

export const PrinterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="w-5 h-5">
    <path d="M6 9V2h12v7" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" />
    <rect x="6" y="14" width="12" height="8" rx="1" stroke="currentColor" strokeWidth={1.5} />
  </svg>
)

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerBuiltinIcons(): void {
  iconRegistry.registerAll({
    // Navigation / generic
    home:               () => <HomeIcon />,
    "getting-started":  () => <HomeIcon />,
    dashboard:          () => <DashboardIcon />,
    reports:            () => <ReportsIcon />,
    analytics:          () => <AnalyticsIcon />,
    workflow:           () => <WorkflowIcon />,
    integration:        () => <IntegrationIcon />,
    settings:           () => <SettingsIcon />,
    setting:            () => <SettingsIcon />,
    users:              () => <UsersIcon />,
    organization:       () => <UsersIcon />,
    file:               () => <FileIcon />,
    tool:               () => <ToolIcon />,
    security:           () => <SecurityIcon />,
    calendar:           () => <CalendarIcon />,
    database:           () => <DatabaseIcon />,
    cloud:              () => <CloudIcon />,

    // Finance
    accounting:         () => <AccountingIcon />,
    "arrow-left":       () => <AccountingIcon />,
    "arrow-right":      () => <AccountingIcon />,
    payroll:            () => <PayrollIcon />,
    invoice:            () => <InvoiceIcon />,
    finance:            () => <FinanceIcon />,
    bank:               () => <BankIcon />,
    institution:        () => <BankIcon />,

    // Supply chain
    buying:             () => <BuyingIcon />,
    sell:               () => <SellingIcon />,
    selling:            () => <SellingIcon />,
    stock:              () => <StockIcon />,
    assets:             () => <AssetsIcon />,
    logistics:          () => <LogisticsIcon />,
    manufacturing:      () => <ManufacturingIcon />,
    store:              () => <StoreIcon />,
    shop:               () => <StoreIcon />,
    build:              () => <BuildIcon />,
    construction:       () => <BuildIcon />,

    // People
    hr:                 () => <HRIcon />,
    "human-resource":   () => <HRIcon />,
    crm:                () => <CRMIcon />,
    support:            () => <SupportIcon />,
    email:              () => <EmailIcon />,
    mail:               () => <EmailIcon />,
    phone:              () => <PhoneIcon />,
    contact:            () => <PhoneIcon />,
    marketing:          () => <MarketingIcon />,

    // Operations
    project:            () => <ProjectIcon />,
    quality:            () => <QualityIcon />,
    website:            () => <WebsiteIcon />,
    health:             () => <HealthIcon />,
    healthcare:         () => <HealthIcon />,
    education:          () => <EducationIcon />,
    training:           () => <EducationIcon />,

    // Fallback for unknown Frappe icon names
    grid:               () => <FallbackIcon />,
  })
}
