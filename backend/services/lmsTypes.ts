export type LmsUserRole = "SUPER_ADMIN" | "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export type UserAccountStatus = "ACTIVE" | "PENDING" | "REJECTED" | "SUSPENDED";

export type TeacherApplicationStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "RESUBMISSION_REQUIRED"
  | "SUSPENDED";

export type StudentAccessStatus =
  | "REGISTERED"
  | "ENROLLED"
  | "ACTIVE_PAID"
  | "EXPIRED"
  | "AWAITING_CONFIRMATION"
  | "SCHOLARSHIP_GRANTED";

export type PaymentProvider = "PAYSTACK" | "BANK_TRANSFER" | "SCHOLARSHIP" | "MANUAL_ADMIN";
export type PaymentStatus = "AWAITING_CONFIRMATION" | "VERIFIED" | "FAILED" | "REFUNDED";
export type TeachingMode = "ONLINE" | "PHYSICAL" | "HYBRID";
export type TimetablePublicationStatus = "DRAFT" | "PUBLISHED" | "CANCELLED";
export type ClassroomLifecycleStatus = "SCHEDULED" | "PREPARED" | "LIVE" | "ENDED" | "CANCELLED";

export interface SchoolRecord {
  id: string;
  name: string;
  code: string;
  state: string;
  address: string;
  timezone: string;
  status: "ACTIVE" | "SUSPENDED";
  createdAt: string;
}

export interface ClassLevelRecord {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  category: "JSS" | "SSS" | "PRIMARY" | "OTHER";
  sortOrder: number;
  isActive: boolean;
}

export interface SubjectRecord {
  id: string;
  schoolId: string;
  code: string;
  name: string;
  department: "Science" | "Arts" | "Commercial" | "Core";
  description: string;
  classLevelIds: string[];
  isActive: boolean;
}

export interface AcademicSessionRecord {
  id: string;
  name: string;
  isCurrent: boolean;
}

export interface AcademicTermRecord {
  id: string;
  sessionId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  isCurrent: boolean;
}

export interface TeacherSubjectApplication {
  id: string;
  teacherUserId: string;
  teacherName: string;
  teacherEmail: string;
  subjectId: string;
  subjectName: string;
  classLevelIds: string[];
  qualification: string;
  institution: string;
  experience: string;
  licenseNumber: string;
  bio: string;
  documentUrls: {
    profilePhoto?: string;
    teachingCertificate?: string;
    degreeCertificate?: string;
    governmentId?: string;
    cv?: string;
  };
  status: TeacherApplicationStatus;
  adminExplanation?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherSubjectApproval {
  id: string;
  teacherUserId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  classLevelId: string;
  classLevelName: string;
  applicationId?: string;
  status: "APPROVED" | "SUSPENDED" | "REVOKED";
  approvedBy: string;
  reason?: string;
  approvedAt: string;
}

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  billingCycle: "MONTHLY" | "TERM" | "SESSION";
  priceNgn: number;
  allSubjectsIncluded: boolean;
  includedSubjectIds: string[];
  durationDays: number;
  isActive: boolean;
  description: string;
}

export interface StudentEnrolmentRecord {
  id: string;
  studentUserId: string;
  studentName: string;
  studentEmail: string;
  classLevelId: string;
  subjectIds: string[];
  status: "REGISTERED" | "ENROLLED";
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  studentUserId: string;
  studentName: string;
  studentEmail: string;
  planId?: string;
  planName: string;
  classLevelId: string;
  subjectIds: string[];
  amountNgn: number;
  provider: PaymentProvider;
  reference: string;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
}

export interface StudentEntitlementRecord {
  id: string;
  studentUserId: string;
  studentName: string;
  studentEmail: string;
  classLevelId: string;
  subjectIds: string[];
  allSubjects: boolean;
  accessStatus: StudentAccessStatus;
  paymentId?: string;
  startsAt: string;
  expiresAt?: string;
  grantedBy?: string;
  reason?: string;
  updatedAt: string;
}

