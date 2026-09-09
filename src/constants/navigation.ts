/**
 * Navigation models per area. Kept as data (not JSX) so sidebars/headers stay
 * pure renderers and links are reusable for breadcrumbs / command palette.
 * `labelKey` / `titleKey` reference the `Nav` message namespace.
 *
 * Areas: public (marketing) · /admin (console) · /staff (CRM/finance/teaching)
 * · /student (portal). Admin pages live under the real `/admin` segment so the
 * public catalog can own `/courses`.
 */
export interface NavItem {
  titleKey: string;
  href: string;
  icon: string; // lucide icon name, resolved in the sidebar
  badge?: string;
  /**
   * If set, the item is only shown when the user has AT LEAST ONE of these
   * permission keys (mirrors old codebase AdminSidebarPanel hasAccess logic).
   */
  requiredPermissions?: string[];
  /**
   * If true, the item is hidden from any user who HAS a staffRole
   * (i.e. it is reserved for super-admins only).
   */
  adminOnly?: boolean;
  /**
   * If set, the item is hidden when that site-settings feature flag is
   * explicitly disabled (key of SiteSettings.features, e.g. "blog"|"events").
   */
  feature?: string;
}

export interface NavSection {
  labelKey: string;
  items: NavItem[];
}

export const ADMIN_NAV: NavSection[] = [
  {
    labelKey: "sectionOverview",
    items: [
      {
        titleKey: "dashboard",
        href: "/admin/dashboard",
        icon: "LayoutDashboard",
      },
    ],
  },
  {
    labelKey: "sectionCrm",
    items: [
      {
        titleKey: "crmDashboard",
        href: "/admin/crm",
        icon: "LayoutDashboard",
        requiredPermissions: ["crm.dashboard.view"],
      },
      {
        titleKey: "leads",
        href: "/admin/crm/leads",
        icon: "Target",
        requiredPermissions: ["crm.leads.view"],
      },
      {
        titleKey: "allPipelines",
        href: "/admin/crm/pipelines",
        icon: "GitBranch",
        requiredPermissions: ["crm.pipelines.view"],
      },
      {
        titleKey: "paymentTracking",
        href: "/admin/crm/payment-tracking",
        icon: "Wallet",
        requiredPermissions: ["finance.payment_tracking.view"],
      },
      {
        titleKey: "invoices",
        href: "/admin/crm/invoices",
        icon: "ReceiptText",
        requiredPermissions: ["finance.invoices.view"],
      },
      {
        titleKey: "commission",
        href: "/admin/crm/commission",
        icon: "Coins",
        requiredPermissions: ["crm.commission.view"],
      },
      {
        titleKey: "office",
        href: "/admin/crm/office",
        icon: "Briefcase",
        requiredPermissions: ["crm.office.view"],
      },
      {
        titleKey: "paymentLinks",
        href: "/admin/crm/payment-links",
        icon: "Link2",
        requiredPermissions: ["crm.payment_links.view"],
      },
      {
        titleKey: "crmCertificates",
        href: "/admin/crm/certificates",
        icon: "Award",
        requiredPermissions: ["lms.certificates.view"],
      },
      {
        titleKey: "rulesRegulations",
        href: "/admin/crm/rules",
        icon: "ScrollText",
        requiredPermissions: ["crm.rules.view"],
      },
      {
        titleKey: "crmSettings",
        href: "/admin/crm/settings",
        icon: "SlidersHorizontal",
        adminOnly: true,
      },
    ],
  },
  {
    labelKey: "sectionCourses",
    items: [
      {
        titleKey: "courses",
        href: "/admin/courses",
        icon: "GraduationCap",
        requiredPermissions: ["lms.courses.view"],
      },
      {
        titleKey: "newCourse",
        href: "/admin/courses/new",
        icon: "Plus",
        requiredPermissions: ["lms.courses.create"],
      },
      {
        titleKey: "registrations",
        href: "/admin/courses/registrations",
        icon: "UserPlus",
        requiredPermissions: ["lms.courses.view"],
      },
      {
        titleKey: "courseSettings",
        href: "/admin/courses/settings",
        icon: "SlidersHorizontal",
        adminOnly: true,
      },
    ],
  },
  {
    labelKey: "sectionLms",
    items: [
      {
        titleKey: "lms",
        href: "/admin/lms",
        icon: "Play",
        requiredPermissions: ["lms.courses.view"],
      },
      {
        titleKey: "lmsSettings",
        href: "/admin/lms/settings",
        icon: "SlidersHorizontal",
        adminOnly: true,
      },
    ],
  },
  {
    labelKey: "sectionGraduates",
    items: [
      {
        titleKey: "graduates",
        href: "/admin/graduates",
        icon: "Award",
        requiredPermissions: ["crm.groups.view"],
      },
    ],
  },
  {
    labelKey: "sectionGroups",
    items: [
      {
        titleKey: "groups",
        href: "/admin/groups",
        icon: "UsersRound",
        requiredPermissions: ["crm.groups.view"],
      },
      {
        titleKey: "groupSettings",
        href: "/admin/groups/settings",
        icon: "SlidersHorizontal",
        adminOnly: true,
      },
    ],
  },
  {
    labelKey: "sectionAssessment",
    items: [
      {
        titleKey: "quizzes",
        href: "/admin/quizzes",
        icon: "ListChecks",
        adminOnly: true,
        feature: "questionBanks",
      },
      {
        titleKey: "assignments",
        href: "/admin/assignments",
        icon: "ClipboardList",
        adminOnly: true,
      },
      {
        titleKey: "certificates",
        href: "/admin/certificates",
        icon: "Award",
        requiredPermissions: ["lms.certificates.view"],
      },
      {
        titleKey: "events",
        href: "/admin/events",
        icon: "CalendarDays",
        adminOnly: true,
        feature: "events",
      },
    ],
  },
  {
    labelKey: "sectionUsers",
    items: [
      {
        titleKey: "users",
        href: "/admin/users",
        icon: "UserCog",
        adminOnly: true,
      },
      {
        titleKey: "roles",
        href: "/admin/users/roles",
        icon: "ShieldCheck",
        adminOnly: true,
      },
    ],
  },
  {
    labelKey: "sectionPeople",
    items: [
      {
        titleKey: "students",
        href: "/admin/students",
        icon: "GraduationCap",
        requiredPermissions: ["students.directory.view"],
      },
      {
        titleKey: "instructors",
        href: "/admin/instructors",
        icon: "Users",
        adminOnly: true,
      },
      {
        titleKey: "instructorApplications",
        href: "/admin/instructor-applications",
        icon: "UserPlus",
        adminOnly: true,
      },
    ],
  },
  {
    labelKey: "sectionTransactions",
    items: [
      {
        titleKey: "transactions",
        href: "/admin/transactions",
        icon: "Wallet",
        requiredPermissions: ["finance.refunds.view", "finance.invoices.view"],
      },
      {
        titleKey: "payments",
        href: "/admin/payments",
        icon: "CreditCard",
        requiredPermissions: ["finance.invoices.view"],
      },
      {
        titleKey: "refunds",
        href: "/admin/refunds",
        icon: "Undo2",
        requiredPermissions: ["finance.refunds.view"],
      },
    ],
  },
  {
    labelKey: "sectionBlog",
    items: [
      {
        titleKey: "blogArticles",
        href: "/admin/blog",
        icon: "Newspaper",
        adminOnly: true,
        feature: "blog",
      },
      {
        titleKey: "blogTemplates",
        href: "/admin/blog/templates",
        icon: "LayoutTemplate",
        adminOnly: true,
        feature: "blog",
      },
      {
        titleKey: "blogCategories",
        href: "/admin/blog/categories",
        icon: "FolderTree",
        adminOnly: true,
        feature: "blog",
      },
      {
        titleKey: "blogAuthors",
        href: "/admin/blog/authors",
        icon: "PenTool",
        adminOnly: true,
        feature: "blog",
      },
    ],
  },
  {
    labelKey: "sectionMarketing",
    items: [
      {
        titleKey: "landingPages",
        href: "/admin/marketing/landing",
        icon: "LayoutTemplate",
        adminOnly: true,
      },
      {
        titleKey: "examLeads",
        href: "/admin/marketing/leads",
        icon: "UserPlus",
        adminOnly: true,
      },
      {
        titleKey: "freeCourses",
        href: "/admin/marketing/free-courses",
        icon: "PlayCircle",
        adminOnly: true,
      },
      {
        titleKey: "emailMarketing",
        href: "/admin/marketing/email",
        icon: "Mail",
        adminOnly: true,
      },
      {
        titleKey: "seoManager",
        href: "/admin/marketing/seo",
        icon: "FileSearch",
        adminOnly: true,
      },
      {
        titleKey: "studentReviews",
        href: "/admin/marketing/reviews",
        icon: "MessageSquareQuote",
        adminOnly: true,
      },
      {
        titleKey: "platformMarketing",
        href: "/admin/marketing/platform",
        icon: "Megaphone",
        adminOnly: true,
      },
    ],
  },
  {
    labelKey: "sectionAdministration",
    items: [
      { titleKey: "notifications", href: "/admin/notifications", icon: "Bell" },
      {
        titleKey: "whatsapp",
        href: "/admin/whatsapp-templates",
        icon: "Mail",
        adminOnly: true,
      },
      {
        titleKey: "settings",
        href: "/admin/settings",
        icon: "Settings",
        adminOnly: true,
      },
      {
        titleKey: "reports",
        href: "/admin/reports",
        icon: "ChartLine",
        adminOnly: true,
      },
    ],
  },
  {
    /*
     * Onboarding, deliberately ungated. Every person who answers a customer
     * needs it on their first day, and that includes staff whose permission map
     * grants them almost nothing else yet.
     */
    labelKey: "sectionOrientation",
    items: [
      {
        titleKey: "salesOrientation",
        href: "/admin/orientation",
        icon: "GraduationCap",
      },
    ],
  },
  {
    labelKey: "sectionAccount",
    items: [{ titleKey: "profile", href: "/admin/profile", icon: "UserCog" }],
  },
];

