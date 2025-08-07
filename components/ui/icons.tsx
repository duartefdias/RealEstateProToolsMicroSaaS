import {
  Loader2,
  Mail,
  Eye,
  EyeOff,
  User,
  Settings,
  LogOut,
  Calculator,
  Home,
  Building2,
  TrendingUp,
  BarChart3,
  Users,
  CheckSquare,
  Calendar,
  FileText,
  CreditCard,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  Minus,
  Edit,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  HelpCircle,
  ExternalLink,
  Copy,
  Share,
  Star,
  Heart,
  Bookmark,
  Flag,
  Menu,
  type LucideIcon,
} from 'lucide-react'

export type Icon = LucideIcon

export const Icons = {
  // Loading
  spinner: Loader2,
  
  // Auth & User
  mail: Mail,
  eye: Eye,
  eyeOff: EyeOff,
  user: User,
  logOut: LogOut,
  
  // Navigation
  home: Home,
  calculator: Calculator,
  building: Building2,
  trending: TrendingUp,
  chart: BarChart3,
  users: Users,
  tasks: CheckSquare,
  calendar: Calendar,
  settings: Settings,
  
  // Actions
  plus: Plus,
  minus: Minus,
  edit: Edit,
  trash: Trash2,
  search: Search,
  filter: Filter,
  download: Download,
  upload: Upload,
  copy: Copy,
  share: Share,
  external: ExternalLink,
  
  // UI Elements
  menu: Menu,
  more: MoreHorizontal,
  chevronDown: ChevronDown,
  chevronUp: ChevronUp,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  close: X,
  check: Check,
  
  // Status & Alerts
  alert: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  help: HelpCircle,
  
  // Content
  file: FileText,
  card: CreditCard,
  bell: Bell,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  flag: Flag,
  
  // Custom Google Icon
  google: ({ ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h240z"
      />
    </svg>
  ),
  
  // Logo placeholder
  logo: ({ ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9,22 9,12 15,12 15,22" />
    </svg>
  ),
}