export interface TimetableEntryRecord {
  id: string;
  sessionId: string;
  termId: string;
  classLevelId: string;
  subjectId: string;
  assignedTeacherIds: string[];
  dayOfWeek: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  startTime: string; // HH:mm 24h
  endTime: string;   // HH:mm 24h
  durationMinutes: number;
  mode: TeachingMode;
  maxCapacityPerRoom: number;
  publicationStatus: TimetablePublicationStatus;
  allocationStatus: "OK" | "SHORTFALL" | "UNALLOCATED";
  eligibleStudentCount: number;
  shortfallCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentGroupRecord {
  id: string;
  timetableEntryId: string;
  groupNumber: number;
  groupName: string;
  teacherUserId: string;
  teacherName: string;
  maxCapacity: number;
  studentUserIds: string[];
  createdAt: string;
}

export interface ClassroomMaterialRecord {
  id: string;
  title: string;
  type: "PDF" | "SLIDES" | "WORKSHEET" | "LINK";
  url?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ClassroomRecord {
  id: string;
  timetableEntryId: string;
  studentGroupId: string;
  groupName: string;
  teacherUserId: string;
  teacherName: string;
  classLevelId: string;
  classLevelName: string;
  subjectId: string;
  subjectName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  mode: TeachingMode;
  maxCapacity: number;
  studentUserIds: string[];
  lessonTitle: string;
  lessonDescription: string;
  lessonObjectives: string;
  lessonNotes: string;
  assignmentsText: string;
  materials: ClassroomMaterialRecord[];
  status: ClassroomLifecycleStatus;
  preparedAt?: string;
  startedAt?: string;
  endedAt?: string;
  durationSeconds: number;
}

export interface AttendanceRecord {
  id: string;
  classroomId: string;
  studentUserId: string;
  studentName: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  joinedAt?: string;
  recordedBy: string;
  updatedAt: string;
}

export type VideoSourceType = "UPLOADED_VIDEO" | "YOUTUBE" | "EXTERNAL_LINK";
export type VideoPublishStatus = "PUBLISHED" | "PENDING_REVIEW" | "REVISION_REQUESTED" | "ARCHIVED";
export type VideoUploadRequestStatus =
  | "REQUESTED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "APPROVED"
  | "REVISION_REQUESTED";

export interface CurriculumTopicRecord {
  id: string;
  subjectId: string;
  termId: string;
  classLevelId: string;
  topicOrder: number;
  weekLabel?: string;
  title: string;
  description: string;
  isPublished: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoLessonMaterialRecord {
  id: string;
  title: string;
  type: "PDF" | "WORKSHEET" | "SLIDES" | "NOTES" | "LINK";
  url: string;
  fileName?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  contentText?: string;
  createdAt: string;
}

export interface VideoLessonRecord {
  id: string;
  topicId: string;
  subjectId: string;
  termId: string;
  classLevelId: string;
  title: string;
  description: string;
  sourceType: VideoSourceType;
  videoUrl: string;
  youtubeVideoId?: string;
  storagePath?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  durationLabel?: string;
  materials?: VideoLessonMaterialRecord[];
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByRole: LmsUserRole;
  status: VideoPublishStatus;
  reviewNotes?: string;
  requestId?: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoUploadRequestRecord {
  id: string;
  topicId: string;
  subjectId: string;
  termId: string;
  classLevelId: string;
  teacherUserId: string;
  teacherName: string;
  requestedByUserId: string;
  requestedByName: string;
  instructions: string;
  dueDate?: string;
  status: VideoUploadRequestStatus;
  fulfilledVideoId?: string;
  adminReviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PersistentNotification {
  id: string;
  recipientUserId: string;
  recipientRole?: LmsUserRole | "ALL_ADMINS";
  category:
    | "TEACHER_APPLICATION"
    | "TIMETABLE"
    | "ALLOCATION"
    | "CLASSROOM"
    | "SUBSCRIPTION"
    | "VIDEO_LESSON"
    | "SYSTEM_ALERT";
  title: string;
  message: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  actorUserId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PlatformSettingsRecord {
  platformName: string;
  defaultTimezone: string;
  defaultRoomCapacity: number;
  paystackPublicKeyConfigured: boolean;
  paystackServerEnabled: boolean;
  allowManualBankTransfer: boolean;
  superAdminEmails: string[];
}

export interface LmsStateData {
  schools: SchoolRecord[];
  classLevels: ClassLevelRecord[];
  subjects: SubjectRecord[];
  sessions: AcademicSessionRecord[];
  terms: AcademicTermRecord[];
  subscriptionPlans: SubscriptionPlanRecord[];
  platformSettings: PlatformSettingsRecord;
  teacherApplications: TeacherSubjectApplication[];
  teacherApprovals: TeacherSubjectApproval[];
  studentEnrolments: StudentEnrolmentRecord[];
  paymentRecords: PaymentRecord[];
  studentEntitlements: StudentEntitlementRecord[];
  timetableEntries: TimetableEntryRecord[];
  studentGroups: StudentGroupRecord[];
  classrooms: ClassroomRecord[];
  attendanceRecords: AttendanceRecord[];
  curriculumTopics: CurriculumTopicRecord[];
  videoLessons: VideoLessonRecord[];
  videoUploadRequests: VideoUploadRequestRecord[];
  notifications: PersistentNotification[];
  auditLogs: AuditLogRecord[];
}