export const STUDENT_NAV: NavSection[] = [
  {
    labelKey: "sectionLearning",
    items: [
      {
        titleKey: "dashboard",
        href: "/student/dashboard",
        icon: "LayoutDashboard",
      },
      {
        titleKey: "myCourses",
        href: "/student/courses",
        icon: "GraduationCap",
      },
      {
        titleKey: "assignments",
        href: "/student/assignments",
        icon: "ClipboardList",
      },
      { titleKey: "schedule", href: "/student/schedule", icon: "CalendarDays" },
      { titleKey: "grades", href: "/student/grades", icon: "ListChecks" },
      { titleKey: "transcript", href: "/student/transcript", icon: "FileText" },
      {
        titleKey: "transcripts",
        href: "/student/transcripts",
        icon: "FileText",
      },
    ],
  },
  {
    labelKey: "sectionAccount",
    items: [
      {
        titleKey: "certificates",
        href: "/student/certificates",
        icon: "Award",
      },
      { titleKey: "favorites", href: "/student/favorites", icon: "Heart" },
      { titleKey: "billing", href: "/student/billing", icon: "ReceiptText" },
      { titleKey: "payments", href: "/student/installments", icon: "Coins" },
      {
        titleKey: "paymentMethods",
        href: "/student/payment-methods",
        icon: "CreditCard",
      },
      {
        titleKey: "notifications",
        href: "/student/notifications",
        icon: "Bell",
      },
      { titleKey: "profile", href: "/student/profile", icon: "UserCog" },
      { titleKey: "settings", href: "/student/settings", icon: "Settings" },
    ],
  },
];

