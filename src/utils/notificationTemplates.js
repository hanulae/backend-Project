/**
 * 알림 템플릿 정의
 */
export const NOTIFICATION_TEMPLATES = {
  // 견적 관련
  manager_form_created: {
    title: '새로운 견적 요청',
    body: (data) => `${data.chiefMournerName || '고객'}님으로부터 견적 요청이 도착했습니다.`,
    icon: 'form',
  },
  bid_submitted: {
    title: '입찰 제안 도착',
    body: (data) => `${data.funeralName || '장례식장'}에서 입찰 제안이 도착했습니다.`,
    icon: 'bid',
  },

  // 출동 관련
  dispatch_requested: {
    title: '출동 신청',
    body: (data) => `${data.managerName || '상조팀장'}님이 출동을 신청했습니다.`,
    icon: 'dispatch',
  },
  dispatch_approved: {
    title: '출동 승인',
    body: (data) => `${data.funeralName || '장례식장'}에서 출동 요청이 승인되었습니다.`,
    icon: 'check',
  },
  dispatch_cancelled: {
    title: '출동 취소',
    body: (data) => `${data.chiefMournerName || '고객'}님의 출동 신청이 취소되었습니다.`,
    icon: 'cancel',
  },
  dispatch_rejected: {
    title: '출동 거절',
    body: (data) => `${data.funeralName || '장례식장'}에서 출동 요청을 거절하였습니다.`,
    icon: 'reject',
  },

  // 거래 관련
  transaction_completed_requested: {
    title: '거래 완료 요청',
    body: (data) => `${data.requesterName || '상대방'}이 거래 완료를 요청했습니다.`,
    icon: 'request',
  },
  transaction_completed: {
    title: '거래 완료',
    body: (data) =>
      `거래가 성공적으로 완료되었습니다. ${data.amount ? ` ${data.amount.toLocaleString()}원` : ''}`,
    icon: 'money',
  },

  // 환급 관련
  cash_refund_requested: {
    title: '환급 요청',
    body: (data) => `${data.amount ? data.amount.toLocaleString() : ''}원 환급이 요청되었습니다.`,
    icon: 'refund',
  },
  cash_refund_approved: {
    title: '환급 승인',
    body: (data) =>
      `${data.amount ? `${data.amount.toLocaleString()}원` : ''} 환급이 승인되었습니다.`,
    icon: 'approve',
  },
  cash_refund_rejected: {
    title: '환급 거절',
    body: (data) => `환급 요청이 거절되었습니다. ${data.reason || ''}`,
    icon: 'reject',
  },

  // 관리자 관련
  account_approved: {
    title: '계정 승인',
    body: () => '회원가입이 승인되었습니다. 이제 서비스를 이용하실 수 있습니다.',
    icon: 'user',
  },

  point_granted: {
    title: '포인트 지급',
    body: (data) => `${data.amount ? data.amount.toLocaleString() : ''}P가 지급되었습니다.`,
    icon: 'point',
  },

  cash_granted: {
    title: '캐시 지급',
    body: (data) => `${data.amount ? data.amount.toLocaleString() : ''}원이 지급되었습니다.`,
    icon: 'cash',
  },
};

/**
 * 알림 내용 생성
 */
export function getNotificationContent(type, data = {}) {
  const template = NOTIFICATION_TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown notification type: ${type}`);
  }

  return {
    title: template.title,
    body: typeof template.body === 'function' ? template.body(data) : template.body,
    icon: template.icon,
  };
}

/**
 * 사용자 타입별 알림 권한 체크
 */
export const NOTIFICATION_PERMISSIONS = {
  manager: [
    'bid_submitted',
    'dispatch_approved',
    'dispatch_rejected',
    'transaction_completed_requested',
    'transaction_completed',
    'cash_refund_approved',
    'cash_refund_rejected',
    'account_approved',
    'point_granted',
    'cash_granted',
  ],
  funeral: [
    'manager_form_created',
    'dispatch_requested',
    'transaction_completed_requested',
    'transaction_completed',
    'cash_refund_approved',
    'cash_refund_rejected',
    'account_approved',
    'point_granted',
    'cash_granted',
  ],
  funeralStaff: [
    'manager_form_created',
    'dispatch_requested',
    'transaction_completed_requested',
    'transaction_completed',
  ],
  admin: ['cash_refund_requested', 'account_approved'],
};

/**
 * 사용자가 해당 알림을 받을 수 있는지 확인
 */
export function canReceiveNotification(userType, notificationType) {
  const permissions = NOTIFICATION_PERMISSIONS[userType];
  return permissions && permissions.includes(notificationType);
}

/**
 * 알림 우선순위 정의
 */
export const NOTIFICATION_PRIORITY = {
  high: ['dispatch_approved', 'dispatch_rejected', 'transaction_completed'],
  normal: [
    'manager_form_created',
    'bid_submitted',
    'dispatch_requested',
    'transaction_completed_requested',
  ],
  low: ['account_approved', 'point_granted', 'cash_granted'],
};

/**
 * 알림 우선순위 조회
 */
export function getNotificationPriority(notificationType) {
  for (const [priority, types] of Object.entries(NOTIFICATION_PRIORITY)) {
    if (types.includes(notificationType)) {
      return priority;
    }
  }
  return 'normal';
}