export const STAFF_NAV: NavSection[] = [
  {
    labelKey: "sectionCrm",
    items: [
      { titleKey: "crmDashboard", href: "/staff/crm", icon: "LayoutDashboard" },
      { titleKey: "myLeads", href: "/staff/leads", icon: "Target" },
      { titleKey: "pipeline", href: "/staff/pipeline", icon: "KanbanSquare" },
      {
        titleKey: "followUps",
        href: "/staff/follow-ups",
        icon: "CalendarDays",
      },
    ],
  },
  {
    labelKey: "sectionFinance",
    items: [
      { titleKey: "invoices", href: "/staff/invoices", icon: "ReceiptText" },
      { titleKey: "payments", href: "/staff/payments", icon: "CreditCard" },
      { titleKey: "refunds", href: "/staff/refunds", icon: "Undo2" },
    ],
  },
  {
    labelKey: "sectionWorkspace",
    items: [
      { titleKey: "myGroups", href: "/staff/my-groups", icon: "Users" },
      { titleKey: "notifications", href: "/staff/notifications", icon: "Bell" },
    ],
  },
  {
    labelKey: "sectionAccount",
    items: [
      { titleKey: "profile", href: "/staff/profile", icon: "UserCog" },
      { titleKey: "settings", href: "/staff/settings", icon: "Settings" },
    ],
  },
];

export const INSTRUCTOR_NAV: NavSection[] = [
  {
    labelKey: "sectionTeaching",
    items: [
      {
        titleKey: "dashboard",
        href: "/instructor/dashboard",
        icon: "LayoutDashboard",
      },
      {
        titleKey: "myCourses",
        href: "/instructor/courses",
        icon: "GraduationCap",
      },
      { titleKey: "quizzes", href: "/instructor/quizzes", icon: "ListChecks" },
      { titleKey: "events", href: "/instructor/events", icon: "CalendarDays" },
    ],
  },
  {
    labelKey: "sectionAnalytics",
    items: [
      {
        titleKey: "analytics",
        href: "/instructor/analytics",
        icon: "ChartLine",
      },
      { titleKey: "earnings", href: "/instructor/earnings", icon: "Wallet" },
    ],
  },
  {
    labelKey: "sectionWorkspace",
    items: [
      { titleKey: "profile", href: "/instructor/profile", icon: "UserCog" },
      { titleKey: "settings", href: "/instructor/settings", icon: "Settings" },
    ],
  },
];

/** Public marketing header links. */
/** Sentinel href marking the nav item the header renders as a dropdown. */
export const RESOURCES_HREF = "#resources";

export const PUBLIC_NAV: NavItem[] = [
  { titleKey: "navHome", href: "/", icon: "Home" },
  { titleKey: "navCourses", href: "/courses", icon: "GraduationCap" },
  { titleKey: "navFreeLectures", href: "/free-courses", icon: "PlayCircle" },
  // Rendered as a dropdown, not a link — RESOURCES_HREF is a sentinel, there is
  // no /resources page. The header swaps it for the Resources menu.
  { titleKey: "navResources", href: RESOURCES_HREF, icon: "BookOpen" },
  { titleKey: "navInstructors", href: "/instructors", icon: "Users" },
  { titleKey: "navGraduates", href: "/graduates", icon: "Award" },
  { titleKey: "navPartnership", href: "/lp/partnership", icon: "Handshake" },
  { titleKey: "navContact", href: "/contact", icon: "Mail" },
];

/** What lives under the public "Resources" menu. Blog moved here from top level. */
export const PUBLIC_RESOURCES: NavItem[] = [
  { titleKey: "navBlog", href: "/blog", icon: "Newspaper" },
  { titleKey: "navFreeExam", href: "/free-exam", icon: "ClipboardList" },
  { titleKey: "navReviews", href: "/success-stories", icon: "MessageSquareQuote" },
  { titleKey: "navVerify", href: "/verify-certificate", icon: "ShieldCheck" },
  { titleKey: "navHelp", href: "/help", icon: "CircleCheckBig" },
];

export const BRAND = {
  name: "IMETS",
  fullName: "IMETS Medical School",
} as const;
